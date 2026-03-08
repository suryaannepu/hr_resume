"""Job Description Analysis Agent – Direct Groq API"""
import json
from utils.groq_client import call_groq_llm


def run_jd_analysis(job_description: str) -> dict:
    """Parse a job description into structured requirements."""
    system_prompt = (
        "You are an expert technical recruiter analyzing a job description. "
        "Extract requirements into a structured JSON."
    )
    user_prompt = f"""Extract the requirements from this job description into valid JSON format ONLY:
- required_skills (array of strings)
- nice_to_have_skills (array of strings)
- minimum_years_experience (integer)
- required_education (string)
- key_responsibilities (array of strings)
- core_technologies (array of strings)

Job Description:
{job_description}
"""
    return call_groq_llm(system_prompt, user_prompt)
