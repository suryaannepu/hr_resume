"""Resume Parser Agent"""
from crewai import Agent, Task
from langchain_groq import ChatGroq
import os

def create_resume_parser_agent():
    """Create Resume Parser Agent"""
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=os.getenv("GROQ_API_KEY")
    )
    
    return Agent(
        role="Resume Extraction Specialist",
        goal="Extract candidate information from resume and structure it in a standardized format",
        backstory="You are an expert resume parser with experience extracting data from various resume formats. "
                  "You can identify candidate name, skills, education, experience, and projects accurately.",
        llm=llm,
        verbose=False
    )

def create_resume_extraction_task(resume_text):
    """Create task for extracting information from resume"""
    return Task(
        description=f"""Analyze this resume text and extract:
1. Candidate name
2. Technical skills (list as array)
3. Years of experience (estimate)
4. Education details
5. Project experience (top 2-3 projects)
6. Current or last job title

Resume Text:
{resume_text}

Return ONLY a valid JSON object with these keys:
- name (string)
- technical_skills (array of strings)
- years_experience (integer)
- education (string)
- projects (array of strings)
- last_job_title (string)

Example format:
{{"name": "John Doe", "technical_skills": ["Python", "React"], "years_experience": 5, "education": "B.S. Computer Science", "projects": ["Project A", "Project B"], "last_job_title": "Senior Developer"}}""",
        expected_output="JSON object with extracted candidate information"
    )
