"""Job posting routes"""
from flask import Blueprint, request, jsonify
from auth.auth_handler import verify_token
from database.models import JobModel
from bson.objectid import ObjectId

jobs_bp = Blueprint('jobs', __name__)

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

@jobs_bp.route('/create', methods=['POST'])
@require_auth
def create_job(payload):
    """Create new job posting"""
    data = request.get_json()
    
    required = ['job_title', 'description', 'required_skills', 'company_name']
    if not all(k in data for k in required):
        return jsonify({"error": "Missing required fields"}), 400
    
    job_id = JobModel.create_job(
        recruiter_id=payload['user_id'],
        company_name=data['company_name'],
        job_title=data['job_title'],
        description=data['description'],
        required_skills=data['required_skills']
    )
    
    return jsonify({
        "success": True,
        "job_id": job_id,
        "message": "Job created successfully"
    }), 201

@jobs_bp.route('/list', methods=['GET'])
def list_jobs():
    """List all available jobs"""
    jobs = JobModel.list_all_jobs()
    return jsonify({"jobs": jobs}), 200

@jobs_bp.route('/list-recruiter', methods=['GET'])
@require_auth
def list_recruiter_jobs(payload):
    """List jobs posted by recruiter"""
    jobs = JobModel.list_recruiter_jobs(payload['user_id'])
    return jsonify({"jobs": jobs}), 200

@jobs_bp.route('/<job_id>', methods=['GET'])
def get_job(job_id):
    """Get job details"""
    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    return jsonify(job), 200

@jobs_bp.route('/<job_id>/close', methods=['PUT'])
@require_auth
def close_job(payload, job_id):
    """Close a job posting"""
    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job['recruiter_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403
    
    JobModel.close_job(job_id)
    return jsonify({"success": True, "message": "Job closed successfully"}), 200

@jobs_bp.route('/<job_id>/reopen', methods=['PUT'])
@require_auth
def reopen_job(payload, job_id):
    """Reopen a closed job posting"""
    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job['recruiter_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403
    
    JobModel.reopen_job(job_id)
    return jsonify({"success": True, "message": "Job reopened successfully"}), 200
