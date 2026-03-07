"""Recruiter dashboard routes"""
from flask import Blueprint, request, jsonify
from auth.auth_handler import verify_token
from models.db_models import JobModel, ApplicationModel, ShortlistModel
from bson.objectid import ObjectId

recruiter_bp = Blueprint('recruiter', __name__)

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

@recruiter_bp.route('/dashboard', methods=['GET'])
@require_auth
def get_dashboard(payload):
    """Get recruiter dashboard data"""
    # Get recruiter's jobs
    jobs = JobModel.list_recruiter_jobs(payload['user_id'])
    
    # Get applications for each job
    dashboard_data = {
        "total_jobs": len(jobs),
        "jobs": []
    }
    
    total_applications = 0
    total_processed = 0
    
    for job in jobs:
        applications = ApplicationModel.get_job_applications(job['_id'])
        processed = [app for app in applications if app.get('status') == 'processed']
        
        shortlist = ShortlistModel.get_job_shortlist(job['_id'])
        approved = [s for s in shortlist if s.get('approved_by_recruiter')]
        
        job_data = {
            "job_id": job['_id'],
            "job_title": job['job_title'],
            "total_applications": len(applications),
            "processed_applications": len(processed),
            "shortlist_count": len(shortlist),
            "approved_count": len(approved),
            "applications": applications[:10]  # Last 10 for preview
        }
        
        dashboard_data["jobs"].append(job_data)
        total_applications += len(applications)
        total_processed += len(processed)
    
    dashboard_data["total_applications"] = total_applications
    dashboard_data["total_processed"] = total_processed
    
    return jsonify(dashboard_data), 200

@recruiter_bp.route('/job/<job_id>/ranked-candidates', methods=['GET'])
@require_auth
def get_ranked_candidates(payload, job_id):
    """Get ranked candidates for a job"""
    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    # Verify ownership
    if job['recruiter_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403
    
    # Get all applications (processed + processing), rank processed by match score
    applications = ApplicationModel.get_job_applications(job_id)
    processed_apps = [app for app in applications if app.get('status') == 'processed']
    pending_apps = [app for app in applications if app.get('status') != 'processed']

    processed_apps.sort(key=lambda x: x.get('match_score', 0), reverse=True)

    ranked = []
    for idx, app in enumerate(processed_apps):
        app['rank'] = idx + 1
        ranked.append(app)

    # Append pending at the end (no rank yet)
    for app in pending_apps:
        app['rank'] = None
        ranked.append(app)

    return jsonify({"candidates": ranked}), 200


@recruiter_bp.route('/job/<job_id>/candidate/<application_id>', methods=['GET'])
@require_auth
def get_candidate_detail(payload, job_id, application_id):
    """Get full candidate application detail for recruiter (including agent outputs)."""
    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    if job['recruiter_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403

    app = ApplicationModel.get_application(application_id)
    if not app or app.get("job_id") != job_id:
        return jsonify({"error": "Application not found"}), 404

    return jsonify({"application": app}), 200

@recruiter_bp.route('/job/<job_id>/recommendations', methods=['GET'])
@require_auth
def get_shortlist_recommendations(payload, job_id):
    """Get AI shortlist recommendations"""
    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    # Verify ownership
    if job['recruiter_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403
    
    applications = ApplicationModel.get_job_applications(job_id)
    processed_apps = [app for app in applications if app.get('status') == 'processed']
    processed_apps.sort(key=lambda x: x.get('match_score', 0), reverse=True)
    
    # Top candidates are recommendations
    recommendations = processed_apps[:5]
    
    return jsonify({
        "recommendations": recommendations,
        "total_candidates": len(processed_apps),
        "recommended_count": len(recommendations),
        "note": "These are AI recommendations. Final approval is yours."
    }), 200

@recruiter_bp.route('/job/<job_id>/shortlist/approve', methods=['POST'])
@require_auth
def approve_shortlist(payload, job_id):
    """Approve shortlist for a job"""
    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    # Verify ownership
    if job['recruiter_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.get_json()
    if 'candidate_ids' not in data:
        return jsonify({"error": "candidate_ids required"}), 400
    
    candidate_ids = data['candidate_ids']
    
    # Get or create shortlist entries
    applications = ApplicationModel.get_job_applications(job_id)
    
    for cand_id in candidate_ids:
        # Find application
        app = next((a for a in applications if a['_id'] == cand_id), None)
        if app:
            # Create shortlist entry if doesn't exist
            existing = ShortlistModel.get_job_shortlist(job_id)
            if not any(s['application_id'] == cand_id for s in existing):
                ShortlistModel.create_shortlist_entry(
                    job_id=job_id,
                    candidate_id=app['candidate_id'],
                    application_id=cand_id,
                    score=app.get('match_score', 0),
                    rank=len(existing) + 1
                )
    
    # Approve shortlist
    ShortlistModel.approve_shortlist(job_id, candidate_ids)
    
    return jsonify({
        "success": True,
        "message": f"Approved {len(candidate_ids)} candidates",
        "approved_count": len(candidate_ids)
    }), 200

@recruiter_bp.route('/job/<job_id>/shortlist', methods=['GET'])
@require_auth
def get_shortlist(payload, job_id):
    """Get approved shortlist"""
    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    # Verify ownership
    if job['recruiter_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403
    
    shortlist = ShortlistModel.get_job_shortlist(job_id)
    applications = ApplicationModel.get_job_applications(job_id)
    
    # Enrich shortlist with application data
    enriched = []
    for entry in shortlist:
        app = next((a for a in applications if a['_id'] == entry['application_id']), None)
        if app:
            entry['candidate_details'] = {
                "name": app.get('candidate_name'),
                "email": app.get('candidate_email'),
                "match_score": app.get('match_score'),
                "skills": app.get('candidate_skills', []),
                "recommendation": app.get('recommendation')
            }
            enriched.append(entry)
    
    return jsonify({"shortlist": enriched}), 200


@recruiter_bp.route('/job/<job_id>/process-pending', methods=['POST'])
@require_auth
def process_pending_applications(payload, job_id):
    """Automatically process all pending applications for a job"""
    from agents.pipeline import run_application_pipeline
    from tasks.background import submit_task
    
    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    # Verify ownership
    if job['recruiter_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403
    
    # Get pending applications
    applications = ApplicationModel.get_job_applications(job_id)
    pending = [app for app in applications if app.get('status') != 'processed']
    
    # Submit each for processing
    submitted_ids = []
    for app in pending:
        future = submit_task(
            run_application_pipeline,
            str(app['_id']),
            job_id,
            app.get('resume_text', ''),
            job.get('job_description', '')
        )
        submitted_ids.append(str(app['_id']))
    
    return jsonify({
        "success": True,
        "message": f"Processing {len(submitted_ids)} pending applications",
        "submitted_count": len(submitted_ids),
        "application_ids": submitted_ids
    }), 200


@recruiter_bp.route('/job/<job_id>/auto-shortlist', methods=['POST'])
@require_auth
def auto_shortlist(payload, job_id):
    """Automatically shortlist top candidates based on AI scoring"""
    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    # Verify ownership
    if job['recruiter_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.get_json() or {}
    threshold = data.get('threshold', 70)  # Default 70% match score
    
    # Get all processed applications
    applications = ApplicationModel.get_job_applications(job_id)
    processed = [app for app in applications if app.get('status') == 'processed']
    
    # Filter by threshold
    quality_candidates = [
        app for app in processed 
        if app.get('match_score', 0) >= threshold
    ]
    
    # Auto-shortlist
    shortlisted_ids = []
    for idx, app in enumerate(sorted(quality_candidates, key=lambda x: x.get('match_score', 0), reverse=True)):
        # Create shortlist entry
        existing = ShortlistModel.get_job_shortlist(job_id)
        if not any(s['application_id'] == app['_id'] for s in existing):
            ShortlistModel.create_shortlist_entry(
                job_id=job_id,
                candidate_id=app['candidate_id'],
                application_id=str(app['_id']),
                score=app.get('match_score', 0),
                rank=len(existing) + 1
            )
            shortlisted_ids.append(str(app['_id']))
    
    return jsonify({
        "success": True,
        "message": f"Auto-shortlisted {len(shortlisted_ids)} candidates",
        "shortlisted_count": len(shortlisted_ids),
        "threshold": threshold,
        "total_candidates": len(processed),
        "qualified_candidates": len(quality_candidates)
    }), 200
