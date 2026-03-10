"""Conversational AI Interview Handler – Direct Groq API

This module manages AI-powered interview sessions. When a recruiter selects
a candidate, the candidate can take an AI interview at any time before the
deadline. The interview is conducted as a multi-turn chat where an AI
interviewer asks role-specific questions.
"""
import json
from datetime import datetime
from bson.objectid import ObjectId
from database import get_db
from utils.groq_client import call_groq_llm


# ---------------------------------------------------------------------------
# Session helpers
# ---------------------------------------------------------------------------

def _get_sessions_collection():
    db = get_db()
    if db is None:
        raise RuntimeError("Database connection not available")
    return db["interview_sessions"]


def create_interview_session(application_id: str, interview_plan: dict, job_title: str, candidate_name: str) -> str:
    """Create a new interview session and return its ID."""
    sessions = _get_sessions_collection()

    questions = interview_plan.get("interview_questions", [])
    duration = interview_plan.get("recommended_duration_minutes", 30)

    session = {
        "application_id": application_id,
        "candidate_name": candidate_name,
        "job_title": job_title,
        "interview_plan": interview_plan,
        "questions": questions,
        "current_question_index": 0,
        "conversation": [],
        "status": "in_progress",  # in_progress | completed | evaluated
        "duration_minutes": duration,
        "started_at": datetime.utcnow(),
        "completed_at": None,
        "evaluation": None,
    }

    result = sessions.insert_one(session)
    return str(result.inserted_id)


def get_session(session_id: str) -> dict | None:
    sessions = _get_sessions_collection()
    doc = sessions.find_one({"_id": ObjectId(session_id)})
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc


def get_session_by_application(application_id: str) -> dict | None:
    sessions = _get_sessions_collection()
    doc = sessions.find_one({"application_id": application_id})
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc


# ---------------------------------------------------------------------------
# Interview conversation
# ---------------------------------------------------------------------------

def start_interview(session_id: str) -> dict:
    """Return the first AI interviewer message (greeting + first question)."""
    session = get_session(session_id)
    if not session:
        return {"error": "Session not found"}

    questions = session.get("questions", [])
    first_q = questions[0] if questions else {}
    q_text = first_q.get("question", "Tell me about yourself and your experience.")
    q_type = first_q.get("type", "Behavioral")

    greeting = (
        f"Hello {session['candidate_name']}! 👋 Welcome to your AI-powered interview for the "
        f"**{session['job_title']}** position.\n\n"
        f"I'll be asking you a series of questions to understand your background and skills. "
        f"Take your time with each answer.\n\n"
        f"**[{q_type}] Question:**\n{q_text}"
    )
    
    dialogues = [{"speaker_index": 0, "message": greeting}]

    # Save to conversation
    sessions = _get_sessions_collection()
    sessions.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {"started_at": datetime.utcnow()},
            "$push": {"conversation": {"role": "interviewer", "dialogues": dialogues, "timestamp": datetime.utcnow().isoformat()}}
        }
    )

    return {
        "dialogues": dialogues,
        "status": "in_progress",
    }


def process_candidate_response(session_id: str, candidate_answer: str) -> dict:
    """Process a candidate's answer and return the next question or wrap-up."""
    session = get_session(session_id)
    if not session:
        return {"error": "Session not found"}
    if session["status"] != "in_progress":
        return {"error": "Interview already completed", "status": session["status"]}

    sessions = _get_sessions_collection()
    questions = session.get("questions", [])
    current_idx = session.get("current_question_index", 0)

    # Save candidate answer
    sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$push": {"conversation": {"role": "candidate", "content": candidate_answer, "timestamp": datetime.utcnow().isoformat()}}}
    )

    # Check 45 minute limit
    started_at = session.get("started_at", datetime.utcnow())
    if isinstance(started_at, str):
        started_at = datetime.fromisoformat(started_at)
    elapsed = (datetime.utcnow() - started_at).total_seconds() / 60.0
    time_up = elapsed >= 45.0

    transcript = "\n".join(
        f"{'Panelist' if msg['role'] == 'interviewer' else 'Candidate'}: {msg.get('content') or ' '.join(d.get('message', '') for d in msg.get('dialogues', []))}"
        for msg in session.get("conversation", [])[-5:]  # last 5 messages for context
    )
    transcript += f"\nCandidate: {candidate_answer}"

    next_idx = current_idx + 1

    if not time_up:
        # Ask next question (either from plan or generated)
        if next_idx < len(questions):
            next_q = questions[next_idx]
            target_q = f"Ask this specific question from the plan: {next_q.get('question', '')} (Type: {next_q.get('type', 'Technical')})"
        else:
            target_q = "Generate a new, relevant follow-up question based on the candidate's previous answers or delve deeper into their technical/cultural skills."

        prompt = f"""You are a panel of 3 AI interviewers:
0: Alex (Hiring Manager)
1: Sarah (Technical Lead)
2: David (Culture & Fit)

The candidate just answered.
1. Provide a brief, natural acknowledgment.
2. {target_q}
3. Choose ONE of the 3 panel members to act as the primary speaker for the next question. Make it conversational.

CRITICAL INSTRUCTION: You MUST separate the conversation into an array of distinct turns for each speaker! Do NOT merge multiple panel members' dialogue into a single string!

Transcript context:
{transcript}

Return JSON ONLY.
{{
  "dialogues": [
    {{ "speaker_index": 0, "message": "Thanks for that answer. Sarah, would you like to take the next one?" }},
    {{ "speaker_index": 1, "message": "Sure thing Alex! Candidate, what is your experience with..." }}
  ]
}}
"""
        response_data = call_groq_llm("You are a professional AI hiring panel.", prompt)
        dialogues = response_data.get("dialogues", [])
        if not dialogues:
            dialogues = [{"speaker_index": 0, "message": "Thank you. Let's move on. Could you elaborate on your experience?"}]

        sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {"current_question_index": next_idx},
                "$push": {"conversation": {"role": "interviewer", "dialogues": dialogues, "timestamp": datetime.utcnow().isoformat()}}
            }
        )

        return {
            "dialogues": dialogues,
            "status": "in_progress"
        }
    else:
        # Interview complete
        closing_prompt = f"""You are an AI hiring panel (Alex, Sarah, David). The 45-minute interview is now complete.
The candidate just gave their last answer.

Provide a professional, friendly closing statement wrapping up the interview.
CRITICAL INSTRUCTION: If multiple panel members speak, you MUST separate their dialogue into distinct objects in the array!

Return JSON ONLY. You MUST return an array of "dialogues", where each element is a speaker's text.
{{
  "dialogues": [
    {{ "speaker_index": 1, "message": "I think that covers my technical questions." }},
    {{ "speaker_index": 0, "message": "Alright, that concludes our 45-minute interview! Thank you for your time today." }}
  ]
}}
"""
        response_data = call_groq_llm("You are a professional AI hiring panel.", closing_prompt)
        dialogues = response_data.get("dialogues", [])
        if not dialogues:
            dialogues = [{"speaker_index": 0, "message": "That concludes our interview! Thank you for your time. Your responses have been recorded."}]

        sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {"status": "completed", "completed_at": datetime.utcnow()},
                "$push": {"conversation": {"role": "interviewer", "dialogues": dialogues, "timestamp": datetime.utcnow().isoformat()}}
            }
        )

        # Trigger async evaluation
        _evaluate_interview(session_id)

        return {
            "dialogues": dialogues,
            "status": "completed"
        }


# ---------------------------------------------------------------------------
# Interview evaluation
# ---------------------------------------------------------------------------

def _evaluate_interview(session_id: str):
    """Use AI to evaluate the entire interview transcript."""
    session = get_session(session_id)
    if not session:
        return

    transcript = "\n".join(
        f"{'Interviewer' if msg['role'] == 'interviewer' else 'Candidate'}: {msg['content']}"
        for msg in session.get("conversation", [])
    )

    system_prompt = "You are the head of technical hiring. Evaluate the candidate's interview performance."
    user_prompt = f"""Evaluate this interview transcript for the position of {session['job_title']}.

Transcript:
{transcript}

Return JSON ONLY:
- overall_score (integer 0-100)
- communication_score (integer 0-100)
- technical_score (integer 0-100)
- problem_solving_score (integer 0-100)
- cultural_fit_score (integer 0-100)
- strengths (array of strings)
- weaknesses (array of strings)
- detailed_feedback (string: 3-4 sentences)
- hire_recommendation (string: 'Strong Hire', 'Hire', 'Weak Hire', 'No Hire')
"""
    evaluation = call_groq_llm(system_prompt, user_prompt)

    sessions = _get_sessions_collection()
    sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"evaluation": evaluation, "status": "evaluated"}}
    )

    # Also update the application with interview results
    from database import get_applications_collection
    apps = get_applications_collection()
    apps.update_one(
        {"_id": ObjectId(session["application_id"])},
        {"$set": {
            "status": "interview_completed",
            "interview_completed": True,
            "interview_evaluation": evaluation,
            "interview_score": evaluation.get("overall_score", 0),
            "updated_at": datetime.utcnow(),
        }}
    )
    
    # Send performance report via email
    from utils.email_service import send_interview_report_email
    app_doc = apps.find_one({"_id": ObjectId(session["application_id"])})
    if app_doc and "candidate_email" in app_doc:
        send_interview_report_email(
            app_doc["candidate_email"],
            session.get("candidate_name", "Candidate"),
            session.get("job_title", "Position"),
            evaluation
        )
