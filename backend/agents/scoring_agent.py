"""Resume Scoring Agent – Direct Groq API"""
import json
from utils.groq_client import call_groq_llm


def run_scoring(candidate_info: dict, job_requirements: dict, normalized_skills: dict) -> dict:
    """Score a candidate against job requirements."""
    system_prompt = (
        "You are a master technical recruiter tasked with evaluating candidates objectively."
    )
    user_prompt = f"""Score the candidate against the job requirements. Return JSON ONLY:
- match_score (integer 0-100)
- skill_match_percentage (integer 0-100)
- experience_match_percentage (integer 0-100)
- education_match_percentage (integer 0-100)
- matching_skills (array of matches)
- missing_skills (array of required skill gaps)
- strengths (array of strings)
- gaps (array of strings)

Candidate Extract: {json.dumps(candidate_info)}
Normalized Skills: {json.dumps(normalized_skills)}
Job Requirements: {json.dumps(job_requirements)}
"""
    from utils.groq_client import safe_int
    result = call_groq_llm(system_prompt, user_prompt)
    
    # Ensure numeric fields are actually integers
    if result:
        result['match_score'] = safe_int(result.get('match_score', 0))
        result['skill_match_percentage'] = safe_int(result.get('skill_match_percentage', 0))
        result['experience_match_percentage'] = safe_int(result.get('experience_match_percentage', 0))
        result['education_match_percentage'] = safe_int(result.get('education_match_percentage', 0))
    
    return result
