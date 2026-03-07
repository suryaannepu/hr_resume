"""Job Description Analyzer Agent"""
from crewai import Agent, Task
from langchain_groq import ChatGroq
import os

def create_jd_analyzer_agent():
    """Create Job Description Analyzer Agent"""
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=os.getenv("GROQ_API_KEY")
    )
    
    return Agent(
        role="HR Analyst",
        goal="Analyze job description and extract required technical skills, soft skills, and experience requirements",
        backstory="You are an experienced HR analyst with deep knowledge of technical roles and skill requirements. "
                  "You can accurately identify what skills and experience a candidate needs for a specific job.",
        llm=llm,
        verbose=False
    )

def create_jd_extraction_task(job_description):
    """Create task for extracting skills from job description"""
    return Task(
        description=f"""Analyze this job description and extract:
1. Required technical skills (list as array)
2. Required soft skills (list as array)
3. Years of experience required
4. Education requirements

Job Description:
{job_description}

Return ONLY a valid JSON object with these keys: 
- technical_skills (array of strings)
- soft_skills (array of strings)
- experience_years (integer)
- education (string)

Example format:
{{"technical_skills": ["Python", "SQL"], "soft_skills": ["Leadership"], "experience_years": 3, "education": "Bachelor's"}}""",
        expected_output="JSON object with extracted job requirements"
    )
