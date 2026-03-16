"""ATS Checker routes - Resume analysis and scoring"""
from flask import Blueprint, request, jsonify
from auth.auth_handler import verify_token
from database.models import ApplicationModel
from utils.resume_parser import extract_text_from_base64
from utils.ats_analyzer import analyze_resume_for_ats, calculate_ats_improvements
from utils.cloudinary_handler import upload_resume_from_base64
from database.connection import get_db
import os
from datetime import datetime
from bson.objectid import ObjectId

ats_bp = Blueprint('ats', __name__)

def require_auth(f):
    """Decorator to require authentication"""
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"error": "Missing or invalid token"}), 401
        try:
            payload = verify_token(token)
            return f(payload, *args, **kwargs)
        except Exception as e:
            return jsonify({"error": str(e)}), 401
    wrapper.__name__ = f.__name__
    return wrapper

@ats_bp.route('/analyze', methods=['POST'])
@require_auth
def analyze_resume(payload):
    """
    Analyze a resume for ATS compatibility
    POST body: {
        "resume_base64": "...",
        "resume_filename": "...",
        "job_description": "..." (optional)
    }
    """
    try:
        data = request.get_json()
        
        if 'resume_base64' not in data or 'resume_filename' not in data:
            return jsonify({"error": "Missing resume_base64 or resume_filename"}), 400
        
        # Extract text from base64 PDF
        resume_text = extract_text_from_base64(data['resume_base64'])
        if not resume_text:
            return jsonify({"error": "Could not parse resume"}), 400
        
        job_description = data.get('job_description', '')
        
        # Analyze with Groq LLM
        analysis = analyze_resume_for_ats(resume_text, job_description)
        
        # Calculate improvements
        improvements = calculate_ats_improvements(analysis)
        
        # Try to upload to Cloudinary
        cloudinary_result = upload_resume_from_base64(
            data['resume_base64'],
            payload.get('user_id'),
            data['resume_filename']
        )
        
        # Store in database
        db = get_db()
        ats_checks = db.ats_checks
        
        ats_record = {
            "candidate_id": payload.get('user_id'),
            "candidate_email": payload.get('email'),
            "resume_filename": data['resume_filename'],
            "resume_text_length": len(resume_text),
            "ats_analysis": analysis,
            "improvements": improvements,
            "cloudinary_url": cloudinary_result.get("public_url") if cloudinary_result.get("success") else None,
            "cloudinary_resource_id": cloudinary_result.get("resource_id") if cloudinary_result.get("success") else None,
            "analyzed_at": datetime.utcnow(),
            "created_at": datetime.utcnow()
        }
        
        result = ats_checks.insert_one(ats_record)
        
        return jsonify({
            "success": True,
            "ats_check_id": str(result.inserted_id),
            "ats_score": analysis.get("ats_score"),
            "ats_compatibility": analysis.get("ats_compatibility"),
            "analysis": analysis,
            "improvements": improvements,
            "cloudinary_url": cloudinary_result.get("public_url") if cloudinary_result.get("success") else None
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ats_bp.route('/history', methods=['GET'])
@require_auth
def get_ats_history(payload):
    """Get candidate's ATS analysis history"""
    try:
        db = get_db()
        ats_checks = db.ats_checks
        
        checks = list(ats_checks.find(
            {"candidate_id": payload.get('user_id')}
        ).sort("created_at", -1).limit(10))
        
        for check in checks:
            check["_id"] = str(check["_id"])
            check["candidate_id"] = str(check["candidate_id"])
        
        return jsonify({
            "success": True,
            "history": checks
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ats_bp.route('/<ats_check_id>', methods=['GET'])
@require_auth
def get_ats_check(payload, ats_check_id):
    """Get specific ATS analysis result"""
    try:
        db = get_db()
        ats_checks = db.ats_checks
        
        check = ats_checks.find_one({
            "_id": ObjectId(ats_check_id),
            "candidate_id": payload.get('user_id')
        })
        
        if not check:
            return jsonify({"error": "ATS check not found"}), 404
        
        check["_id"] = str(check["_id"])
        check["candidate_id"] = str(check["candidate_id"])
        
        return jsonify({
            "success": True,
            "data": check
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ats_bp.route('/applied-resumes', methods=['GET'])
@require_auth
def get_applied_resumes(payload):
    """Get all resumes candidate has applied with (for viewing) - optimized"""
    try:
        db = get_db()
        apps_collection = db.applications
        jobs_collection = db.jobs
        
        # Get all applications for this candidate
        applications = list(apps_collection.find(
            {"candidate_id": payload.get('user_id')}
        ).sort("created_at", -1))
        
        if not applications:
            return jsonify({"success": True, "resumes": []}), 200
            
        # Batch fetch jobs
        job_ids = list(set([ObjectId(app.get("job_id")) for app in applications if app.get("job_id")]))
        jobs_cursor = jobs_collection.find({"_id": {"$in": job_ids}})
        jobs_map = {str(j["_id"]): j for j in jobs_cursor}
        
        resumes = []
        for app in applications:
            jid = app.get("job_id")
            job = jobs_map.get(jid)
            
            resumes.append({
                "application_id": str(app["_id"]),
                "job_title": job.get("job_title") if job else "Job Deleted",
                "company_name": job.get("company_name") if job else "N/A",
                "resume_filename": app.get("resume_filename"),
                "cloudinary_url": app.get("resume_url"),  # If available
                "applied_at": app.get("created_at"),
                "match_percentage": app.get("match_percentage"),
                "status": app.get("status")
            })
        
        return jsonify({
            "success": True,
            "resumes": resumes
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
