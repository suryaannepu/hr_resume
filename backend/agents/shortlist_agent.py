"""Shortlisting Recommendation Agent – Direct Groq API"""
import json
from utils.groq_client import call_groq_llm


def run_shortlisting(ranked_candidates: list, total_positions: int = 5) -> dict:
    """Recommend which candidates should be shortlisted.

    Args:
        ranked_candidates: list of dicts from ranking agent output.
        total_positions: approximate number of candidates to recommend.
    """
    system_prompt = (
        "You are a senior hiring manager with extensive experience selecting top candidates. "
        "You make data-driven recommendations but understand that final approval rests with the recruiter."
    )
    user_prompt = f"""Based on the ranked candidates, recommend which ones should be shortlisted.
Recommend approximately {total_positions} candidates, but provide reasoning.
NOTE: This is a RECOMMENDATION only. The recruiter will make the final decision.

Ranked Candidates:
{json.dumps(ranked_candidates, indent=2)}

Return ONLY a valid JSON object with:
- recommended_for_shortlist (array of application_id strings)
- not_recommended (array of application_id strings)
- shortlist_reasoning (string explaining the recommendation)
- suggested_shortlist_size (integer)
- alternative_candidates (array of application_id strings who could be considered)
- follow_up_actions (array of strings)
"""
    return call_groq_llm(system_prompt, user_prompt)
