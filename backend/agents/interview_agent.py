"""Interview Planning Agent – Direct Groq API"""
import json
from utils.groq_client import call_groq_llm


def run_interview_planning(insight_data: dict, risk_data: dict, job_requirements: dict) -> dict:
    """Create a customized interview plan for a candidate."""
    system_prompt = "You are an expert technical interviewer."
    user_prompt = f"""Create a customized interview plan for this specific candidate to test their claims and gaps. Return JSON ONLY:
- recommended_duration_minutes (integer)
- technical_focus_areas (array of strings)
- behavioral_focus_areas (array of strings)
- interview_questions (array of objects with: 'round' (string), 'type' (Technical/Behavioral), 'question' (string), 'what_good_looks_like' (string))

Candidate Insights: {json.dumps(insight_data)}
Risk Focus: {json.dumps(risk_data)}
Requirements: {json.dumps(job_requirements)}
"""
    return call_groq_llm(system_prompt, user_prompt)
