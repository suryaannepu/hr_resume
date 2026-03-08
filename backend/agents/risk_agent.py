"""Risk Assessment Agent – Direct Groq API"""
import json
from utils.groq_client import call_groq_llm


def run_risk_assessment(candidate_info: dict, job_requirements: dict) -> dict:
    """Analyze potential hiring risks for a candidate."""
    system_prompt = "You are a specialized Risk Assessment Agent for HR."
    user_prompt = f"""Analyze potential hiring risks (job hopping, vague impacts, missing core requirements). Return JSON ONLY:
- risk_level (string: 'Low', 'Medium', 'High')
- risk_factors (array of strings)
- verification_questions (array of specific questions to ask in interview to verify claims)
- profile_red_flags (array of strings)

Candidate: {json.dumps(candidate_info)}
Requirements: {json.dumps(job_requirements)}
"""
    return call_groq_llm(system_prompt, user_prompt)
