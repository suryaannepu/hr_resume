"""Application and resume handling routes"""
from flask import Blueprint, request, jsonify
from auth.auth_handler import verify_token
from models.db_models import ApplicationModel, JobModel
from utils.resume_parser import extract_text_from_base64
import base64
import os
from datetime import datetime

from database import get_applications_collection
from bson.objectid import ObjectId

from tasks.background import submit_task

# Agents pipeline - optional import
try:
    from agents.pipeline import run_application_pipeline
    PIPELINE_AVAILABLE = True
except (ImportError, ModuleNotFoundError) as e:
    print(f"⚠️  Warning: Agent pipeline not available: {e}")
    PIPELINE_AVAILABLE = False
    run_application_pipeline = None

applications_bp = Blueprint('applications', __name__)

def require_auth(f):
    """Decorator to require authentication"""
    def decorator(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"error": "No token provided"}), 401
        
        payload = verify_token(token)
        if not payload:
            return jsonify({"error": "Invalid token"}), 401
        
        return f(payload, *args, **kwargs)
    
    decorator.__name__ = f.__name__
    return decorator

@applications_bp.route('/apply', methods=['POST'])
@require_auth
def apply_to_job(payload):
    """Candidate applies to job with resume"""
    data = request.get_json()
    
    if 'job_id' not in data or 'resume_base64' not in data or 'resume_filename' not in data:
        return jsonify({"error": "Missing required fields"}), 400
    
    # Verify job exists
    job = JobModel.get_job(data['job_id'])
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    # Extract text from base64 PDF
    resume_text = extract_text_from_base64(data['resume_base64'])
    if not resume_text:
        return jsonify({"error": "Could not parse resume"}), 400
    
    # Create application
    application_id = ApplicationModel.create_application(
        job_id=data['job_id'],
        candidate_id=payload['user_id'],
        candidate_email=payload['email'],
        resume_text=resume_text,
        resume_filename=data['resume_filename']
    )

    # Mark processing + kick off async pipeline
    apps = get_applications_collection()
    apps.update_one(
        {"_id": ObjectId(application_id)},
        {"$set": {
            "status": "processing",
            "processing_step": "queued",
            "processing_started_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }}
    )

    if PIPELINE_AVAILABLE and run_application_pipeline:
        # Run in background so uploads return immediately
        submit_task(
            run_application_pipeline,
            application_id,
            data['job_id'],
            resume_text,
            job['description']
        )

        # Return immediately; UI can poll /status
        return jsonify({
            "success": True,
            "application_id": application_id,
            "status": "processing",
            "message": "Application submitted. AI agents are processing your resume now."
        }), 201

    # Pipeline not available, return without processing (keep as uploaded)
    apps.update_one(
        {"_id": ObjectId(application_id)},
        {"$set": {
            "status": "uploaded",
            "processing_step": "disabled",
            "updated_at": datetime.utcnow(),
        }}
    )
    return jsonify({
        "success": True,
        "application_id": application_id,
        "status": "uploaded",
        "message": "Application submitted successfully (AI processing disabled on server)."
    }), 201

@applications_bp.route('/status/<application_id>', methods=['GET'])
@require_auth
def get_application_status(payload, application_id):
    """Get application status and results"""
    app = ApplicationModel.get_application(application_id)
    
    if not app:
        return jsonify({"error": "Application not found"}), 404
    
    # Verify ownership
    if app['candidate_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403
    
    return jsonify(app), 200

@applications_bp.route('/candidate/all', methods=['GET'])
@require_auth
def get_candidate_applications(payload):
    """Get all applications for candidate"""
    applications = ApplicationModel.get_candidate_applications(payload['user_id'])
    return jsonify({"applications": applications}), 200

@applications_bp.route('/job/<job_id>/list', methods=['GET'])
@require_auth
def get_job_applications(payload, job_id):
    """Get all applications for a job (recruiter only)"""
    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    # Verify recruiter owns job
    if job['recruiter_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403
    
    applications = ApplicationModel.get_job_applications(job_id)
    return jsonify({"applications": applications}), 200
