"""Interview Practice routes – on-demand question generation & answer scoring."""
from flask import Blueprint, request, jsonify
from auth.auth_handler import verify_token
from models.db_models import ApplicationModel, JobModel
from agents.practice_agent import generate_practice_question, evaluate_practice_answer

practice_bp = Blueprint('practice', __name__)


def require_auth(f):
    """Decorator to require authentication."""
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


@practice_bp.route('/<application_id>/question', methods=['POST'])
@require_auth
def get_practice_question(payload, application_id):
    """Generate a single practice interview question."""
    app = ApplicationModel.get_application(application_id)
    if not app:
        return jsonify({"error": "Application not found"}), 404
    if app['candidate_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403

    job = JobModel.get_job(app.get('job_id'))
    if not job:
        return jsonify({"error": "Job not found"}), 404

    data = request.get_json() or {}
    question_number = data.get('question_number', 1)
    previous_questions = data.get('previous_questions', [])

    result = generate_practice_question(
        job_title=job.get('job_title', 'the position'),
        job_description=job.get('description', ''),
        candidate_skills=app.get('extracted_skills', []),
        question_number=question_number,
        previous_questions=previous_questions,
    )

    return jsonify(result), 200


@practice_bp.route('/<application_id>/evaluate', methods=['POST'])
@require_auth
def evaluate_answer(payload, application_id):
    """Evaluate a candidate's practice answer."""
    app = ApplicationModel.get_application(application_id)
    if not app:
        return jsonify({"error": "Application not found"}), 404
    if app['candidate_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403

    job = JobModel.get_job(app.get('job_id'))
    if not job:
        return jsonify({"error": "Job not found"}), 404

    data = request.get_json()
    question = data.get('question', '')
    question_type = data.get('question_type', 'Technical')
    answer = data.get('answer', '')

    if not question or not answer:
        return jsonify({"error": "Question and answer are required"}), 400

    result = evaluate_practice_answer(
        question=question,
        question_type=question_type,
        answer=answer,
        job_title=job.get('job_title', 'the position'),
        job_description=job.get('description', ''),
    )

    return jsonify(result), 200
