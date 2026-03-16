"""Voice Interview Handler — manages voice interview sessions

Orchestrates the voice interview loop:
  1. Generate question (Groq LLM) — friendly, conversational style
  2. Convert to speech (edge-tts)
  3. Receive candidate audio
  4. Transcribe (Groq Whisper)
  5. Evaluate answer (Groq LLM)
  6. Repeat

The interview flows naturally:
  Q1: Warm intro — "Tell me about yourself"
  Q2: Role motivation — why this role
  Q3-4: Technical questions building on candidate's answers
  Q5: Scenario / wrap-up
"""
import json
from datetime import datetime
from bson.objectid import ObjectId
from database.connection import get_db
from utils.groq_client import call_groq_llm

TOTAL_QUESTIONS = 5  # Questions per interview session


# ---------------------------------------------------------------------------
# Collection helper
# ---------------------------------------------------------------------------

def _get_voice_sessions():
    db = get_db()
    if db is None:
        raise RuntimeError("Database connection not available")
    return db["voice_interview_sessions"]


# ---------------------------------------------------------------------------
# Session management
# ---------------------------------------------------------------------------

def create_voice_session(candidate_id: str, role: str, difficulty: str) -> dict:
    """Create a new voice interview session."""
    sessions = _get_voice_sessions()

    session = {
        "candidate_id": candidate_id,
        "role": role,
        "difficulty": difficulty,
        "questions": [],
        "answers": [],
        "scores": [],
        "current_question_index": 0,
        "status": "in_progress",  # in_progress | completed
        "created_at": datetime.utcnow(),
        "completed_at": None,
        "overall_score": None,
        "overall_feedback": None,
    }

    result = sessions.insert_one(session)
    session_id = str(result.inserted_id)
    return {"session_id": session_id, "status": "in_progress"}


def get_voice_session(session_id: str) -> dict | None:
    """Retrieve a voice session by ID."""
    sessions = _get_voice_sessions()
    try:
        doc = sessions.find_one({"_id": ObjectId(session_id)})
    except Exception:
        return None
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc


def end_voice_session(session_id: str) -> dict:
    """End a voice interview session and compute overall results."""
    session = get_voice_session(session_id)
    if not session:
        return {"error": "Session not found"}

    if session["status"] == "completed":
        return {
            "status": "completed",
            "overall_score": session.get("overall_score"),
            "overall_feedback": session.get("overall_feedback"),
            "questions": session.get("questions", []),
            "answers": session.get("answers", []),
            "scores": session.get("scores", []),
        }

    scores = session.get("scores", [])
    questions = session.get("questions", [])
    answers = session.get("answers", [])

    # Calculate overall score
    if scores:
        numeric_scores = [s.get("score", 0) for s in scores if isinstance(s, dict)]
        avg_score = round(sum(numeric_scores) / len(numeric_scores), 1) if numeric_scores else 0
    else:
        avg_score = 0

    # Generate overall feedback using LLM
    transcript = ""
    for i, q in enumerate(questions):
        a = answers[i] if i < len(answers) else "No answer"
        s = scores[i] if i < len(scores) else {}
        transcript += f"Q{i+1}: {q}\nAnswer: {a}\nScore: {s.get('score', 'N/A')}/10\n\n"

    overall_feedback = _generate_overall_feedback(session["role"], transcript, avg_score)

    sessions = _get_voice_sessions()
    sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {
            "status": "completed",
            "completed_at": datetime.utcnow(),
            "overall_score": avg_score,
            "overall_feedback": overall_feedback,
        }}
    )

    return {
        "status": "completed",
        "overall_score": avg_score,
        "overall_feedback": overall_feedback,
        "questions": questions,
        "answers": answers,
        "scores": scores,
    }


# ---------------------------------------------------------------------------
# Question generation — conversational, friendly flow
# ---------------------------------------------------------------------------

# Question flow stages for a natural interview
QUESTION_STAGES = [
    {
        "stage": "introduction",
        "instruction": (
            "Start with a warm, friendly greeting. Introduce yourself as the AI interviewer. "
            "Then ask the candidate to tell you about themselves — their background, what they do, "
            "and what they're passionate about. Keep it casual and inviting, like chatting with a friend."
        ),
        "type": "Introduction",
    },
    {
        "stage": "motivation",
        "instruction": (
            "Ask the candidate about their motivation and interest. Why did they choose this career path? "
            "What excites them about this role? Reference something from their previous answer if possible. "
            "Keep the tone conversational and genuinely curious."
        ),
        "type": "Behavioral",
    },
    {
        "stage": "technical_1",
        "instruction": (
            "Now transition into a technical question. Say something like 'Great, let's dive into some technical stuff!' "
            "Ask a fundamental technical question related to the role. Build on what the candidate mentioned about "
            "their experience. Keep it specific but not overly complex."
        ),
        "type": "Technical",
    },
    {
        "stage": "technical_2",
        "instruction": (
            "Ask a deeper technical question or a practical scenario. Reference the candidate's previous answers "
            "to make it feel like a natural conversation. For example: 'You mentioned X earlier, "
            "so let me ask you about...' Ask about problem-solving approach or a specific technology."
        ),
        "type": "Technical",
    },
    {
        "stage": "scenario_wrapup",
        "instruction": (
            "For the final question, ask a scenario-based or design question that tests their thinking process. "
            "Then add a warm closing like 'This is our last question, and I really enjoyed chatting with you! "
            "Here's a scenario I'd love your thoughts on...' Make it engaging and thought-provoking."
        ),
        "type": "Problem Solving",
    },
]


def generate_question(session_id: str) -> dict:
    """Generate the next interview question using Groq LLM — conversational style."""
    session = get_voice_session(session_id)
    if not session:
        return {"error": "Session not found"}

    if session["status"] != "in_progress":
        return {"error": "Interview already completed", "status": session["status"]}

    current_idx = session["current_question_index"]

    if current_idx >= TOTAL_QUESTIONS:
        return {"done": True, "message": "All questions have been asked."}

    # Get the stage instructions
    stage = QUESTION_STAGES[current_idx] if current_idx < len(QUESTION_STAGES) else QUESTION_STAGES[-1]

    # Build context from previous Q&A for natural flow
    history = ""
    for i, q in enumerate(session.get("questions", [])):
        a = session["answers"][i] if i < len(session.get("answers", [])) else ""
        history += f"Question {i+1}: {q}\nCandidate's Answer: {a}\n\n"

    difficulty_map = {
        "easy": "entry-level, suitable for freshers or juniors. Keep questions simple and encouraging.",
        "medium": "mid-level, suitable for 2-4 years experience. Ask moderately challenging questions.",
        "hard": "senior-level, suitable for 5+ years experience. Ask in-depth, complex questions.",
    }
    diff_desc = difficulty_map.get(session["difficulty"], session["difficulty"])

    system_prompt = (
        "You are a friendly, professional AI interviewer named Alex. You speak naturally, like a real person "
        "having a conversation. You're warm, encouraging, and genuinely interested in what the candidate has to say. "
        "Never be robotic or stiff. Use natural speech patterns — short sentences, casual transitions. "
        "Your questions should sound like they're spoken aloud, not read from a script."
    )

    user_prompt = f"""Generate the next message for this voice interview for a {session['role']} position.

Difficulty: {diff_desc}
This is question {current_idx + 1} of {TOTAL_QUESTIONS}.
Stage: {stage['stage']}

Stage instructions: {stage['instruction']}

{f"Here is what has been discussed so far (use this to build on the conversation naturally):{chr(10)}{history}" if history else "This is the very start of the interview. No previous conversation yet."}

IMPORTANT RULES:
- Generate ONLY the interviewer's spoken message (what will be read aloud by TTS)
- Make it sound natural for speaking — conversational, warm, and clear
- Do NOT use markdown, bullet points, asterisks, or formatting
- Do NOT use emojis or special characters  
- Keep your message to 2-4 sentences maximum
- Ask exactly ONE question
- If this is question 1, include a brief friendly greeting before your question

Return JSON ONLY:
- question (string: the complete interviewer message including any transition/acknowledgement and the question itself)
- type (string: '{stage['type']}')
"""

    try:
        result = call_groq_llm(system_prompt, user_prompt)
        question_text = result.get("question", "Tell me about yourself and your experience.")
        question_type = result.get("type", stage["type"])
    except Exception as e:
        print(f"⚠️ Groq API failed in generate_question: {e}")
        question_text = f"Could you tell me more about your experience? ({current_idx + 1}/{TOTAL_QUESTIONS})"
        question_type = stage["type"]

    # Save to session
    sessions = _get_voice_sessions()
    sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$push": {"questions": question_text}}
    )

    return {
        "question": question_text,
        "type": question_type,
        "question_number": current_idx + 1,
        "total_questions": TOTAL_QUESTIONS,
        "done": False,
    }


# ---------------------------------------------------------------------------
# Answer evaluation
# ---------------------------------------------------------------------------

def evaluate_answer(session_id: str, question: str, answer: str) -> dict:
    """Evaluate a candidate's answer using Groq LLM."""
    session = get_voice_session(session_id)
    if not session:
        return {"error": "Session not found"}

    system_prompt = "You are a fair and encouraging technical interview evaluator."

    user_prompt = f"""Evaluate this interview answer for a {session['role']} position ({session['difficulty']} difficulty).

Question: {question}
Candidate's Answer: {answer}

Return JSON ONLY:
- score (integer 0-10, where 10 is perfect)
- feedback (string: 1-2 sentences of constructive feedback, be encouraging)
- strengths (string: brief mention of what was good, or "None" if nothing stood out)
- improvement (string: brief suggestion for improvement)
"""

    evaluation = call_groq_llm(system_prompt, user_prompt)

    score_data = {
        "score": evaluation.get("score", 0),
        "feedback": evaluation.get("feedback", ""),
        "strengths": evaluation.get("strengths", ""),
        "improvement": evaluation.get("improvement", ""),
    }

    # Ensure score is numeric
    try:
        score_data["score"] = int(score_data["score"])
    except (ValueError, TypeError):
        score_data["score"] = 0

    # Save answer and score to session
    sessions = _get_voice_sessions()
    current_idx = session["current_question_index"]
    sessions.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$push": {"answers": answer, "scores": score_data},
            "$set": {"current_question_index": current_idx + 1},
        }
    )

    return score_data


# ---------------------------------------------------------------------------
# Overall feedback
# ---------------------------------------------------------------------------

def _generate_overall_feedback(role: str, transcript: str, avg_score: float) -> str:
    """Generate overall interview feedback."""
    system_prompt = "You are a friendly hiring manager providing interview feedback."
    user_prompt = f"""Provide a brief overall assessment for a {role} interview.

Transcript summary:
{transcript}

Average score: {avg_score}/10

Return JSON ONLY:
- feedback (string: 3-4 sentences summarizing the candidate's performance, strengths, and areas for improvement. Be encouraging and constructive.)
"""
    result = call_groq_llm(system_prompt, user_prompt)
    return result.get("feedback", "Interview completed. Results are being processed.")
