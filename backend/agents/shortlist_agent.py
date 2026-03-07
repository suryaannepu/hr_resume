"""Shortlisting Recommendation Agent"""
from crewai import Agent, Task
from langchain_groq import ChatGroq
import os

def create_shortlist_agent():
    """Create Shortlisting Recommendation Agent"""
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=os.getenv("GROQ_API_KEY")
    )
    
    return Agent(
        role="Senior Hiring Manager",
        goal="Recommend candidates for shortlisting based on comprehensive evaluation",
        backstory="You are a senior hiring manager with extensive experience selecting top candidates. "
                  "You make data-driven recommendations but understand that final approval rests with the recruiter.",
        llm=llm,
        verbose=False
    )

def create_shortlist_task(ranked_candidates, total_positions=5):
    """Create task for generating shortlist recommendations"""
    return Task(
        description=f"""Based on the ranked candidates, recommend which ones should be shortlisted.
Recommend approximately {total_positions} candidates, but provide reasoning.
NOTE: This is a RECOMMENDATION only. The recruiter will make the final decision.

Ranked Candidates:
{str(ranked_candidates)}

Return ONLY a valid JSON object with:
- recommended_for_shortlist (array of candidate_ids)
- not_recommended (array of candidate_ids)
- shortlist_reasoning (string explaining the recommendation)
- suggested_shortlist_size (integer)
- alternative_candidates (array of candidate_ids who could be considered)
- follow_up_actions (array of strings)

Example format:
{{"recommended_for_shortlist": ["id1", "id2", "id3"], "not_recommended": ["id4"], "shortlist_reasoning": "Top candidates have strong technical fit", "suggested_shortlist_size": 3, "alternative_candidates": ["id5"], "follow_up_actions": ["Schedule technical interviews", "Prepare case studies"]}}""",
        expected_output="JSON object with shortlist recommendations"
    )
