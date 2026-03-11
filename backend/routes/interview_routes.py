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
from text_to_speech import synthesize_speech
from cheating_detector import get_detector
import base64

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
        # Interview available only after shortlisting, before rejection
        interview_available = app.get('decision') in ['shortlisted', 'hired'] or app.get('status') in ['interview_pending', 'interview_completed', 'evaluated']
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
    if app.get('decision') not in ['shortlisted', 'hired'] and app.get('status') not in ['interview_pending', 'interview_completed', 'evaluated']:
        return jsonify({"error": "You have not been invited for an interview"}), 400

    # Check if session already exists
    existing = get_session_by_application(application_id)
    if existing and existing['status'] in ('completed', 'evaluated'):
        return jsonify({"error": "Interview already completed", "status": existing['status']}), 400
    if existing and existing['status'] == 'in_progress':
        # Resume existing session
        conversation = existing.get("conversation", [])
        
        # Resynthesize audio for the last interviewer message if we are resuming
        last_dialogues = []
        if conversation and conversation[-1]["role"] == "interviewer":
            last_dialogues = conversation[-1].get("dialogues", [])
            try:
                VOICES = ["en-US-GuyNeural", "en-US-JennyNeural", "en-US-ChristopherNeural"]
                for d in last_dialogues:
                    idx = d.get("speaker_index", 0)
                    voice = VOICES[idx] if 0 <= idx < len(VOICES) else VOICES[0]
                    audio_bytes = synthesize_speech(d.get("message", ""), voice=voice)
                    d["audio"] = base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else ""
            except Exception as e:
                print(f"⚠️ TTS failed at resume: {e}")

        return jsonify({
            "session_id": existing["_id"],
            "status": "resumed",
            "conversation": conversation,
            "dialogues": last_dialogues, # Pass the real dialogues with audio back
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
    
    # Process TTS for dialogue array
    try:
        VOICES = ["en-US-GuyNeural", "en-US-JennyNeural", "en-US-ChristopherNeural"]
        dialogues = result.get("dialogues", [])
        
        for d in dialogues:
            idx = d.get("speaker_index", 0)
            voice = VOICES[idx] if 0 <= idx < len(VOICES) else VOICES[0]
            audio_bytes = synthesize_speech(d.get("message", ""), voice=voice)
            d["audio"] = base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else ""
            
    except Exception as e:
        print(f"⚠️ TTS failed at start: {e}")

    return jsonify({"session_id": session_id, "dialogues": result.get("dialogues", []), "status": result.get("status")}), 201


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
    
    # Process TTS for dialogue array
    try:
        VOICES = ["en-US-GuyNeural", "en-US-JennyNeural", "en-US-ChristopherNeural"]
        dialogues = result.get("dialogues", [])
        
        for d in dialogues:
            idx = d.get("speaker_index", 0)
            voice = VOICES[idx] if 0 <= idx < len(VOICES) else VOICES[0]
            audio_bytes = synthesize_speech(d.get("message", ""), voice=voice)
            d["audio"] = base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else ""
            
    except Exception as e:
        print(f"⚠️ TTS failed at chat: {e}")
        
    return jsonify({"dialogues": result.get("dialogues", []), "status": result.get("status")}), 200

@interview_bp.route('/<application_id>/frame', methods=['POST'])
def process_frame(application_id):
    """Processes a webcam frame from the candidate for cheating detection"""
    try:
        data = request.json
        img_b64 = data.get("image")
        
        if not img_b64:
            return jsonify({"error": "No image provided"}), 400
            
        detector = get_detector()
        results = detector.process_frame(img_b64)
        
        return jsonify(results), 200
        
    except Exception as e:
        print(f"Error processing frame: {e}")
        return jsonify({"error": "Failed to process frame"}), 500

@interview_bp.route('/<application_id>/cheat', methods=['POST'])
@require_auth
def submit_cheat_report(payload, application_id):
    """Marks an interview as failed due to cheating"""
    app = ApplicationModel.get_application(application_id)
    if not app:
        return jsonify({"error": "Application not found"}), 404
    if app['candidate_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403
        
    session = get_session_by_application(application_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
        
    data = request.json
    flags = data.get('flags', [])
    screenshot = data.get('screenshot', '')
    
    from database import get_db
    from bson.objectid import ObjectId
    from datetime import datetime
    
    db = get_db()
    
    # Update application
    db['applications'].update_one(
        {"_id": ObjectId(application_id)},
        {"$set": {
            "status": "rejected",
            "decision": "rejected",
            "cheated": True,
            "cheat_flags": flags,
            "cheat_screenshot": screenshot,
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Update session
    db['interview_sessions'].update_one(
        {"_id": ObjectId(session['_id'])},
        {"$set": {
            "status": "cheated",
            "completed_at": datetime.utcnow()
        }}
    )
    
    return jsonify({"success": True, "message": "Cheat report logged"}), 200
