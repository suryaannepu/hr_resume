"""Candidate Coach Agent

Creates constructive, candidate-facing guidance:
- resume improvements for ATS/clarity
- targeted upskilling plan based on job gaps
"""

from crewai import Agent, Task
from langchain_groq import ChatGroq
import os


def create_coach_agent():
    llm = ChatGroq(
        model=os.getenv("LLM_MODEL", "llama-3.3-70b-versatile"),
        groq_api_key=os.getenv("GROQ_API_KEY"),
    )

    return Agent(
        role="Career Coach",
        goal="Help the candidate improve their resume and close skill gaps for this role",
        backstory=(
            "You are a practical career coach specializing in technical hiring. "
            "You give concrete, actionable advice with examples."
        ),
        llm=llm,
        verbose=False,
    )


def create_coach_task():
    return Task(
        description=(
            "Using the candidate profile, job requirements, scoring analysis, and insights (provided in context), "
            "generate candidate-facing guidance.\n\n"
            "Return ONLY valid JSON with keys:\n"
            "- resume_improvements: array of strings (max 8)\n"
            "- skill_upgrade_plan: array of objects {skill, why_it_matters, first_steps}\n"
            "- portfolio_suggestions: array of strings (max 5)\n"
            "- short_message: string (2-4 sentences)\n"
        ),
        expected_output="JSON object with resume tips and upskilling plan",
    )


