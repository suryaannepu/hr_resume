"""ATS (Applicant Tracking System) analysis using Groq LLM"""
import json
import re
from utils.groq_client import call_groq_llm

def analyze_resume_for_ats(resume_text: str, job_description: str = None) -> dict:
    """
    Analyze resume for ATS compatibility using Groq LLM
    Returns: dict with ATS score, strengths, weaknesses, and recommendations
    """
    
    system_prompt = """You are an expert ATS (Applicant Tracking System) analyst. 
    Evaluate the resume for ATS compatibility and provide a detailed analysis.
    Return ONLY valid JSON with no additional text."""
    
    job_context = f"\nJob Description:\n{job_description}" if job_description else ""
    
    user_prompt = f"""Analyze this resume for ATS compatibility and provide detailed feedback.

Resume Text:
{resume_text}
{job_context}

Provide analysis in this JSON format:
{{
    "ats_score": <0-100>,
    "ats_compatibility": "<Poor|Fair|Good|Excellent>",
    "strengths": [<list of ATS-friendly elements>],
    "weaknesses": [<list of ATS issues to fix>],
    "recommendations": [<specific improvements>],
    "keywords_found": [<important keywords detected>],
    "keywords_missing": [<common keywords not found>],
    "section_completeness": {{
        "contact_info": <true/false>,
        "professional_summary": <true/false>,
        "work_experience": <true/false>,
        "education": <true/false>,
        "skills": <true/false>,
        "certifications": <true/false>
    }},
    "formatting_issues": [<list of formatting that might confuse ATS>]
}}"""
    
    try:
        result = call_groq_llm(system_prompt, user_prompt)
        
        # Handle if result is already a dict
        if isinstance(result, dict):
            return result
        
        # Try to parse JSON string
        if isinstance(result, str):
            # Try to extract JSON from the response
            json_match = re.search(r'\{.*\}', result, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        
        # Fallback structure
        return {
            "ats_score": 0,
            "ats_compatibility": "Unknown",
            "error": "Failed to analyze resume"
        }
    except Exception as e:
        print(f"Error in ATS analysis: {e}")
        return {
            "ats_score": 0,
            "ats_compatibility": "Error",
            "error": str(e)
        }

def calculate_ats_improvements(analysis: dict) -> dict:
    """
    Calculate improvement metrics from ATS analysis
    """
    return {
        "priority_fixes": analysis.get("weaknesses", [])[:3],
        "quick_wins": [r for r in analysis.get("recommendations", []) if "formatting" not in r.lower()][:2],
        "missing_sections": [k for k, v in analysis.get("section_completeness", {}).items() if not v],
        "improvement_potential": min(100 - analysis.get("ats_score", 0), 30)
    }
