"""Resume Scoring Agent"""
from crewai import Agent, Task
from langchain_groq import ChatGroq
import os

def create_resume_scoring_agent():
    """Create Resume Scoring Agent"""
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=os.getenv("GROQ_API_KEY")
    )
    
    return Agent(
        role="Technical Recruiter",
        goal="Calculate comprehensive match score between candidate resume and job requirements",
        backstory="You are an experienced technical recruiter with 10+ years in hiring. "
                  "You understand how to evaluate candidate fit based on skills, experience, and background.",
        llm=llm,
        verbose=False
    )

def create_scoring_task(candidate_info, job_requirements):
    """Create task for scoring resume against job requirements"""
    return Task(
        description=f"""Evaluate the candidate against the job requirements and provide a match score.

Candidate Information:
{str(candidate_info)}

Job Requirements:
{str(job_requirements)}

Consider:
1. Technical skill match (most important)
2. Years of experience
3. Education fit
4. Project experience relevance
5. Career progression

Return ONLY a valid JSON object with:
- match_score (integer 0-100)
- skill_match_percentage (integer 0-100)
- experience_match_percentage (integer 0-100)
- education_match_percentage (integer 0-100)
- matching_skills (array of skills candidate has that match job)
- missing_skills (array of required skills candidate lacks)
- strengths (array of candidate strengths)
- gaps (array of skill gaps)

Example format:
{{"match_score": 75, "skill_match_percentage": 85, "experience_match_percentage": 80, "education_match_percentage": 100, "matching_skills": ["Python", "SQL"], "missing_skills": ["Docker"], "strengths": ["5 years experience"], "gaps": ["Cloud platforms"]}}""",
        expected_output="JSON object with match score and analysis"
    )
