"""Resume Parsing Agent – Direct Groq API"""
import json
from utils.groq_client import call_groq_llm


def run_resume_parsing(resume_text: str) -> dict:
    """Parse a raw resume into structured data."""
    system_prompt = (
        "You are an expert technical recruiter parsing a raw resume. "
        "Extract key information into a structured JSON."
    )
    user_prompt = f"""Extract the following information from the resume text into valid JSON format ONLY:
- name (string)
- email (string)
- phone (string)
- years_experience (integer)
- education (string summary)
- technical_skills (array of strings)
- soft_skills (array of strings)
- last_job_title (string)
- projects (array of objects with 'name' and 'description')

Resume text:
{resume_text}
"""
    return call_groq_llm(system_prompt, user_prompt)
