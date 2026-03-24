"""MongoDB models and operations"""
from datetime import datetime
from bson.objectid import ObjectId
from database.connection import get_users_collection, get_jobs_collection, get_applications_collection, get_shortlisted_collection, get_saved_jobs_collection

class JobModel:
    @staticmethod
    def create_job(recruiter_id, company_name, job_title, description, required_skills, deadline=None, domain="Other", location=None, job_type="Onsite", employment_type="Full-time", resume_template=None):
        """Create a new job posting"""
        from utils.skill_extractor import extract_skills_from_text
        
        jobs = get_jobs_collection()
        
        # Normalize skills input
        if isinstance(required_skills, str):
            skills = [s.strip() for s in required_skills.split(',')]
        else:
            skills = list(required_skills)
        
        # Extract additional skills from description
        description_skills = extract_skills_from_text(description)
        
        # Merge skills (remove duplicates)
        merged_skills = list(set(skills + description_skills['all']))
        
        job_data = {
            "recruiter_id": recruiter_id,
            "company_name": company_name,
            "job_title": job_title,
            "domain": domain,
            "description": description,
            "required_skills": sorted(merged_skills),
            "technical_requirements": description_skills['technical'],
            "soft_requirements": description_skills['soft'],
            "deadline": deadline,
            "location": location or {"city": "", "country": ""},
            "job_type": job_type,
            "employment_type": employment_type,
            "resume_template": resume_template or {},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "status": "active"
        }
        result = jobs.insert_one(job_data)
        return str(result.inserted_id)
    
    @staticmethod
    def bulk_create_jobs(jobs_data):
        """Bulk create jobs from parsed JSON"""
        if not jobs_data:
            return []
        
        jobs = get_jobs_collection()
        for job in jobs_data:
            if "created_at" not in job:
                job["created_at"] = datetime.utcnow()
            if "updated_at" not in job:
                job["updated_at"] = datetime.utcnow()
            if "status" not in job:
                job["status"] = "active"
                
        result = jobs.insert_many(jobs_data)
        return [str(idx) for idx in result.inserted_ids]
    
    @staticmethod
    def get_job(job_id):
        """Get job details"""
        jobs = get_jobs_collection()
        try:
            job = jobs.find_one({"_id": ObjectId(job_id)})
            if job:
                job["_id"] = str(job["_id"])
                job["recruiter_id"] = str(job["recruiter_id"])
            return job
        except:
            return None
    
    @staticmethod
    def list_all_jobs():
        """List all active jobs that haven't passed their deadline"""
        jobs = get_jobs_collection()
        now = datetime.utcnow()
        
        # Query for active jobs
        query = {"status": "active"}
        
        all_jobs = list(jobs.find(query).sort("created_at", -1))
        
        active_jobs = []
        for job in all_jobs:
            # Check deadline if exists
            deadline = job.get('deadline')
            if deadline:
                try:
                    # Deadline is stored as string in ISO format or similar from frontend
                    if isinstance(deadline, str):
                        deadline_dt = datetime.fromisoformat(deadline.replace('Z', '+00:00'))
                    else:
                        deadline_dt = deadline
                        
                    if deadline_dt < now:
                        # Auto-close if deadline passed
                        jobs.update_one({"_id": job["_id"]}, {"$set": {"status": "closed"}})
                        continue
                except Exception as e:
                    print(f"Error checking deadline for job {job['_id']}: {e}")
            
            job["_id"] = str(job["_id"])
            job["recruiter_id"] = str(job["recruiter_id"])
            active_jobs.append(job)
            
        return active_jobs
    
    @staticmethod
    def list_recruiter_jobs(recruiter_id):
        """List jobs by recruiter"""
        jobs = get_jobs_collection()
        recruiter_jobs = list(jobs.find({"recruiter_id": recruiter_id}).sort("created_at", -1))
        for job in recruiter_jobs:
            job["_id"] = str(job["_id"])
            job["recruiter_id"] = str(job["recruiter_id"])
        return recruiter_jobs

    @staticmethod
    def close_job(job_id):
        """Close a job posting"""
        jobs = get_jobs_collection()
        jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"status": "closed", "updated_at": datetime.utcnow()}}
        )
        return True

    @staticmethod
    def reopen_job(job_id):
        """Reopen a closed job posting"""
        jobs = get_jobs_collection()
        jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"status": "active", "updated_at": datetime.utcnow()}}
        )
        return True

class ApplicationModel:
    @staticmethod
    def _sanitize_application_for_list(app: dict) -> dict:
        """Remove very large fields from application docs for list endpoints."""
        if not app:
            return app
        # Resume text can be very large
        if "resume_text" in app:
            app.pop("resume_text", None)
        # Full agent outputs can be very large; detail endpoint can fetch these when needed
        if "agent_outputs" in app:
            app.pop("agent_outputs", None)
        return app

    @staticmethod
    def has_applied(candidate_id, job_id):
        """Check if candidate has already applied to a job"""
        apps = get_applications_collection()
        return apps.find_one({"candidate_id": candidate_id, "job_id": job_id}) is not None

    @staticmethod
    def create_application(job_id, candidate_id, candidate_email, resume_text, resume_filename, resume_url=None):
        """Create new application with skill extraction"""
        from utils.skill_extractor import extract_skills_from_text, match_resume_to_job
        from database.connection import get_jobs_collection
        
        apps = get_applications_collection()
        jobs = get_jobs_collection()
        
        # Get job details for matching
        job = jobs.find_one({"_id": ObjectId(job_id)})
        required_skills = job.get('required_skills', []) if job else []
        job_description = job.get('description', '') if job else ''
        
        # Extract skills from resume
        resume_skills = extract_skills_from_text(resume_text)
        
        # Match resume to job
        match_data = match_resume_to_job(resume_text, job_description, required_skills)
        
        app_data = {
            "job_id": job_id,
            "candidate_id": candidate_id,
            "candidate_email": candidate_email,
            "resume_text": resume_text,
            "resume_filename": resume_filename,
            "resume_url": resume_url,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "status": "uploaded",
            "processing_step": "uploaded",
            "decision": None,
            "match_score": match_data['match_score'],
            "match_percentage": match_data['match_percentage'],
            "extracted_skills": resume_skills['all'],
            "technical_skills": resume_skills['technical'],
            "soft_skills": resume_skills['soft'],
            "matched_skills": match_data['matched_skills'],
            "missing_skills": match_data['missing_skills']
        }
        result = apps.insert_one(app_data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_application(application_id):
        """Get application details"""
        apps = get_applications_collection()
        try:
            app = apps.find_one({"_id": ObjectId(application_id)})
            if app:
                app["_id"] = str(app["_id"])
                app["job_id"] = str(app["job_id"])
                app["candidate_id"] = str(app["candidate_id"])
            return app
        except:
            return None
    
    @staticmethod
    def get_job_applications(job_id):
        """Get all applications for a job"""
        apps = get_applications_collection()
        applications = list(apps.find({"job_id": job_id}).sort("match_score", -1))
        for app in applications:
            app["_id"] = str(app["_id"])
            app["job_id"] = str(app["job_id"])
            app["candidate_id"] = str(app["candidate_id"])
            ApplicationModel._sanitize_application_for_list(app)
        return applications
    
    @staticmethod
    def get_candidate_applications(candidate_id):
        """Get all applications for a specific candidate with job details - optimized"""
        apps_col = get_applications_collection()
        jobs_col = get_jobs_collection()
        
        applications = list(apps_col.find({"candidate_id": candidate_id}).sort("created_at", -1))
        
        if not applications:
            return []
            
        # Batch fetch all required jobs
        job_ids = list(set([ObjectId(app["job_id"]) for app in applications]))
        jobs_cursor = jobs_col.find({"_id": {"$in": job_ids}})
        jobs_map = {str(j["_id"]): j for j in jobs_cursor}
        
        enriched = []
        for app in applications:
            app["_id"] = str(app["_id"])
            app["job_id"] = str(app["job_id"])
            app["candidate_id"] = str(app["candidate_id"])
            
            # Get job details from map
            job = jobs_map.get(app["job_id"])
            if job:
                app["job_title"] = job.get("job_title", "Unknown Role")
                app["company_name"] = job.get("company_name", "Unknown Company")
                app["job_deadline"] = job.get("deadline")
                app["job_domain"] = job.get("domain")
                
            ApplicationModel._sanitize_application_for_list(app)
            enriched.append(app)
            
        return enriched

    @staticmethod
    def update_decision(application_id, decision):
        """Update candidate decision and status (shortlisted/rejected/hired)"""
        apps = get_applications_collection()
        
        # Map decision to status
        status_map = {
            "shortlisted": "interview_pending",
            "rejected": "rejected",
            "hired": "hired"
        }
        
        status = status_map.get(decision, decision)
        
        apps.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": {
                "decision": decision,
                "status": status,
                "decision_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
        return True

    @staticmethod
    def update_status(application_id, status):
        """Update application status only"""
        apps = get_applications_collection()
        apps.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": {
                "status": status,
                "updated_at": datetime.utcnow()
            }}
        )
        return True

class ShortlistModel:
    @staticmethod
    def create_shortlist_entry(job_id, candidate_id, application_id, score, rank):
        """Create shortlist entry"""
        shortlist = get_shortlisted_collection()
        entry = {
            "job_id": job_id,
            "candidate_id": candidate_id,
            "application_id": application_id,
            "score": score,
            "rank": rank,
            "approved_by_recruiter": False,
            "created_at": datetime.utcnow()
        }
        result = shortlist.insert_one(entry)
        return str(result.inserted_id)
    
    @staticmethod
    def get_job_shortlist(job_id):
        """Get shortlist for a job"""
        shortlist = get_shortlisted_collection()
        entries = list(shortlist.find({"job_id": job_id}).sort("rank", 1))
        for entry in entries:
            entry["_id"] = str(entry["_id"])
            entry["job_id"] = str(entry["job_id"])
            entry["candidate_id"] = str(entry["candidate_id"])
        return entries
    
    @staticmethod
    def approve_shortlist(job_id, candidate_ids):
        """Approve shortlist for candidates"""
        shortlist = get_shortlisted_collection()
        for cid in candidate_ids:
            shortlist.update_one(
                {"job_id": job_id, "candidate_id": cid},
                {"$set": {"approved_by_recruiter": True, "approved_at": datetime.utcnow()}}
            )
        return True

class SavedJobModel:
    @staticmethod
    def save_job(candidate_id, job_id):
        col = get_saved_jobs_collection()
        # avoid duplicates
        existing = col.find_one({"candidate_id": candidate_id, "job_id": job_id})
        if not existing:
            col.insert_one({
                "candidate_id": candidate_id,
                "job_id": job_id,
                "saved_at": datetime.utcnow()
            })
        return True

    @staticmethod
    def unsave_job(candidate_id, job_id):
        col = get_saved_jobs_collection()
        col.delete_one({"candidate_id": candidate_id, "job_id": job_id})
        return True

    @staticmethod
    def get_saved_jobs(candidate_id):
        col = get_saved_jobs_collection()
        saved = list(col.find({"candidate_id": candidate_id}).sort("saved_at", -1))
        for s in saved:
            s["_id"] = str(s["_id"])
        return saved

