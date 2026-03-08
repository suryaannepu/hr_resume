"""Interview routes for AI-powered candidate interviews"""
from flask import Blueprint, request, jsonify
from auth.auth_handler import verify_token
from models.db_models import ApplicationModel, JobModel
from agents.interview_handler import (
    create_interview_session,
    get_session,
    get_session_by_application,
    start_interview,
    process_candidate_response,
)

interview_bp = Blueprint('interview', __name__)


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


@interview_bp.route('/<application_id>/status', methods=['GET'])
@require_auth
def interview_status(payload, application_id):
    """Check if an AI interview is available / in progress / completed for this application."""
    app = ApplicationModel.get_application(application_id)
    if not app:
        return jsonify({"error": "Application not found"}), 404

    # Candidates can only see their own; recruiters can see any for their jobs
    if app['candidate_id'] != payload['user_id']:
        # Could be a recruiter — allow if they own the job
        job = JobModel.get_job(app.get('job_id', ''))
        if not job or job.get('recruiter_id') != payload['user_id']:
            return jsonify({"error": "Unauthorized"}), 403

    session = get_session_by_application(application_id)
    if not session:
        # Interview available only if candidate has been selected
        interview_available = app.get('decision') == 'selected'
        return jsonify({
            "interview_available": interview_available,
            "session": None,
            "status": "not_started" if interview_available else "not_invited",
        }), 200

    return jsonify({
        "interview_available": True,
        "session_id": session["_id"],
        "status": session.get("status", "in_progress"),
        "conversation": session.get("conversation", []),
        "current_question": session.get("current_question_index", 0),
        "total_questions": len(session.get("questions", [])),
        "evaluation": session.get("evaluation"),
    }), 200


@interview_bp.route('/<application_id>/start', methods=['POST'])
@require_auth
def start_ai_interview(payload, application_id):
    """Start a new AI interview session."""
    app = ApplicationModel.get_application(application_id)
    if not app:
        return jsonify({"error": "Application not found"}), 404
    if app['candidate_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403
    if app.get('decision') != 'selected':
        return jsonify({"error": "You have not been invited for an interview"}), 400

    # Check if session already exists
    existing = get_session_by_application(application_id)
    if existing and existing['status'] in ('completed', 'evaluated'):
        return jsonify({"error": "Interview already completed", "status": existing['status']}), 400
    if existing and existing['status'] == 'in_progress':
        # Resume existing session
        return jsonify({
            "session_id": existing["_id"],
            "status": "resumed",
            "conversation": existing.get("conversation", []),
            "current_question": existing.get("current_question_index", 0),
            "total_questions": len(existing.get("questions", [])),
        }), 200

    # Get job info
    job = JobModel.get_job(app.get('job_id', ''))
    job_title = job.get('job_title', 'the position') if job else 'the position'

    interview_plan = app.get('interview_plan', {})
    candidate_name = app.get('candidate_name', 'Candidate')

    session_id = create_interview_session(application_id, interview_plan, job_title, candidate_name)
    result = start_interview(session_id)
    result["session_id"] = session_id

    return jsonify(result), 201


@interview_bp.route('/<application_id>/chat', methods=['POST'])
@require_auth
def chat_in_interview(payload, application_id):
    """Send a message in the interview conversation."""
    app = ApplicationModel.get_application(application_id)
    if not app:
        return jsonify({"error": "Application not found"}), 404
    if app['candidate_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403

    session = get_session_by_application(application_id)
    if not session:
        return jsonify({"error": "No interview session found. Start the interview first."}), 404
    if session['status'] != 'in_progress':
        return jsonify({"error": "Interview already completed", "status": session['status']}), 400

    data = request.get_json()
    answer = data.get('message', '').strip()
    if not answer:
        return jsonify({"error": "Message cannot be empty"}), 400

    result = process_candidate_response(session["_id"], answer)
    return jsonify(result), 200
