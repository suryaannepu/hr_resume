"""Skill Normalization Agent"""
from crewai import Agent, Task
from langchain_groq import ChatGroq
import os

def create_skill_normalization_agent():
    """Create Skill Normalization Agent"""
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=os.getenv("GROQ_API_KEY")
    )
    
    return Agent(
        role="Skill Intelligence Agent",
        goal="Standardize and normalize skills to improve matching accuracy between candidates and jobs",
        backstory="You are an expert in skill taxonomy and industry standards. "
                  "You can identify variations of the same skill and normalize them to standard names. "
                  "Example: 'PyTorch framework' -> 'PyTorch', 'JS' -> 'JavaScript'",
        llm=llm,
        verbose=False
    )

def create_skill_normalization_task(skills_list):
    """Create task for normalizing skills"""
    return Task(
        description=f"""Normalize and standardize these skills to industry standard names.
Remove duplicates and similar skills that refer to the same technology.
Be consistent with naming (e.g., 'JavaScript' not 'JS', 'Machine Learning' not 'ML').

Raw Skills:
{', '.join(skills_list)}

Return ONLY a valid JSON object with:
- normalized_skills (array of standardized skill names)
- skill_categories (object mapping skills to categories like 'Languages', 'Frameworks', 'Tools', 'Soft Skills')

Example format:
{{"normalized_skills": ["Python", "React", "SQL"], "skill_categories": {{"Languages": ["Python"], "Frameworks": ["React"], "Databases": ["SQL"]}}}}""",
        expected_output="JSON object with normalized skills and categories"
    )
