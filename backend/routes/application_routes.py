"""Application and resume handling routes"""
from flask import Blueprint, request, jsonify
from auth.auth_handler import verify_token
from models.db_models import ApplicationModel, JobModel
from utils.resume_parser import extract_text_from_base64
import base64
import os

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
    
    # Trigger AI pipeline processing (if available)
    try:
        if PIPELINE_AVAILABLE and run_application_pipeline:
            result = run_application_pipeline(
                application_id,
                data['job_id'],
                resume_text,
                job['description']
            )
            return jsonify({
                "success": True,
                "application_id": application_id,
                "message": "Application submitted and processed",
                "processing_result": result
            }), 201
        else:
            # Pipeline not available, return without processing
            return jsonify({
                "success": True,
                "application_id": application_id,
                "message": "Application submitted successfully (processing disabled)"
            }), 201
    except Exception as e:
        return jsonify({
            "success": False,
            "application_id": application_id,
            "error": str(e),
            "message": "Application submitted but processing failed"
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
