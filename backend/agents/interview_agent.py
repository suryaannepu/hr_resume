"""Interview Plan Agent

Generates role-specific interview questions and an evaluation rubric based on:
- job requirements
- candidate strengths and gaps
- scoring analysis
"""

from crewai import Agent, Task
from langchain_groq import ChatGroq
import os


def create_interview_agent():
    llm = ChatGroq(
        model=os.getenv("LLM_MODEL", "llama-3.3-70b-versatile"),
        groq_api_key=os.getenv("GROQ_API_KEY"),
    )

    return Agent(
        role="Interview Architect",
        goal="Create a structured, fair interview plan tailored to the role and the candidate's profile",
        backstory=(
            "You design interview loops for technical roles. You focus on signal, fairness, and clear rubrics "
            "so multiple interviewers can assess consistently."
        ),
        llm=llm,
        verbose=False,
    )


def create_interview_task():
    return Task(
        description=(
            "Using the job requirements + candidate profile + scoring analysis + insights (provided in context), "
            "produce a concise interview plan.\n\n"
            "Return ONLY valid JSON with keys:\n"
            "- interview_questions: array of objects {round, type, question, what_good_looks_like}\n"
            "- take_home_optional: object {suggested:boolean, prompt:string, evaluation_rubric:array}\n"
            "- red_flags_to_probe: array of strings\n"
            "- focus_areas: array of strings\n"
            "- estimated_level: string (e.g., 'Junior', 'Mid', 'Senior')\n\n"
            "Constraints:\n"
            "- 6 to 10 questions total\n"
            "- Keep questions role-relevant and avoid illegal/discriminatory topics\n"
        ),
        expected_output="JSON object with interview plan, questions, and rubric",
    )


