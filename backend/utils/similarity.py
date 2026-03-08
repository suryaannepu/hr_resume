"""Similarity and scoring utilities.

This version uses direct Groq REST API calls (via utils/groq_client)
for semantic skill matching. No external LLM SDKs required.
"""

from typing import List

from utils.groq_client import call_groq_llm


def calculate_skill_match_score(candidate_skills: List[str], required_skills: List[str]) -> int:
    """
    Calculate similarity score between candidate skills and required skills.

    Uses the Groq LLM to holistically assess overlap and relevance and returns
    an integer 0–100. If GROQ_API_KEY is not set or any error occurs, falls
    back to 0 (caller should handle this as "no extra semantic boost").
    """
    if not candidate_skills or not required_skills:
        return 0

    import os
    if not os.getenv("GROQ_API_KEY"):
        return 0

    skills_c = ", ".join(sorted(set(candidate_skills)))
    skills_r = ", ".join(sorted(set(required_skills)))

    system_prompt = "You are a hiring assistant. Given two skill lists, estimate how well the candidate skills cover the required skills."
    user_prompt = (
        f"Required skills: [{skills_r}]\n"
        f"Candidate skills: [{skills_c}]\n\n"
        "Return ONLY valid JSON with this shape:\n"
        '{"match_score": <integer 0-100>}'
    )

    try:
        result = call_groq_llm(system_prompt, user_prompt)
        score = result.get("match_score", 0)
        return max(0, min(100, int(score)))
    except Exception as e:
        print(f"Error calculating similarity with Groq: {e}")
        return 0

def normalize_skill(skill):
    """Normalize skill name for better matching"""
    # Convert to lowercase
    skill = skill.lower().strip()
    
    # Common mappings
    skill_mappings = {
        'pytorch framework': 'pytorch',
        'tensorflow framework': 'tensorflow',
        'scikit-learn': 'sklearn',
        'aws': 'amazon web services',
        'gcp': 'google cloud platform',
        'javascript': 'js',
        'typescript': 'ts',
        'c#': 'csharp',
        'c++': 'cpp',
        'r programming': 'r',
        'machine learning': 'ml',
        'deep learning': 'dl',
        'nlp': 'natural language processing',
    }
    
    return skill_mappings.get(skill, skill)

def calculate_experience_score(years_of_experience, required_experience):
    """Calculate score based on years of experience"""
    if years_of_experience >= required_experience:
        return 100
    elif years_of_experience >= required_experience * 0.5:
        return int((years_of_experience / required_experience) * 100)
    else:
        return int((years_of_experience / required_experience) * 50)
