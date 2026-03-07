"""Application processing pipeline that orchestrates all AI agents"""
import json
import os
import re
from datetime import datetime
from crewai import Crew
from agents.jd_agent import create_jd_analyzer_agent, create_jd_extraction_task
from agents.resume_agent import create_resume_parser_agent, create_resume_extraction_task
from agents.skill_agent import create_skill_normalization_agent, create_skill_normalization_task
from agents.scoring_agent import create_resume_scoring_agent, create_scoring_task
from agents.ranking_agent import create_ranking_agent, create_ranking_task
from agents.insight_agent import create_insight_agent, create_insight_task
from agents.shortlist_agent import create_shortlist_agent, create_shortlist_task
from agents.interview_agent import create_interview_agent, create_interview_task
from agents.risk_agent import create_risk_agent, create_risk_task
from agents.committee_agent import create_committee_agent, create_committee_task
from agents.coach_agent import create_coach_agent, create_coach_task
from database import get_applications_collection, get_jobs_collection
from bson.objectid import ObjectId
from utils.skill_extractor import match_resume_to_job
from utils.similarity import calculate_skill_match_score

def _extract_json_candidate(text: str) -> str:
    """Extract the most likely JSON object from model output."""
    if not text:
        return ""

    # Prefer fenced JSON blocks if present
    fenced = re.findall(r"```(?:json)?\s*([\s\S]*?)\s*```", text, flags=re.IGNORECASE)
    if fenced:
        # pick the largest block
        return max(fenced, key=len).strip()

    # Fallback: slice from first { to last }
    start_idx = text.find("{")
    end_idx = text.rfind("}") + 1
    if start_idx != -1 and end_idx > start_idx:
        return text[start_idx:end_idx]
    return ""


def parse_json_from_output(output_text):
    """Safely parse JSON from LLM output, returning dict on success else {}."""
    try:
        candidate = _extract_json_candidate(str(output_text))
        if not candidate:
            return {}
        return json.loads(candidate)
    except Exception:
        return {}


def _update_progress(application_id: str, status: str, step: str = "", error: str = ""):
    apps = get_applications_collection()
    update = {
        "status": status,
        "processing_step": step,
        "updated_at": datetime.utcnow(),
    }
    if status in ("processed", "failed"):
        update["processing_completed_at"] = datetime.utcnow()
    if error:
        update["error"] = error
    apps.update_one({"_id": ObjectId(application_id)}, {"$set": update})


def _task_output_text(task) -> str:
    """Best-effort extraction of CrewAI task output text across versions."""
    out = getattr(task, "output", None)
    if out is None:
        return ""
    for attr in ("raw", "result", "text", "content", "output"):
        val = getattr(out, attr, None)
        if isinstance(val, str) and val.strip():
            return val
    try:
        s = str(out)
        return s if isinstance(s, str) else ""
    except Exception:
        return ""

def run_application_pipeline(application_id, job_id, resume_text, job_description):
    """
    Run the complete AI processing pipeline for a candidate application.
    
    Steps:
    1. Parse resume
    2. Extract job requirements
    3. Normalize skills
    4. Score candidate
    5. Generate insights
    6. Create recommendation
    
    Returns the updated application data
    """
    
    print(f"\n{'='*60}")
    print(f"Processing Application: {application_id}")
    print(f"{'='*60}\n")
    
    try:
        _update_progress(application_id, "processing", step="starting")

        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            # Fallback: keep system usable without LLM key
            _update_progress(application_id, "processing", step="fallback_scoring")
            jobs = get_jobs_collection()
            job = jobs.find_one({"_id": ObjectId(job_id)})
            required_skills = job.get("required_skills", []) if job else []

            basic_match = match_resume_to_job(resume_text, job_description, required_skills)
            semantic_score = 0
            try:
                semantic_score = calculate_skill_match_score(
                    basic_match.get("candidate_skills", {}).get("all", []),
                    required_skills,
                )
            except Exception:
                semantic_score = 0

            fallback_score = int(round((basic_match.get("match_score", 0) + semantic_score) / 2))
            application_data = {
                "match_score": fallback_score,
                "recommendation": "Fair Fit",
                "confidence_score": 20,
                "key_strengths": [],
                "skill_gaps": [],
                "status": "processed",
                "processing_step": "fallback_completed",
                "agent_outputs": {
                    "warning": "GROQ_API_KEY not set; generated fallback score only."
                },
                "updated_at": datetime.utcnow(),
            }
            apps = get_applications_collection()
            apps.update_one({"_id": ObjectId(application_id)}, {"$set": application_data})
            _update_progress(application_id, "processed", step="done")
            return application_data

        # Multi-agent, shared-context CrewAI run
        _update_progress(application_id, "processing", step="crewai_resume_and_jd")

        resume_parser = create_resume_parser_agent()
        jd_analyzer = create_jd_analyzer_agent()
        skill_normalizer = create_skill_normalization_agent()
        scoring_agent = create_resume_scoring_agent()
        insight_agent = create_insight_agent()
        risk_agent = create_risk_agent()
        interview_agent = create_interview_agent()
        coach_agent = create_coach_agent()
        committee_agent = create_committee_agent()

        resume_task = create_resume_extraction_task(resume_text)
        resume_task.agent = resume_parser

        jd_task = create_jd_extraction_task(job_description)
        jd_task.agent = jd_analyzer

        # Normalize skills using resume output context (agents interact via shared context)
        skill_task = create_skill_normalization_task(["(use skills from resume extraction output)"])
        skill_task.agent = skill_normalizer
        skill_task.context = [resume_task]
        skill_task.description = (
            "Normalize and standardize the candidate's technical skills.\n\n"
            "Use ONLY the resume extraction JSON from context as your source.\n"
            "Return ONLY valid JSON with normalized_skills + skill_categories."
        )

        scoring_task = create_scoring_task(
            {"(use candidate JSON from context)": True},
            {"(use job JSON from context)": True},
        )
        scoring_task.agent = scoring_agent
        scoring_task.context = [resume_task, jd_task, skill_task]
        scoring_task.description = (
            "Score the candidate against the job requirements.\n\n"
            "Use context:\n"
            "- resume extraction JSON\n"
            "- normalized skills JSON\n"
            "- job requirements JSON\n\n"
            "Return ONLY valid JSON with match_score, skill_match_percentage, experience_match_percentage, "
            "education_match_percentage, matching_skills, missing_skills, strengths, gaps."
        )

        insight_task = create_insight_task(
            {"(use candidate JSON from context)": True},
            {"(use scoring JSON from context)": True},
        )
        insight_task.agent = insight_agent
        insight_task.context = [resume_task, jd_task, scoring_task]
        insight_task.description = (
            "Generate nuanced hiring insights.\n\n"
            "Use context:\n"
            "- candidate resume extraction\n"
            "- job requirements\n"
            "- scoring analysis\n\n"
            "Return ONLY valid JSON with key_strengths, skill_gaps, growth_potential, interview_focus_areas, "
            "recommendation, confidence_score, additional_notes."
        )

        risk_task = create_risk_task()
        risk_task.agent = risk_agent
        risk_task.context = [resume_task, jd_task]

        interview_task = create_interview_task()
        interview_task.agent = interview_agent
        interview_task.context = [resume_task, jd_task, scoring_task, insight_task, risk_task]

        coach_task = create_coach_task()
        coach_task.agent = coach_agent
        coach_task.context = [resume_task, jd_task, scoring_task, insight_task]

        committee_task = create_committee_task()
        committee_task.agent = committee_agent
        committee_task.context = [resume_task, jd_task, skill_task, scoring_task, insight_task, risk_task, interview_task, coach_task]

        crew = Crew(
            agents=[
                resume_parser,
                jd_analyzer,
                skill_normalizer,
                scoring_agent,
                insight_agent,
                risk_agent,
                interview_agent,
                coach_agent,
                committee_agent,
            ],
            tasks=[
                resume_task,
                jd_task,
                skill_task,
                scoring_task,
                insight_task,
                risk_task,
                interview_task,
                coach_task,
                committee_task,
            ],
        )

        _update_progress(application_id, "processing", step="crewai_running")
        crew.kickoff()

        # Parse task outputs
        resume_data = parse_json_from_output(_task_output_text(resume_task))
        job_requirements = parse_json_from_output(_task_output_text(jd_task))
        skill_data = parse_json_from_output(_task_output_text(skill_task))
        scoring_data = parse_json_from_output(_task_output_text(scoring_task))
        insight_data = parse_json_from_output(_task_output_text(insight_task))
        risk_data = parse_json_from_output(_task_output_text(risk_task))
        interview_data = parse_json_from_output(_task_output_text(interview_task))
        coach_data = parse_json_from_output(_task_output_text(coach_task))
        committee_data = parse_json_from_output(_task_output_text(committee_task))

        normalized_skills = skill_data.get("normalized_skills") or resume_data.get("technical_skills") or []

        # Prefer committee's final score if present
        match_score = (
            committee_data.get("final_match_score")
            if isinstance(committee_data.get("final_match_score"), int)
            else scoring_data.get("match_score", 0)
        )

        application_data = {
            "candidate_name": resume_data.get("name"),
            "candidate_skills": normalized_skills,
            "years_experience": resume_data.get("years_experience", 0),
            "education": resume_data.get("education"),
            "projects": resume_data.get("projects", []),
            "last_job_title": resume_data.get("last_job_title"),
            "match_score": int(match_score or 0),
            "skill_match": scoring_data.get("skill_match_percentage", 0),
            "experience_match": scoring_data.get("experience_match_percentage", 0),
            "education_match": scoring_data.get("education_match_percentage", 0),
            "matching_skills": scoring_data.get("matching_skills", []),
            "missing_skills": scoring_data.get("missing_skills", []),
            "key_strengths": insight_data.get("key_strengths", []),
            "skill_gaps": insight_data.get("skill_gaps", []),
            "growth_potential": insight_data.get("growth_potential", ""),
            "recommendation": committee_data.get("final_recommendation")
            or insight_data.get("recommendation", "Fair Fit"),
            "confidence_score": committee_data.get("confidence_score")
            or insight_data.get("confidence_score", 0),
            "interview_focus": insight_data.get("interview_focus_areas", []),
            "notes": insight_data.get("additional_notes", ""),
            "risk_level": risk_data.get("risk_level", "Low"),
            "verification_questions": risk_data.get("verification_questions", []),
            "interview_plan": interview_data,
            "candidate_coaching": coach_data,
            "committee_packet": committee_data,
            "agent_outputs": {
                "resume": resume_data,
                "job_requirements": job_requirements,
                "skills": skill_data,
                "scoring": scoring_data,
                "insights": insight_data,
                "risk": risk_data,
                "interview": interview_data,
                "coach": coach_data,
                "committee": committee_data,
            },
            "status": "processed",
            "processing_step": "done",
            "updated_at": datetime.utcnow(),
        }

        apps = get_applications_collection()
        apps.update_one({"_id": ObjectId(application_id)}, {"$set": application_data})
        _update_progress(application_id, "processed", step="done")

        print(f"\n{'='*60}")
        print("✓ Application processing complete!")
        print(f"{'='*60}\n")
        return application_data

    except Exception as e:
        err = str(e)
        print(f"✗ Error processing application: {err}")
        _update_progress(application_id, "failed", step="error", error=err)
        return {"error": err, "status": "failed"}

def process_all_applications_for_job(job_id):
    """Process all applications for a specific job"""
    apps = get_applications_collection()
    jobs = get_jobs_collection()
    
    job = jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        return {"error": "Job not found"}
    
    applications = list(apps.find({"job_id": job_id, "status": {"$in": ["uploaded", "failed"]}}))
    
    results = []
    for app in applications:
        result = run_application_pipeline(
            str(app["_id"]),
            job_id,
            app.get("resume_text", ""),
            job.get("description", "")
        )
        results.append(result)
    
    return {
        "total_processed": len(results),
        "results": results
    }
