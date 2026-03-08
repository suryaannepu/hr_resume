import time
import os
import json
from datetime import datetime
from bson.objectid import ObjectId
from concurrent.futures import ThreadPoolExecutor
from database import get_applications_collection, get_jobs_collection
from utils.groq_client import call_groq_llm, safe_int
from utils.skill_extractor import match_resume_to_job
from utils.similarity import calculate_skill_match_score

# Import specialized agents
from agents.resume_agent import run_resume_parsing
from agents.jd_agent import run_jd_analysis
from agents.skill_agent import run_skill_normalization
from agents.scoring_agent import run_scoring
from agents.insight_agent import run_insights
from agents.risk_agent import run_risk_assessment
from agents.interview_agent import run_interview_planning
from agents.coach_agent import run_coaching
from agents.committee_agent import run_committee_review

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

def run_application_pipeline(application_id, job_id, resume_text, job_description):
    """
    Run the complete AI processing pipeline for a candidate application using direct Groq API calls.
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

        # --- Direct Groq API Pipeline ---
        # Using Parallel execution where possible to reduce latency
        
        with ThreadPoolExecutor(max_workers=3) as executor:
            # 1 & 2. Parsing Resume & JD in parallel
            _update_progress(application_id, "processing", step="parsing_resume_and_jd")
            future_resume = executor.submit(run_resume_parsing, resume_text)
            future_jd = executor.submit(run_jd_analysis, job_description)
            
            resume_data = future_resume.result()
            job_requirements = future_jd.result()
            time.sleep(0.2)
            
            # 3. Normalize Skills
            _update_progress(application_id, "processing", step="normalizing_skills")
            skill_data = run_skill_normalization(resume_data.get("technical_skills", []))
            time.sleep(0.2)
            
            # 4. Scorer Agent
            _update_progress(application_id, "processing", step="scoring")
            scoring_data = run_scoring(resume_data, job_requirements, skill_data)
            time.sleep(0.2)
            
            # --- Optional Agents Parallel Batch ---
            _update_progress(application_id, "processing", step="deep_analysis")
            
            # 5, 6, 8. Insights, Risk, Coach in parallel
            future_insights = executor.submit(run_insights, resume_data, job_requirements, scoring_data)
            future_risk = executor.submit(run_risk_assessment, resume_data, job_requirements)
            future_coach = executor.submit(run_coaching, resume_data, scoring_data.get("missing_skills", []))
            
            insight_data = {}
            try:
                insight_data = future_insights.result()
            except Exception as e:
                print(f"⚠️ Insight Agent failed: {e}")
                
            risk_data = {}
            try:
                risk_data = future_risk.result()
            except Exception as e:
                print(f"⚠️ Risk Agent failed: {e}")
                
            coach_data = {}
            try:
                coach_data = future_coach.result()
            except Exception as e:
                print(f"⚠️ Coach Agent failed: {e}")
            
            time.sleep(0.2)
            
            # 7, 9. Interview & Committee in parallel
            _update_progress(application_id, "processing", step="finalizing")
            future_interview = executor.submit(run_interview_planning, insight_data, risk_data, job_requirements)
            future_committee = executor.submit(run_committee_review, scoring_data, insight_data, risk_data)
            
            interview_data = {}
            try:
                interview_data = future_interview.result()
            except Exception as e:
                print(f"⚠️ Interview Agent failed: {e}")
                
            committee_data = {}
            try:
                committee_data = future_committee.result()
            except Exception as e:
                print(f"⚠️ Committee Agent failed: {e}")
                committee_data = {
                    "final_match_score": scoring_data.get("match_score", 0),
                    "final_recommendation": insight_data.get("recommendation", "Fair Fit"),
                    "confidence_score": insight_data.get("confidence_score", 50)
                }

        # Build Final Object
        normalized_skills = skill_data.get("normalized_skills") or resume_data.get("technical_skills") or []
        match_score = committee_data.get("final_match_score", scoring_data.get("match_score", 0))

        application_data = {
            "candidate_name": resume_data.get("name"),
            "resume_email": resume_data.get("email"),  # Store parsed email separately
            "candidate_skills": normalized_skills,
            "years_experience": safe_int(resume_data.get("years_experience", 0)),
            "education": resume_data.get("education"),
            "projects": resume_data.get("projects", []),
            "last_job_title": resume_data.get("last_job_title"),
            
            "match_score": safe_int(match_score or 0),
            "skill_match": safe_int(scoring_data.get("skill_match_percentage", 0)),
            "experience_match": safe_int(scoring_data.get("experience_match_percentage", 0)),
            "education_match": safe_int(scoring_data.get("education_match_percentage", 0)),
            "matching_skills": scoring_data.get("matching_skills", []),
            "missing_skills": scoring_data.get("missing_skills", []),
            
            "key_strengths": insight_data.get("key_strengths", []),
            "skill_gaps": insight_data.get("skill_gaps", []),
            "growth_potential": insight_data.get("growth_potential", ""),
            "recommendation": committee_data.get("final_recommendation") or insight_data.get("recommendation", "Fair Fit"),
            "confidence_score": safe_int(committee_data.get("confidence_score") or insight_data.get("confidence_score", 0)),
            "interview_focus": insight_data.get("interview_focus_areas", []),
            "notes": insight_data.get("additional_notes", ""),
            
            "risk_level": risk_data.get("risk_level", "Low"),
            "verification_questions": risk_data.get("verification_questions", []),
            
            "interview_plan": interview_data,
            "candidate_coaching": coach_data,
            "committee_packet": committee_data,
            
            "agent_outputs": {
                "resume": resume_data,
                "jd": job_requirements,
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
        import traceback
        traceback.print_exc()
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
    
    applications = list(apps.find({"job_id": job_id, "status": {"$in": ["uploaded", "failed", "processing"]}}))
    
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


def run_job_ranking_pipeline(job_id):
    """Run the Ranking Agent + Shortlisting Agent across all processed candidates for a job.

    This is triggered by the recruiter from the dashboard.
    Returns ranking and shortlisting recommendations.
    """
    apps = get_applications_collection()
    jobs = get_jobs_collection()

    job = jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        return {"error": "Job not found"}

    processed = list(apps.find({"job_id": job_id, "status": "processed"}))
    if not processed:
        return {"error": "No processed applications to rank"}

    # Build a compact summary for the ranking agent
    candidates_summary = []
    for app_doc in processed:
        candidates_summary.append({
            "application_id": str(app_doc["_id"]),
            "candidate_name": app_doc.get("candidate_name", "Unknown"),
            "match_score": app_doc.get("match_score", 0),
            "key_strengths": (app_doc.get("key_strengths") or [])[:3],
            "skill_gaps": (app_doc.get("skill_gaps") or [])[:3],
            "recommendation": app_doc.get("recommendation", ""),
            "years_experience": app_doc.get("years_experience", 0),
            "risk_level": app_doc.get("risk_level", "Low"),
        })

    # 1) Ranking Agent
    from agents.ranking_agent import run_ranking
    ranking_result = run_ranking(candidates_summary)

    # 2) Shortlisting Agent
    ranked_list = ranking_result.get("ranked_candidates", candidates_summary)
    from agents.shortlist_agent import run_shortlisting
    shortlist_result = run_shortlisting(ranked_list, total_positions=min(5, len(ranked_list)))

    # Store results on the job document for retrieval by frontend
    jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {
            "ai_ranking": ranking_result,
            "ai_shortlist": shortlist_result,
            "ranking_updated_at": datetime.utcnow(),
        }}
    )

    return {
        "ranking": ranking_result,
        "shortlist": shortlist_result,
    }


def get_job_ai_insights(job_id):
    """Generate executive-level insights for a job's candidate pool."""
    apps = get_applications_collection()
    jobs = get_jobs_collection()

    job = jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        return {"error": "Job not found"}

    processed = list(apps.find({"job_id": job_id, "status": "processed"}))
    if not processed:
        return {"insights": "No processed applications yet."}

    pool_summary = {
        "total_candidates": len(processed),
        "avg_score": round(sum(a.get("match_score", 0) for a in processed) / len(processed)),
        "top_score": max(a.get("match_score", 0) for a in processed),
        "low_score": min(a.get("match_score", 0) for a in processed),
        "risk_high": sum(1 for a in processed if a.get("risk_level") == "High"),
        "risk_medium": sum(1 for a in processed if a.get("risk_level") == "Medium"),
        "strong_recs": sum(1 for a in processed if "Strong" in (a.get("recommendation") or "")),
    }

    system_prompt = "You are a Senior VP of Talent providing executive insights."
    user_prompt = f"""Provide a concise executive summary of the candidate pool for this job.

Job Title: {job.get('job_title', 'Unknown')}
Pool Statistics: {json.dumps(pool_summary)}

Return JSON ONLY:
- executive_summary (string: 3-4 sentences)
- pool_quality (string: 'Excellent', 'Good', 'Average', 'Weak')
- top_recommendation (string: what to do next)
- key_concerns (array of strings)
"""
    insights = call_groq_llm(system_prompt, user_prompt)

    jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {
            "ai_insights": insights,
            "insights_updated_at": datetime.utcnow(),
        }}
    )

    return insights

