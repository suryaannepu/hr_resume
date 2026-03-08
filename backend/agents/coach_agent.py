"""Career Coach Agent – Direct Groq API"""
import json
from utils.groq_client import call_groq_llm


def run_coaching(candidate_info: dict, missing_skills: list) -> dict:
    """Generate constructive career coaching feedback for a candidate."""
    system_prompt = (
        "You are a career coach helping the candidate understand their application."
    )
    user_prompt = f"""Write a brief, constructive feedback note for the candidate. Return JSON ONLY:
- short_message (string: empathetic, 2-3 sentences explaining their fit)
- resume_improvements (array of strings: actionable ways to improve their resume based on their gaps)
- recommended_skills_to_learn (array of strings)

Candidate: {json.dumps(candidate_info)}
Missing Skills: {json.dumps(missing_skills)}
"""
    return call_groq_llm(system_prompt, user_prompt)
