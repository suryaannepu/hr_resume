"""Committee Decision Agent – Direct Groq API"""
import json
from utils.groq_client import call_groq_llm


def run_committee_review(scoring_data: dict, insight_data: dict, risk_data: dict) -> dict:
    """Synthesize all agent reports into a final hiring recommendation."""
    system_prompt = (
        "You are the head of the hiring committee summarizing all agent reports."
    )
    user_prompt = f"""Synthesize the final hiring decision from all agents. Return JSON ONLY:
- final_match_score (integer 0-100)
- final_recommendation (string: 'Strong Hire', 'Hire', 'Weak Hire', 'No Hire')
- confidence_score (integer 0-100)
- summary_for_recruiter (string: a comprehensive paragraph summarizing the entire profile, risks, and strengths)
- immediate_next_step (string)

Scoring: {json.dumps(scoring_data)}
Insights: {json.dumps(insight_data)}
Risk: {json.dumps(risk_data)}
"""
    return call_groq_llm(system_prompt, user_prompt)
