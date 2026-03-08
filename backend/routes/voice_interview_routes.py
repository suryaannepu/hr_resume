"""Voice Interview API routes

RESTful endpoints for the voice-based AI interview system.
Handles session creation, question audio generation, voice answer processing,
and session management.
"""
from flask import Blueprint, request, jsonify, Response
from auth.auth_handler import verify_token
from voice_interview_handler import (
    create_voice_session,
    get_voice_session,
    generate_question,
    evaluate_answer,
    end_voice_session,
)
from text_to_speech import synthesize_speech
from speech_to_text import transcribe_audio

voice_interview_bp = Blueprint('voice_interview', __name__)


# ---------------------------------------------------------------------------
# Auth decorator (same pattern as existing routes)
# ---------------------------------------------------------------------------

def require_auth(f):
    """Decorator to require JWT authentication."""
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


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@voice_interview_bp.route('/start', methods=['POST'])
@require_auth
def start_voice_interview(payload):
    """Start a new voice interview session.

    Body JSON: { "role": "Frontend Developer", "difficulty": "medium" }
    Returns: { "session_id": "...", "status": "in_progress" }
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    role = data.get('role', '').strip()
    difficulty = data.get('difficulty', 'medium').strip().lower()

    if not role:
        return jsonify({"error": "Role is required"}), 400
    if difficulty not in ('easy', 'medium', 'hard'):
        return jsonify({"error": "Difficulty must be easy, medium, or hard"}), 400

    candidate_id = payload['user_id']
    result = create_voice_session(candidate_id, role, difficulty)

    return jsonify(result), 201


@voice_interview_bp.route('/<session_id>/question', methods=['GET'])
@require_auth
def get_next_question(payload, session_id):
    """Generate the next interview question and return it as text + audio.

    Returns JSON with question text + base64 audio, or streams audio directly.
    Query param: ?format=json (default) or ?format=audio
    """
    session = get_voice_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    if session['candidate_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403

    # Generate question
    question_data = generate_question(session_id)

    if "error" in question_data:
        return jsonify(question_data), 400

    if question_data.get("done"):
        return jsonify(question_data), 200

    question_text = question_data["question"]

    # Convert question to speech
    try:
        audio_bytes = synthesize_speech(question_text)
    except Exception as e:
        print(f"⚠️ TTS failed: {e}")
        audio_bytes = b""

    response_format = request.args.get('format', 'json')

    if response_format == 'audio' and audio_bytes:
        return Response(
            audio_bytes,
            mimetype='audio/mpeg',
            headers={
                'X-Question-Text': question_text,
                'X-Question-Number': str(question_data.get('question_number', 0)),
                'X-Total-Questions': str(question_data.get('total_questions', 0)),
                'X-Question-Type': question_data.get('type', ''),
            }
        )

    # Default: JSON with base64-encoded audio
    import base64
    audio_b64 = base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else ""

    return jsonify({
        "question": question_text,
        "type": question_data.get("type", ""),
        "question_number": question_data.get("question_number", 0),
        "total_questions": question_data.get("total_questions", 0),
        "audio": audio_b64,
        "done": False,
    }), 200


@voice_interview_bp.route('/<session_id>/answer', methods=['POST'])
@require_auth
def submit_voice_answer(payload, session_id):
    """Process a voice answer from the candidate.

    Accepts multipart form data with:
      - audio: the audio file (WebM from MediaRecorder)
      - question: the question text that was asked

    Returns: { "transcript": "...", "score": 8, "feedback": "...", ... }
    """
    session = get_voice_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    if session['candidate_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403
    if session['status'] != 'in_progress':
        return jsonify({"error": "Interview already completed"}), 400

    # Check if a pre-transcribed transcript was provided (via JSON or form data)
    transcript = ""
    question = ""

    if request.is_json:
        data = request.get_json()
        transcript = data.get('transcript', '')
        question = data.get('question', '')
    else:
        transcript = request.form.get('transcript', '')
        question = request.form.get('question', '')

    # If transcript wasn't provided directly, expect an audio file to transcribe
    if not transcript:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file or transcript provided"}), 400

        audio_file = request.files['audio']
        audio_bytes = audio_file.read()

        if not audio_bytes or len(audio_bytes) < 100:
            return jsonify({"error": "Audio file is too small or empty"}), 400

        # 1. Transcribe audio using Whisper
        try:
            filename = audio_file.filename or "recording.webm"
            transcript = transcribe_audio(audio_bytes, filename)
        except Exception as e:
            print(f"⚠️ Transcription failed: {e}")
            return jsonify({"error": f"Failed to transcribe audio: {str(e)}"}), 500

    if not transcript.strip():
        return jsonify({"error": "Could not understand the answer. Please try again."}), 400

    # 2. Evaluate the answer
    try:
        score_data = evaluate_answer(session_id, question, transcript)
    except Exception as e:
        print(f"⚠️ Evaluation failed: {e}")
        score_data = {"score": 0, "feedback": "Evaluation unavailable", "strengths": "", "improvement": ""}

    return jsonify({
        "transcript": transcript,
        "score": score_data.get("score", 0),
        "feedback": score_data.get("feedback", ""),
        "strengths": score_data.get("strengths", ""),
        "improvement": score_data.get("improvement", ""),
    }), 200


@voice_interview_bp.route('/<session_id>/status', methods=['GET'])
@require_auth
def voice_interview_status(payload, session_id):
    """Get current voice interview session status."""
    session = get_voice_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    if session['candidate_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403

    return jsonify({
        "session_id": session_id,
        "status": session["status"],
        "role": session["role"],
        "difficulty": session["difficulty"],
        "current_question": session.get("current_question_index", 0),
        "total_questions": 5,
        "questions": session.get("questions", []),
        "answers": session.get("answers", []),
        "scores": session.get("scores", []),
        "overall_score": session.get("overall_score"),
        "overall_feedback": session.get("overall_feedback"),
    }), 200


@voice_interview_bp.route('/<session_id>/end', methods=['POST'])
@require_auth
def end_interview(payload, session_id):
    """End the voice interview and get final results."""
    session = get_voice_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    if session['candidate_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403

    result = end_voice_session(session_id)

    if "error" in result:
        return jsonify(result), 400

    return jsonify(result), 200
