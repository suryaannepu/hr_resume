"""Candidate Ranking Agent"""
from crewai import Agent, Task
from langchain_groq import ChatGroq
import os

def create_ranking_agent():
    """Create Candidate Ranking Agent"""
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=os.getenv("GROQ_API_KEY")
    )
    
    return Agent(
        role="Hiring Data Analyst",
        goal="Rank and prioritize candidates based on their match scores and qualifications",
        backstory="You are a data-driven hiring analyst who understands how to rank candidates fairly and objectively. "
                  "You use multiple factors including skills, experience, education, and overall fit.",
        llm=llm,
        verbose=False
    )

def create_ranking_task(candidates_with_scores):
    """Create task for ranking candidates"""
    return Task(
        description=f"""Rank these candidates from best to worst fit for the position.
Provide a ranked list with clear reasoning for the ranking.

Candidates with Scores:
{str(candidates_with_scores)}

Return ONLY a valid JSON object with:
- ranked_candidates (array of objects with candidate_id, name, score, rank, and ranking_reason)

Example format:
{{"ranked_candidates": [{{"candidate_id": "123", "name": "John", "score": 85, "rank": 1, "ranking_reason": "Strong technical skills and 5+ years experience"}}]}}""",
        expected_output="JSON object with ranked candidates list"
    )
