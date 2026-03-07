"""Application processing pipeline that orchestrates all AI agents"""
import json
import os
from crewai import Crew
from agents.jd_agent import create_jd_analyzer_agent, create_jd_extraction_task
from agents.resume_agent import create_resume_parser_agent, create_resume_extraction_task
from agents.skill_agent import create_skill_normalization_agent, create_skill_normalization_task
from agents.scoring_agent import create_resume_scoring_agent, create_scoring_task
from agents.ranking_agent import create_ranking_agent, create_ranking_task
from agents.insight_agent import create_insight_agent, create_insight_task
from agents.shortlist_agent import create_shortlist_agent, create_shortlist_task
from database import get_applications_collection, get_jobs_collection
from bson.objectid import ObjectId

def parse_json_from_output(output_text):
    """Safely parse JSON from LLM output"""
    try:
        # Try to find JSON in the output
        start_idx = output_text.find('{')
        end_idx = output_text.rfind('}') + 1
        
        if start_idx != -1 and end_idx > start_idx:
            json_str = output_text[start_idx:end_idx]
            return json.loads(json_str)
    except:
        pass
    
    # Return empty structured response if parsing fails
    return {}

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
        # Step 1: Extract resume information
        print("[1/6] Extracting resume information...")
        resume_parser = create_resume_parser_agent()
        resume_task = create_resume_extraction_task(resume_text)
        crew = Crew(agents=[resume_parser], tasks=[resume_task])
        resume_output = crew.kickoff()
        resume_data = parse_json_from_output(str(resume_output))
        print(f"✓ Resume parsed: {resume_data.get('name', 'Unknown')}")
        
        # Step 2: Extract job requirements
        print("[2/6] Analyzing job requirements...")
        jd_analyzer = create_jd_analyzer_agent()
        jd_task = create_jd_extraction_task(job_description)
        crew = Crew(agents=[jd_analyzer], tasks=[jd_task])
        jd_output = crew.kickoff()
        job_requirements = parse_json_from_output(str(jd_output))
        print(f"✓ Job requirements extracted: {len(job_requirements.get('technical_skills', []))} technical skills")
        
        # Step 3: Normalize candidate skills
        print("[3/6] Normalizing skills...")
        candidate_skills = resume_data.get('technical_skills', [])
        if candidate_skills:
            skill_normalizer = create_skill_normalization_agent()
            skill_task = create_skill_normalization_task(candidate_skills)
            crew = Crew(agents=[skill_normalizer], tasks=[skill_task])
            skill_output = crew.kickoff()
            skill_data = parse_json_from_output(str(skill_output))
            normalized_skills = skill_data.get('normalized_skills', candidate_skills)
        else:
            normalized_skills = []
        
        print(f"✓ Skills normalized: {len(normalized_skills)} skills")
        
        # Step 4: Score the candidate
        print("[4/6] Scoring candidate...")
        resume_data['technical_skills'] = normalized_skills
        scoring_agent = create_resume_scoring_agent()
        scoring_task = create_scoring_task(resume_data, job_requirements)
        crew = Crew(agents=[scoring_agent], tasks=[scoring_task])
        scoring_output = crew.kickoff()
        scoring_data = parse_json_from_output(str(scoring_output))
        match_score = scoring_data.get('match_score', 0)
        print(f"✓ Candidate scored: {match_score}/100")
        
        # Step 5: Generate insights
        print("[5/6] Generating candidate insights...")
        insight_agent = create_insight_agent()
        insight_task = create_insight_task(resume_data, scoring_data)
        crew = Crew(agents=[insight_agent], tasks=[insight_task])
        insight_output = crew.kickoff()
        insight_data = parse_json_from_output(str(insight_output))
        print(f"✓ Insights generated: {insight_data.get('recommendation', 'N/A')}")
        
        # Step 6: Create shortlist recommendation (will be used at the end)
        print("[6/6] Creating shortlist recommendation...")
        shortlist_agent = create_shortlist_agent()
        shortlist_task = create_shortlist_task([{
            "candidate_id": str(application_id),
            "name": resume_data.get('name'),
            "score": match_score,
            "recommendation": insight_data.get('recommendation')
        }], total_positions=5)
        crew = Crew(agents=[shortlist_agent], tasks=[shortlist_task])
        shortlist_output = crew.kickoff()
        shortlist_data = parse_json_from_output(str(shortlist_output))
        print(f"✓ Shortlist recommendation created")
        
        # Update application with all results
        application_data = {
            "candidate_name": resume_data.get('name'),
            "candidate_skills": normalized_skills,
            "years_experience": resume_data.get('years_experience', 0),
            "education": resume_data.get('education'),
            "projects": resume_data.get('projects', []),
            "match_score": match_score,
            "skill_match": scoring_data.get('skill_match_percentage', 0),
            "experience_match": scoring_data.get('experience_match_percentage', 0),
            "matching_skills": scoring_data.get('matching_skills', []),
            "missing_skills": scoring_data.get('missing_skills', []),
            "key_strengths": insight_data.get('key_strengths', []),
            "skill_gaps": insight_data.get('skill_gaps', []),
            "recommendation": insight_data.get('recommendation', 'Fair Fit'),
            "confidence_score": insight_data.get('confidence_score', 0),
            "interview_focus": insight_data.get('interview_focus_areas', []),
            "notes": insight_data.get('additional_notes', ''),
            "shortlist_recommended": str(application_id) in shortlist_data.get('recommended_for_shortlist', []),
            "status": "processed"
        }
        
        # Save to database
        apps = get_applications_collection()
        apps.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": application_data}
        )
        
        print(f"\n{'='*60}")
        print(f"✓ Application processing complete!")
        print(f"{'='*60}\n")
        
        return application_data
        
    except Exception as e:
        print(f"✗ Error processing application: {str(e)}")
        # Mark as failed
        apps = get_applications_collection()
        apps.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": {"status": "failed", "error": str(e)}}
        )
        return {"error": str(e), "status": "failed"}

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
