"""Career Coach Chat Agent – Direct Groq API"""
import json
from utils.groq_client import call_groq_llm


def run_coach_chat(candidate_info: dict, job_description: str, message: str, history: list) -> dict:
    """Generate constructive conversational career coaching feedback."""
    system_prompt = (
        "You are an empathetic, expert career coach for a candidate applying to a specific job.\n"
        "Your goal is to provide brief, actionable, and highly personalized advice based on their resume and the job description.\n"
        "Keep your responses concise (3-4 sentences maximum), encouraging, and directly relevant to the user's latest question."
    )
    
    # Format chat history for context if it exists
    history_text = "\n".join([f"{msg['type'].capitalize()}: {msg['content']}" for msg in history[-5:]]) if history else "No previous history."
    
    user_prompt = f"""You must answer the candidate's question below.

### CONTEXT
Candidate Information (Resume Extract): {json.dumps(candidate_info)}
Job Description Applied For: {job_description}

### RECENT CHAT HISTORY
{history_text}

### CANDIDATE'S LATEST QUESTION:
{message}

Return JSON ONLY in this format:
{{
  "reply": "your conversational answer here"
}}
"""
    return call_groq_llm(system_prompt, user_prompt)
