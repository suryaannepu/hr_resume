"""Skill Normalization Agent – Direct Groq API"""
import json
from utils.groq_client import call_groq_llm


def run_skill_normalization(raw_skills: list) -> dict:
    """Normalize and standardize technical skills to industry standard names."""
    system_prompt = (
        "You are an expert in skill taxonomy and industry standards. "
        "You identify variations of the same skill and normalize them to standard names. "
        "Example: 'PyTorch framework' -> 'PyTorch', 'JS' -> 'JavaScript'."
    )
    user_prompt = f"""Normalize and standardize these skills to industry standard names.
Remove duplicates and similar skills that refer to the same technology.
Be consistent with naming (e.g., 'JavaScript' not 'JS', 'Machine Learning' not 'ML').

Raw Skills:
{json.dumps(raw_skills)}

Return ONLY a valid JSON object with:
- normalized_skills (array of standardized skill names)
- skill_categories (object mapping category names like 'Languages', 'Frameworks', 'Tools', 'Soft Skills' to arrays of skill names)
"""
    return call_groq_llm(system_prompt, user_prompt)
