"""Job posting routes"""
from flask import Blueprint, request, jsonify
from auth.auth_handler import verify_token
from database.models import JobModel
from bson.objectid import ObjectId

jobs_bp = Blueprint('jobs', __name__)

def require_auth(f):
    """Decorator to require authentication"""
    def decorator(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"error": "No token provided"}), 401
        
        payload = verify_token(token)
        if not payload:
            return jsonify({"error": "Invalid token"}), 401
        
        return f(payload, *args, **kwargs)
    
    decorator.__name__ = f.__name__
    return decorator

@jobs_bp.route('/create', methods=['POST'])
@require_auth
def create_job(payload):
    """Create new job posting"""
    data = request.get_json()
    
    required = ['job_title', 'description', 'required_skills', 'company_name']
    if not all(k in data for k in required):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Optional fields
    deadline = data.get('deadline')
    domain = data.get('domain', 'Other')
    
    job_id = JobModel.create_job(
        recruiter_id=payload['user_id'],
        company_name=data['company_name'],
        job_title=data['job_title'],
        description=data['description'],
        required_skills=data['required_skills'],
        deadline=deadline,
        domain=domain
    )
    
    return jsonify({
        "success": True,
        "job_id": job_id,
        "message": "Job created successfully"
    }), 201

@jobs_bp.route('/list', methods=['GET'])
def list_jobs():
    """List all available jobs"""
    jobs = JobModel.list_all_jobs()
    return jsonify({"jobs": jobs}), 200

@jobs_bp.route('/list-recruiter', methods=['GET'])
@require_auth
def list_recruiter_jobs(payload):
    """List jobs posted by recruiter"""
    jobs = JobModel.list_recruiter_jobs(payload['user_id'])
    return jsonify({"jobs": jobs}), 200

@jobs_bp.route('/<job_id>', methods=['GET'])
def get_job(job_id):
    """Get job details"""
    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    return jsonify(job), 200

@jobs_bp.route('/<job_id>/close', methods=['PUT'])
@require_auth
def close_job(payload, job_id):
    """Close a job posting"""
    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job['recruiter_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403
    
    JobModel.close_job(job_id)
    return jsonify({"success": True, "message": "Job closed successfully"}), 200

@jobs_bp.route('/<job_id>/reopen', methods=['PUT'])
@require_auth
def reopen_job(payload, job_id):
    """Reopen a closed job posting"""
    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job['recruiter_id'] != payload['user_id']:
        return jsonify({"error": "Unauthorized"}), 403
    
    JobModel.reopen_job(job_id)
    return jsonify({"success": True, "message": "Job reopened successfully"}), 200

@jobs_bp.route('/<job_id>/resume-template', methods=['GET'])
def get_resume_template(job_id):
    """Get resume template for a job"""
    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    template = job.get('resume_template')

    # If no template exists, generate a smart default based on job data
    if not template:
        from utils.skill_extractor import extract_skills_from_text
        skills = job.get('required_skills', [])
        description = job.get('description', '')
        domain = job.get('domain', 'Other')
        job_title = job.get('job_title', '')

        # Build smart tips based on domain
        tips = []
        domain_lower = domain.lower()
        if 'machine learning' in domain_lower or 'ai' in domain_lower or 'data' in domain_lower:
            tips.append("Focus on ML/AI projects with measurable outcomes")
            tips.append("Include model accuracy metrics and dataset sizes")
        elif 'web' in domain_lower or 'frontend' in domain_lower or 'backend' in domain_lower or 'fullstack' in domain_lower:
            tips.append("Showcase deployed web applications with live links")
            tips.append("Highlight your tech stack proficiency")
        elif 'devops' in domain_lower:
            tips.append("Emphasize CI/CD pipelines and infrastructure automation")
            tips.append("Include uptime metrics and scaling achievements")
        elif 'mobile' in domain_lower:
            tips.append("Include app store links and download numbers")
            tips.append("Highlight cross-platform experience")
        else:
            tips.append(f"Tailor your resume to highlight {domain} skills")
            tips.append("Include quantifiable achievements and impact metrics")

        template = {
            "about": f"Short professional summary highlighting your fit for {job_title}",
            "education": "Degree, College/University, CGPA/GPA, Graduation Year",
            "skills": {
                "required": skills[:10] if skills else ["Relevant technical skills"],
                "nice_to_have": skills[10:] if len(skills) > 10 else [],
                "tip": f"Focus on skills directly mentioned in the job description"
            },
            "projects": {
                "description": f"2-3 relevant projects aligned to the {job_title} role",
                "tip": "Include GitHub links and demo URLs where possible"
            },
            "experience": {
                "description": "Work experience, internships, or freelance projects",
                "tip": "Use action verbs and quantify your impact"
            },
            "certifications": {
                "description": "Relevant certifications (optional but recommended)",
                "is_optional": True
            },
            "ai_tips": tips
        }

    return jsonify({
        "job_id": job_id,
        "job_title": job.get('job_title'),
        "domain": job.get('domain'),
        "resume_template": template
    }), 200

@jobs_bp.route('/<job_id>/generate-resume', methods=['POST'])
@require_auth
def generate_resume(payload, job_id):
    """Generate a tailored resume PDF via Groq LLM based on job and current resume"""
    data = request.get_json()
    if not data or 'resume_base64' not in data:
        return jsonify({"error": "Missing resume_base64"}), 400

    job = JobModel.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    # Extract text from the uploaded / stored PDF
    from utils.resume_parser import extract_text_from_base64
    resume_text = extract_text_from_base64(data['resume_base64'])
    if not resume_text or len(resume_text.strip()) < 20:
        return jsonify({"error": "Could not parse readable text from uploaded resume"}), 400

    from utils.groq_client import call_groq_llm
    from utils.resume_pdf_generator import generate_resume_pdf
    import base64

    system_prompt = '''You are an expert ATS-friendly resume writer.
You will receive a candidate's current resume text and a target job description.
Rewrite and optimise the candidate's resume to perfectly align with the job.
Rules:
- Do NOT fabricate any experience, education, or skills that are not already in the candidate's resume.
- DO reorder, rephrase, and emphasise existing content to match the job's keywords.
- HIGHLY IMPORTANT: In the experience and project 'points', carefully wrap important keywords, technical skills, metrics, or achievements in HTML <b> tags (e.g., "Deployed <b>AWS Lambda</b> serverless functions reducing latency by <b>40%</b>").
- Return ONLY a valid JSON object (no markdown fences) with EXACTLY these keys:
  {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number",
    "location": "City, Country",
    "linkedin": "LinkedIn URL or empty string",
    "summary": "2-3 sentence professional summary tailored to the job",
    "experience": [
      {
        "title": "Job Title",
        "company": "Company Name",
        "dates": "Start – End",
        "points": ["bullet 1 with <b>highlights</b>", "bullet 2"]
      }
    ],
    "education": [
      {
        "degree": "Degree Name",
        "institution": "Institution Name",
        "dates": "Year",
        "details": "GPA or relevant details"
      }
    ],
    "skills": {
      "categories": [
        { "name": "Category Name", "items": ["skill1", "skill2"] }
      ]
    },
    "projects": [
      {
        "name": "Project Name",
        "tech": "Technologies used",
        "description": "Short description",
        "points": ["achievement 1 with <b>bolded tech</b>"]
      }
    ],
    "certifications": ["cert 1", "cert 2"]
  }'''

    user_prompt = f'''Target Job Title: {job.get("job_title")}
Required Skills: {", ".join(job.get("required_skills", []))}
Job Description: {job.get("description", "")[:1200]}

Candidate Current Resume Text:
{resume_text[:4500]}

Produce the tailored resume JSON now.'''

    try:
        structured = call_groq_llm(system_prompt, user_prompt)
        if not structured or "name" not in structured:
            return jsonify({"error": "LLM did not return a valid structured resume"}), 500

        # Generate PDF from structured data
        pdf_bytes = generate_resume_pdf(structured)
        pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")

        safe_title = job.get("job_title", "role").replace(" ", "_")
        filename = f"tailored_resume_{safe_title}.pdf"

        return jsonify({
            "success": True,
            "pdf_base64": pdf_b64,
            "filename": filename,
            "name": structured.get("name", "")
        }), 200

    except Exception as e:
        print(f"Error generating tailored resume: {e}")
        return jsonify({"error": f"Failed to generate resume: {str(e)}"}), 500
