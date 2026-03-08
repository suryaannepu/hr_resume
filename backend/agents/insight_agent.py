"""Candidate Insight Agent – Direct Groq API"""
import json
from utils.groq_client import call_groq_llm


def run_insights(candidate_info: dict, job_requirements: dict, scoring_data: dict) -> dict:
    """Generate nuanced hiring insights about a candidate."""
    system_prompt = (
        "You are a senior hiring manager tasked with summarizing the candidate profile."
    )
    user_prompt = f"""Generate nuanced hiring insights in JSON ONLY:
- key_strengths (array of strings)
- skill_gaps (array of strings)
- growth_potential (string)
- interview_focus_areas (array of strings)
- recommendation (string, e.g., 'Strong Hire', 'Fair Fit', 'Pass')
- confidence_score (integer 0-100)
- additional_notes (string)

Candidate: {json.dumps(candidate_info)}
Requirements: {json.dumps(job_requirements)}
Scoring: {json.dumps(scoring_data)}
"""
    return call_groq_llm(system_prompt, user_prompt)
