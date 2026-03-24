"""Bulk Job Upload routes for recruiter dashboard"""
import json
from flask import Blueprint, request, jsonify
from auth.auth_handler import verify_token
from database.models import JobModel
from database.connection import get_jobs_collection
from utils.skill_extractor import extract_skills_from_text
from datetime import datetime

bulk_upload_bp = Blueprint('bulk_upload', __name__)

# ─── Normalization Maps ───
JOB_TYPE_MAP = {
    'remote': 'Remote', 'wfh': 'Remote', 'work from home': 'Remote',
    'onsite': 'Onsite', 'on-site': 'Onsite', 'in-office': 'Onsite', 'office': 'Onsite',
    'hybrid': 'Hybrid', 'flexible': 'Hybrid',
}

EMPLOYMENT_TYPE_MAP = {
    'full-time': 'Full-time', 'fulltime': 'Full-time', 'full time': 'Full-time', 'ft': 'Full-time',
    'part-time': 'Part-time', 'parttime': 'Part-time', 'part time': 'Part-time', 'pt': 'Part-time',
    'internship': 'Internship', 'intern': 'Internship',
    'contract': 'Contract', 'freelance': 'Contract', 'temporary': 'Contract',
}

DOMAIN_KEYWORDS = {
    'AI/ML': ['machine learning', 'deep learning', 'artificial intelligence', 'ai', 'ml', 'nlp',
              'computer vision', 'tensorflow', 'pytorch', 'neural network'],
    'Data Science': ['data science', 'data analyst', 'data engineering', 'analytics', 'pandas',
                     'statistics', 'visualization', 'tableau', 'power bi', 'big data'],
    'Web Development': ['frontend', 'backend', 'fullstack', 'full-stack', 'react', 'angular', 'vue',
                        'nodejs', 'django', 'flask', 'web developer', 'html', 'css', 'javascript'],
    'Mobile Development': ['android', 'ios', 'mobile', 'flutter', 'react native', 'swift', 'kotlin'],
    'DevOps': ['devops', 'ci/cd', 'kubernetes', 'docker', 'aws', 'azure', 'gcp', 'cloud',
               'infrastructure', 'sre', 'site reliability'],
    'Cybersecurity': ['security', 'cybersecurity', 'penetration', 'vulnerability', 'firewall',
                      'encryption', 'soc', 'incident response'],
    'Blockchain': ['blockchain', 'web3', 'solidity', 'ethereum', 'smart contract', 'crypto'],
}


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


def normalize_job_type(value):
    """Normalize job type values"""
    if not value:
        return 'Onsite'
    return JOB_TYPE_MAP.get(value.strip().lower(), value.strip().title())


def normalize_employment_type(value):
    """Normalize employment type values"""
    if not value:
        return 'Full-time'
    return EMPLOYMENT_TYPE_MAP.get(value.strip().lower(), value.strip().title())


def detect_domain(title, description):
    """Auto-detect job domain/category from title and description"""
    text = f"{title} {description}".lower()
    scores = {}
    for domain, keywords in DOMAIN_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text)
        if score > 0:
            scores[domain] = score
    if scores:
        return max(scores, key=scores.get)
    return 'Other'


def check_duplicate(job_title, location, company_name, recruiter_id):
    """Check if a similar job already exists"""
    jobs = get_jobs_collection()
    query = {
        "recruiter_id": recruiter_id,
        "job_title": {"$regex": f"^{job_title}$", "$options": "i"},
        "status": "active"
    }
    if location:
        query["location"] = {"$regex": f"^{location}$", "$options": "i"}
    if company_name:
        query["company_name"] = {"$regex": f"^{company_name}$", "$options": "i"}
    return jobs.find_one(query) is not None


def validate_job(job, index):
    """Validate a single job object, return warnings list"""
    warnings = []
    if not job.get('job_title'):
        warnings.append(f"Job #{index + 1}: Missing job_title (required)")
    if not job.get('job_description') and not job.get('description'):
        warnings.append(f"Job #{index + 1}: Missing job_description (required)")
    return warnings


def process_single_job(raw_job, recruiter_id, company_name_default):
    """Process and normalize a single job from JSON"""
    # Get description from either field name
    description = raw_job.get('job_description') or raw_job.get('description', '')
    job_title = raw_job.get('job_title', '').strip()
    company = raw_job.get('company_name', company_name_default or '').strip()

    # Normalize values
    job_type = normalize_job_type(raw_job.get('job_type'))
    employment_type = normalize_employment_type(raw_job.get('employment_type'))

    # Location
    location_data = raw_job.get('location', '')
    if isinstance(location_data, dict):
        city = location_data.get('city', '')
        country = location_data.get('country', '')
        location = f"{city}, {country}".strip(', ')
    else:
        location = str(location_data).strip() if location_data else ''

    # Skills: use provided or extract from description
    provided_skills = raw_job.get('required_skills', [])
    if isinstance(provided_skills, str):
        provided_skills = [s.strip() for s in provided_skills.split(',') if s.strip()]

    extracted = extract_skills_from_text(description)
    if provided_skills:
        all_skills = list(set([s.strip().title() for s in provided_skills] + extracted['all']))
    else:
        all_skills = extracted['all']

    # Auto-detect domain
    domain = raw_job.get('domain') or raw_job.get('category') or detect_domain(job_title, description)

    # Deadline
    deadline = raw_job.get('deadline', '')

    # Resume template
    resume_template = raw_job.get('resume_template', None)

    processed = {
        "recruiter_id": recruiter_id,
        "company_name": company,
        "job_title": job_title,
        "description": description,
        "location": location,
        "job_type": job_type,
        "employment_type": employment_type,
        "experience_required": raw_job.get('experience_required', ''),
        "salary_range": raw_job.get('salary_range', ''),
        "domain": domain,
        "required_skills": sorted(all_skills),
        "technical_requirements": extracted['technical'],
        "soft_requirements": extracted['soft'],
        "deadline": deadline,
        "resume_template": resume_template,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "status": "active",
        "source": "bulk_upload"
    }
    return processed


@bulk_upload_bp.route('/parse', methods=['POST'])
@require_auth
def parse_bulk_jobs(payload):
    """Parse and validate uploaded JSON, return preview data without inserting"""
    try:
        # Accept JSON file or raw JSON body
        if request.content_type and 'multipart/form-data' in request.content_type:
            file = request.files.get('file')
            if not file:
                return jsonify({"error": "No file uploaded"}), 400
            if not file.filename.endswith('.json'):
                return jsonify({"error": "Only .json files are accepted"}), 400
            try:
                content = file.read().decode('utf-8')
                raw_jobs = json.loads(content)
            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                return jsonify({"error": f"Invalid JSON file: {str(e)}"}), 400
        else:
            data = request.get_json()
            if not data:
                return jsonify({"error": "No JSON data provided"}), 400
            raw_jobs = data.get('jobs', data) if isinstance(data, dict) else data

        if not isinstance(raw_jobs, list):
            raw_jobs = [raw_jobs]

        if len(raw_jobs) == 0:
            return jsonify({"error": "No jobs found in the uploaded data"}), 400

        if len(raw_jobs) > 500:
            return jsonify({"error": "Maximum 500 jobs per upload"}), 400

        from auth.auth_handler import verify_token
        from database.connection import get_users_collection
        from bson.objectid import ObjectId
        users = get_users_collection()
        user = users.find_one({"_id": ObjectId(payload['user_id'])})
        company_name_default = user.get('company_name', '') if user else ''

        processed_jobs = []
        all_warnings = []
        duplicates = []

        for i, raw_job in enumerate(raw_jobs):
            # Validate
            warnings = validate_job(raw_job, i)
            all_warnings.extend(warnings)

            if not raw_job.get('job_title'):
                continue  # Skip jobs without title

            # Check duplicate
            is_dup = check_duplicate(
                raw_job.get('job_title', ''),
                raw_job.get('location', ''),
                raw_job.get('company_name', company_name_default),
                payload['user_id']
            )
            if is_dup:
                duplicates.append(f"Job #{i + 1}: '{raw_job.get('job_title')}' may be a duplicate")

            # Process
            processed = process_single_job(raw_job, payload['user_id'], company_name_default)
            processed['_index'] = i
            processed['_is_duplicate'] = is_dup
            processed_jobs.append(processed)

        return jsonify({
            "success": True,
            "total_parsed": len(processed_jobs),
            "total_raw": len(raw_jobs),
            "jobs": processed_jobs,
            "warnings": all_warnings,
            "duplicates": duplicates
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to parse jobs: {str(e)}"}), 500


@bulk_upload_bp.route('/post', methods=['POST'])
@require_auth
def post_bulk_jobs(payload):
    """Post selected parsed jobs to the database"""
    try:
        data = request.get_json()
        if not data or 'jobs' not in data:
            return jsonify({"error": "No jobs provided"}), 400

        jobs_to_post = data['jobs']
        if not isinstance(jobs_to_post, list) or len(jobs_to_post) == 0:
            return jsonify({"error": "Jobs list is empty"}), 400

        results = []
        success_count = 0
        fail_count = 0

        for job in jobs_to_post:
            try:
                # Remove preview-only fields
                job.pop('_index', None)
                job.pop('_is_duplicate', None)

                # Ensure required fields
                if not job.get('job_title') or not job.get('description'):
                    results.append({
                        "job_title": job.get('job_title', 'Unknown'),
                        "status": "failed",
                        "error": "Missing required fields"
                    })
                    fail_count += 1
                    continue

                # Ensure recruiter_id is set
                job['recruiter_id'] = payload['user_id']
                job['created_at'] = datetime.utcnow()
                job['updated_at'] = datetime.utcnow()
                job['status'] = 'active'

                # Insert
                jobs_col = get_jobs_collection()
                result = jobs_col.insert_one(job)

                results.append({
                    "job_title": job.get('job_title'),
                    "job_id": str(result.inserted_id),
                    "status": "success"
                })
                success_count += 1

            except Exception as e:
                results.append({
                    "job_title": job.get('job_title', 'Unknown'),
                    "status": "failed",
                    "error": str(e)
                })
                fail_count += 1

        return jsonify({
            "success": True,
            "total_posted": success_count,
            "total_failed": fail_count,
            "results": results
        }), 201

    except Exception as e:
        return jsonify({"error": f"Failed to post jobs: {str(e)}"}), 500


@bulk_upload_bp.route('/insights', methods=['GET'])
@require_auth
def recruiter_insights(payload):
    """Get recruiter insights: total jobs, apps per job, most demanded skills"""
    from database.connection import get_applications_collection
    user_id = payload['user_id']
    jobs = JobModel.list_recruiter_jobs(user_id)

    if not jobs:
        return jsonify({
            "total_jobs": 0,
            "total_applications": 0,
            "top_skills": [],
            "jobs_summary": []
        }), 200

    apps_col = get_applications_collection()
    job_ids = [j['_id'] for j in jobs]
    all_apps = list(apps_col.find({"job_id": {"$in": job_ids}}))

    # Count apps per job
    apps_by_job = {}
    for app in all_apps:
        jid = app['job_id']
        apps_by_job[jid] = apps_by_job.get(jid, 0) + 1

    # Top demanded skills across all jobs
    skill_counts = {}
    for j in jobs:
        for skill in j.get('required_skills', []):
            sk = skill.lower()
            skill_counts[sk] = skill_counts.get(sk, 0) + 1

    top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:15]

    jobs_summary = []
    for j in jobs:
        jobs_summary.append({
            "job_id": j['_id'],
            "job_title": j.get('job_title'),
            "domain": j.get('domain'),
            "applications": apps_by_job.get(j['_id'], 0),
            "status": j.get('status')
        })

    return jsonify({
        "total_jobs": len(jobs),
        "total_applications": len(all_apps),
        "top_skills": [{"skill": s[0].title(), "count": s[1]} for s in top_skills],
        "jobs_summary": sorted(jobs_summary, key=lambda x: x['applications'], reverse=True)
    }), 200
