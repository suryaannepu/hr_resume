"""Recruiter dashboard routes"""
from flask import Blueprint, request, jsonify
from auth.auth_handler import verify_token
from models.db_models import JobModel, ApplicationModel, ShortlistModel
from bson.objectid import ObjectId
from database import get_applications_collection, get_jobs_collection

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
        # Count all applications that have finished AI processing
        processed = [app for app in applications if app.get('status') not in ('uploaded', 'processing')]
        
        # Dashboard preview only shows top candidates who are not finally decided (not hired or rejected)
        preview_apps = [app for app in processed if app.get('decision') not in ('rejected', 'hired')]
        
        shortlist = ShortlistModel.get_job_shortlist(job['_id'])
        approved = [s for s in shortlist if s.get('approved_by_recruiter')]
        
        job_data = {
            "job_id": job['_id'],
            "job_title": job['job_title'],
            "total_applications": len(applications),
            "processed_applications": len(processed),
            "shortlist_count": len(shortlist),
            "approved_count": len(approved),
            "applications": preview_apps[:10],  # Last 10 active/shortlisted candidates for preview
            "ai_insights": job.get("ai_insights")
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
    
    # Get pending applications - fetch full docs for processing
    apps_col = get_applications_collection()
    pending = list(apps_col.find({"job_id": job_id, "status": {"$ne": "processed"}}))
    
    # Submit each for processing
    submitted_ids = []
    for app in pending:
        submit_task(
            run_application_pipeline,
            str(app['_id']),
            job_id,
            app.get('resume_text', ''),
            job.get('description', '')
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


@recruiter_bp.route('/job/<job_id>/candidate/<application_id>/decision', methods=['POST'])
@require_auth
def candidate_decision(payload, job_id, application_id):
    """Select or reject a candidate and send email notification"""

    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    if job['recruiter_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    print(f"📥 Received decision request: {data} for App: {application_id}")
    decision = data.get('decision')
    if decision not in ('shortlisted', 'rejected', 'hired'):
        return jsonify({"error": "decision must be 'shortlisted', 'rejected' or 'hired'"}), 400

    app = ApplicationModel.get_application(application_id)
    if not app or app.get("job_id") != job_id:
        return jsonify({"error": "Application not found"}), 404

    # Update decision in database (this also updates status)
    from utils.email_service import send_shortlist_email, send_rejection_email, send_selection_email
    ApplicationModel.update_decision(application_id, decision)

    # Send email
    # Get User's registered email
    from database import get_users_collection
    from bson.objectid import ObjectId
    users_col = get_users_collection()
    candidate_user = users_col.find_one({"_id": ObjectId(app.get('candidate_id'))})
    if candidate_user and candidate_user.get('email'):
        candidate_email = candidate_user.get('email')
    else:
        candidate_email = app.get('candidate_email', '')

    candidate_name = app.get('candidate_name', 'Candidate')
    job_title = job.get('job_title', '')
    company_name = job.get('company_name', '')

    email_sent = False
    if decision == 'shortlisted':
        details = {
            "match_score": app.get('match_score'),
            "matched_skills": app.get('matching_skills') or app.get('matched_skills', []),
        }
        email_sent = send_shortlist_email(candidate_email, candidate_name, job_title, company_name, details)
    elif decision == 'hired':
        interview_score = (app.get('interview_report') or {}).get('overall_score')
        email_sent = send_selection_email(candidate_email, candidate_name, job_title, company_name, interview_score)
    else: # rejected
        feedback = {
            "skill_gaps": app.get('skill_gaps', []) or app.get('missing_skills', []),
            "resume_improvements": (app.get('candidate_coaching') or {}).get('resume_improvements', []),
            "coach_message": (app.get('candidate_coaching') or {}).get('short_message', ''),
        }
        email_sent = send_rejection_email(candidate_email, candidate_name, job_title, company_name, feedback)

    return jsonify({
        "success": True,
        "decision": decision,
        "email_sent": email_sent,
        "message": f"Candidate {decision}. {'Email sent.' if email_sent else 'Email not sent (SMTP not configured).'}"
    }), 200


@recruiter_bp.route('/job/<job_id>/close', methods=['PUT'])
@require_auth
def close_job(payload, job_id):
    """Close a job from recruiter dashboard"""
    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job['recruiter_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403

    JobModel.close_job(job_id)
    return jsonify({"success": True, "message": "Job closed successfully"}), 200


@recruiter_bp.route('/job/<job_id>/reopen', methods=['PUT'])
@require_auth
def reopen_job(payload, job_id):
    """Reopen a closed job from recruiter dashboard"""
    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job['recruiter_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403

    JobModel.reopen_job(job_id)
    return jsonify({"success": True, "message": "Job reopened successfully"}), 200


@recruiter_bp.route('/job/<job_id>/ai-rank', methods=['POST'])
@require_auth
def ai_rank_candidates(payload, job_id):
    """Run the AI Ranking + Shortlisting pipeline for a job's processed candidates."""
    from agents.pipeline import run_job_ranking_pipeline

    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job['recruiter_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403

    result = run_job_ranking_pipeline(job_id)
    if "error" in result:
        return jsonify(result), 400

    return jsonify({
        "success": True,
        "ranking": result.get("ranking", {}),
        "shortlist": result.get("shortlist", {}),
    }), 200


@recruiter_bp.route('/job/<job_id>/ai-insights', methods=['GET'])
@require_auth
def ai_insights(payload, job_id):
    """Get AI-generated executive insights for a job's candidate pool."""
    from agents.pipeline import get_job_ai_insights

    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job['recruiter_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403

    # Return cached insights if fresh (< 5 min old)
    import datetime as dt
    cached = job.get("ai_insights")
    cached_at = job.get("insights_updated_at")
    if cached and cached_at and (dt.datetime.utcnow() - cached_at).total_seconds() < 300:
        return jsonify(cached), 200

    result = get_job_ai_insights(job_id)
    return jsonify(result), 200

