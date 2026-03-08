"""Interview Practice Agent – generates questions one-by-one and evaluates answers."""
import json
from utils.groq_client import call_groq_llm


def generate_practice_question(
    job_title: str,
    job_description: str,
    candidate_skills: list,
    question_number: int,
    previous_questions: list,
) -> dict:
    """Generate a single role-specific interview question."""
    system_prompt = (
        "You are a senior technical interviewer. Generate exactly ONE interview "
        "question tailored to the job role and the candidate's skill set. "
        "Vary between Technical, Behavioral, and Situational types. "
        "Never repeat a previous question."
    )
    user_prompt = f"""Generate ONE unique interview question #{question_number} for this role.

### JOB
Title: {job_title}
Description: {job_description}

### CANDIDATE SKILLS
{json.dumps(candidate_skills)}

### PREVIOUS QUESTIONS (do NOT repeat)
{json.dumps(previous_questions)}

Return JSON ONLY:
{{
  "question": "the interview question text",
  "question_type": "Technical" | "Behavioral" | "Situational",
  "difficulty": "Easy" | "Medium" | "Hard",
  "focus_area": "the skill or topic this question targets"
}}
"""
    return call_groq_llm(system_prompt, user_prompt)


def evaluate_practice_answer(
    question: str,
    question_type: str,
    answer: str,
    job_title: str,
    job_description: str,
) -> dict:
    """Score a candidate's answer and provide detailed feedback."""
    system_prompt = (
        "You are an expert interview coach. Evaluate the candidate's answer "
        "fairly and constructively. Be specific about what was good and what "
        "could be improved."
    )
    user_prompt = f"""Evaluate this interview answer for a {job_title} position.

### QUESTION ({question_type})
{question}

### CANDIDATE'S ANSWER
{answer}

### JOB CONTEXT
{job_description}

Return JSON ONLY:
{{
  "score": <integer 0-100>,
  "verdict": "Excellent" | "Good" | "Fair" | "Needs Improvement",
  "what_was_good": ["point 1", "point 2"],
  "what_was_missed": ["point 1", "point 2"],
  "ideal_answer_hint": "A brief 2-3 sentence description of what an ideal answer would cover",
  "tip": "One actionable tip to improve"
}}
"""
    return call_groq_llm(system_prompt, user_prompt)
