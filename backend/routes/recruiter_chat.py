"""Recruiter Chat Bot — Ask questions about a candidate's resume using Groq LLM"""
from flask import Blueprint, request, jsonify
from auth.auth_handler import verify_token
from database.models import ApplicationModel, JobModel
from utils.groq_client import call_groq_llm

recruiter_chat_bp = Blueprint('recruiter_chat', __name__)

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


@recruiter_chat_bp.route('/chat', methods=['POST'])
@require_auth
def recruiter_resume_chat(payload):
    """
    Recruiter asks questions about a candidate's resume.
    Expects: { application_id, message, history: [{role, content}] }
    Returns: { reply: "..." }
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    application_id = data.get('application_id')
    message = data.get('message', '').strip()
    history = data.get('history', [])

    if not application_id or not message:
        return jsonify({"error": "application_id and message are required"}), 400

    # Fetch application
    app = ApplicationModel.get_application(application_id)
    if not app:
        return jsonify({"error": "Application not found"}), 404

    # Verify the recruiter owns the job
    job = JobModel.get_job(app.get('job_id'))
    if not job or job.get('recruiter_id') != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403

    # Build context from application data
    resume_text = app.get('resume_text', 'No resume text available.')
    candidate_name = app.get('candidate_name', 'Unknown Candidate')
    candidate_email = app.get('candidate_email', '')
    match_score = app.get('match_score', 'N/A')
    matched_skills = app.get('matching_skills') or app.get('matched_skills', [])
    missing_skills = app.get('missing_skills', [])
    key_strengths = app.get('key_strengths', [])
    skill_gaps = app.get('skill_gaps', [])
    recommendation = app.get('recommendation', 'N/A')
    job_title = job.get('job_title', 'Unknown Position')

    system_prompt = f"""You are an expert Recruiter Assistant AI. You help recruiters analyze candidate resumes and answer questions about candidates.

You have access to the following candidate information:

**Candidate:** {candidate_name} ({candidate_email})
**Applied For:** {job_title}
**AI Match Score:** {match_score}%
**AI Recommendation:** {recommendation}
**Matched Skills:** {', '.join(matched_skills) if matched_skills else 'None identified'}
**Missing Skills:** {', '.join(missing_skills) if missing_skills else 'None'}
**Key Strengths:** {', '.join(key_strengths) if key_strengths else 'None identified'}
**Skill Gaps:** {', '.join(skill_gaps) if skill_gaps else 'None identified'}

**Full Resume Text:**
{resume_text[:6000]}

Instructions:
- Answer the recruiter's questions about this candidate based on the resume and AI analysis.
- Be concise, professional, and specific. Reference exact details from the resume when possible.
- If asked about something not in the resume, say so clearly.
- Provide actionable insights when relevant (e.g., interview focus areas, red flags, strengths to probe).
- Always respond in JSON format: {{"reply": "your answer here"}}
"""

    # Build conversation including history
    conversation_context = ""
    for msg in history[-10:]:  # Keep last 10 messages for context
        role_label = "Recruiter" if msg.get('role') == 'user' else "Assistant"
        conversation_context += f"{role_label}: {msg.get('content', '')}\n"
    conversation_context += f"Recruiter: {message}"

    try:
        result = call_groq_llm(system_prompt, conversation_context)
        reply = result.get('reply', 'I could not generate a response. Please try again.')
        return jsonify({"reply": reply}), 200
    except Exception as e:
        print(f"❌ Recruiter chat error: {e}")
        return jsonify({"error": "Failed to generate response", "reply": "Sorry, I encountered an error. Please try again."}), 500
