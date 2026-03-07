"""Risk / Integrity Agent

Highlights potential risks or inconsistencies in a resume relative to a job.
This is not a fraud detector; it provides prompts for human review.
"""

from crewai import Agent, Task
from langchain_groq import ChatGroq
import os


def create_risk_agent():
    llm = ChatGroq(
        model=os.getenv("LLM_MODEL", "llama-3.3-70b-versatile"),
        groq_api_key=os.getenv("GROQ_API_KEY"),
    )

    return Agent(
        role="Hiring Risk Analyst",
        goal="Identify possible inconsistencies, unclear claims, or verification points in the resume",
        backstory=(
            "You help recruiters reduce hiring risk by pointing out ambiguous claims, missing details, "
            "or areas that need verification—without making accusations."
        ),
        llm=llm,
        verbose=False,
    )


def create_risk_task():
    return Task(
        description=(
            "Review the candidate profile extracted from the resume (in context) and the job requirements (in context). "
            "List verification prompts and potential risk signals (if any).\n\n"
            "Return ONLY valid JSON with keys:\n"
            "- risk_level: string ('Low','Medium','High')\n"
            "- verification_questions: array of strings\n"
            "- potential_inconsistencies: array of strings\n"
            "- missing_details: array of strings\n"
            "- notes: string\n\n"
            "Be conservative: if you don't see strong risk, keep it Low and explain briefly."
        ),
        expected_output="JSON object with risk assessment and verification prompts",
    )


