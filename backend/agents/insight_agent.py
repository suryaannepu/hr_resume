"""Candidate Insight Agent"""
from crewai import Agent, Task
from langchain_groq import ChatGroq
import os

def create_insight_agent():
    """Create Candidate Insight Agent"""
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=os.getenv("GROQ_API_KEY")
    )
    
    return Agent(
        role="Recruitment Intelligence Agent",
        goal="Generate detailed insights and analysis about each candidate's strengths, gaps, and fit",
        backstory="You are an expert talent intelligence specialist who provides nuanced candidate analysis. "
                  "You identify both strengths to leverage and development areas for the role.",
        llm=llm,
        verbose=False
    )

def create_insight_task(candidate_info, scoring_analysis):
    """Create task for generating candidate insights"""
    return Task(
        description=f"""Generate detailed insights about this candidate.

Candidate Information:
{str(candidate_info)}

Scoring Analysis:
{str(scoring_analysis)}

Provide insights on:
1. Key strengths for this role
2. Technical skill gaps
3. Growth potential
4. Recommended next steps
5. Interview focus areas
6. Overall recommendation

Return ONLY a valid JSON object with:
- key_strengths (array of strings)
- skill_gaps (array of strings)
- growth_potential (string)
- interview_focus_areas (array of strings)
- recommendation (string: 'Strong Fit', 'Good Fit', 'Fair Fit', 'Poor Fit')
- confidence_score (integer 0-100)
- additional_notes (string)

Example format:
{{"key_strengths": ["5+ years experience", "All required skills"], "skill_gaps": ["Docker", "Kubernetes"], "growth_potential": "High - shows initiative in projects", "interview_focus_areas": ["Cloud architecture", "System design"], "recommendation": "Strong Fit", "confidence_score": 85, "additional_notes": "Consider for senior role"}}""",
        expected_output="JSON object with candidate insights"
    )
