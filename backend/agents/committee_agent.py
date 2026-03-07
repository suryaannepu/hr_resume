"""Hiring Committee Synthesis Agent

Aggregates outputs from multiple agents into one final structured decision.
"""

from crewai import Agent, Task
from langchain_groq import ChatGroq
import os


def create_committee_agent():
    llm = ChatGroq(
        model=os.getenv("LLM_MODEL", "llama-3.3-70b-versatile"),
        groq_api_key=os.getenv("GROQ_API_KEY"),
    )

    return Agent(
        role="Hiring Committee Chair",
        goal="Synthesize all agent findings into a final decision packet for recruiter and candidate",
        backstory=(
            "You chair a hiring committee. You reconcile different agent opinions, call out uncertainties, "
            "and produce a clear, decision-ready summary."
        ),
        llm=llm,
        verbose=False,
    )


def create_committee_task():
    return Task(
        description=(
            "Synthesize all prior agent outputs in context into a final packet.\n\n"
            "Return ONLY valid JSON with keys:\n"
            "- final_match_score: integer 0-100 (may adjust earlier score slightly)\n"
            "- final_recommendation: string ('Strong Fit','Good Fit','Fair Fit','Poor Fit')\n"
            "- summary_for_recruiter: string (3-6 sentences)\n"
            "- summary_for_candidate: string (2-5 sentences, constructive)\n"
            "- top_strengths: array of strings (max 5)\n"
            "- top_gaps: array of strings (max 5)\n"
            "- hiring_risks: array of strings (max 5)\n"
            "- decision_rationale: array of strings (max 6)\n"
            "- next_step: string (e.g., 'Phone screen', 'Technical interview', 'Reject')\n"
            "- confidence_score: integer 0-100\n"
        ),
        expected_output="JSON object with final decision packet",
    )


