"""Similarity and scoring utilities.

This version uses the Groq LLM (via langchain_groq.ChatGroq) instead of
sentence-transformers / all-MiniLM for semantic skill matching.
"""

from typing import List

from langchain_groq import ChatGroq

from config import GROQ_API_KEY, LLM_MODEL


def _get_llm() -> ChatGroq | None:
    """Return a configured Groq chat model, or None if not configured."""
    if not GROQ_API_KEY:
        return None
    return ChatGroq(model=LLM_MODEL, groq_api_key=GROQ_API_KEY)


def _parse_match_score(text: str) -> int:
    """Extract an integer 0–100 match_score from model output."""
    import json
    import re

    if not text:
        return 0

    # Try fenced JSON first
    fenced = re.findall(r"```(?:json)?\s*([\s\S]*?)```", text, flags=re.IGNORECASE)
    candidates = fenced if fenced else [text]

    for chunk in candidates:
        chunk = chunk.strip()
        # Slice to JSON object if possible
        start = chunk.find("{")
        end = chunk.rfind("}") + 1
        if start != -1 and end > start:
            chunk = chunk[start:end]
        try:
            data = json.loads(chunk)
            if isinstance(data, dict) and "match_score" in data:
                value = int(data["match_score"])
                return max(0, min(100, value))
        except Exception:
            continue

    # Fallback: look for a bare number 0–100
    nums = re.findall(r"\b(\d{1,3})\b", text)
    for n in nums:
        v = int(n)
        if 0 <= v <= 100:
            return v

    return 0


def calculate_skill_match_score(candidate_skills: List[str], required_skills: List[str]) -> int:
    """
    Calculate similarity score between candidate skills and required skills.

    Uses the Groq LLM to holistically assess overlap and relevance and returns
    an integer 0–100. If GROQ_API_KEY is not set or any error occurs, falls
    back to 0 (caller should handle this as "no extra semantic boost").
    """
    if not candidate_skills or not required_skills:
        return 0

    llm = _get_llm()
    if llm is None:
        # No Groq key configured – treat as neutral contribution
        return 0

    skills_c = ", ".join(sorted(set(candidate_skills)))
    skills_r = ", ".join(sorted(set(required_skills)))

    prompt = (
        "You are a hiring assistant. Given two skill lists, estimate how well the "
        "candidate skills cover the required skills.\n\n"
        f"Required skills: [{skills_r}]\n"
        f"Candidate skills: [{skills_c}]\n\n"
        "Return ONLY valid JSON with this shape:\n"
        '{\"match_score\": <integer 0-100>}'
    )

    try:
        result = llm.invoke(prompt)
        text = getattr(result, "content", str(result))
        return _parse_match_score(text)
    except Exception as e:
        print(f"Error calculating similarity with Groq LLM: {e}")
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
