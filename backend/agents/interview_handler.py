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
        f"**[{q_type}] Question 1/{len(questions)}:**\n{q_text}"
    )

    # Save to conversation
    sessions = _get_sessions_collection()
    sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$push": {"conversation": {"role": "interviewer", "content": greeting, "timestamp": datetime.utcnow().isoformat()}}}
    )

    return {
        "message": greeting,
        "question_number": 1,
        "total_questions": len(questions),
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

    # Generate a brief follow-up / acknowledgement using AI
    ack_prompt = f"""You are an AI interviewer conducting a technical interview. The candidate just answered a question.
Provide a very brief (1-2 sentence) natural acknowledgement of their answer. Be encouraging but neutral.

Question asked: {questions[current_idx].get('question', '') if current_idx < len(questions) else ''}
Candidate's answer: {candidate_answer}

Return JSON ONLY:
- acknowledgement (string: 1-2 sentences)
"""
    ack_data = call_groq_llm("You are a professional AI interviewer.", ack_prompt)
    ack_text = ack_data.get("acknowledgement", "Thank you for your answer.")

    next_idx = current_idx + 1

    if next_idx < len(questions):
        # Ask next question
        next_q = questions[next_idx]
        q_text = next_q.get("question", "")
        q_type = next_q.get("type", "Technical")

        ai_message = (
            f"{ack_text}\n\n"
            f"**[{q_type}] Question {next_idx + 1}/{len(questions)}:**\n{q_text}"
        )

        sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {"current_question_index": next_idx},
                "$push": {"conversation": {"role": "interviewer", "content": ai_message, "timestamp": datetime.utcnow().isoformat()}}
            }
        )

        return {
            "message": ai_message,
            "question_number": next_idx + 1,
            "total_questions": len(questions),
            "status": "in_progress",
        }
    else:
        # Interview complete
        closing = (
            f"{ack_text}\n\n"
            f"That concludes our interview! 🎉 Thank you for taking the time, {session['candidate_name']}. "
            f"Your responses have been recorded and will be evaluated. You'll hear back soon."
        )

        sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {"status": "completed", "completed_at": datetime.utcnow()},
                "$push": {"conversation": {"role": "interviewer", "content": closing, "timestamp": datetime.utcnow().isoformat()}}
            }
        )

        # Trigger async evaluation
        _evaluate_interview(session_id)

        return {
            "message": closing,
            "question_number": len(questions),
            "total_questions": len(questions),
            "status": "completed",
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
