"""Candidate Ranking Agent – Direct Groq API"""
import json
from utils.groq_client import call_groq_llm


def run_ranking(candidates_summary: list) -> dict:
    """Rank multiple candidates from best to worst fit for a position.

    Args:
        candidates_summary: list of dicts, each with keys like
            'application_id', 'candidate_name', 'match_score',
            'key_strengths', 'skill_gaps', 'recommendation'.
    """
    system_prompt = (
        "You are a data-driven hiring analyst who understands how to rank candidates "
        "fairly and objectively. You use multiple factors including skills, experience, "
        "education, and overall fit."
    )
    user_prompt = f"""Rank these candidates from best to worst fit for the position.
Provide a ranked list with clear reasoning for the ranking.

Candidates with Scores:
{json.dumps(candidates_summary, indent=2)}

Return ONLY a valid JSON object with:
- ranked_candidates (array of objects with: application_id, name, score, rank (integer starting at 1), ranking_reason (string))
- overall_analysis (string: a brief paragraph summarizing the candidate pool quality)
"""
    from utils.groq_client import safe_int
    result = call_groq_llm(system_prompt, user_prompt)
    
    # Ensure numeric fields are actually integers
    if result and "ranked_candidates" in result:
        for cand in result["ranked_candidates"]:
            cand["score"] = safe_int(cand.get("score", 0))
            cand["rank"] = safe_int(cand.get("rank", 0))
            
    return result
