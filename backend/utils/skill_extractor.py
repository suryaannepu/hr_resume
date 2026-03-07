"""Skill extraction utilities"""
import re
from typing import List, Set

# Common technical skills database
TECHNICAL_SKILLS = {
    # Programming Languages
    'python', 'javascript', 'java', 'csharp', 'c#', 'cpp', 'c++', 'ruby', 'php', 'go', 'rust', 'kotlin', 'swift', 'typescript', 'scala', 'r', 'matlab',
    
    # Web Technologies
    'html', 'css', 'react', 'vue', 'angular', 'nodejs', 'express', 'django', 'flask', 'fastapi', 'spring', 'asp.net', 'asp',
    
    # Databases
    'mongodb', 'mysql', 'postgresql', 'sql', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'firebase', 'oracle', 'mariadb', 'sqlite',
    
    # Cloud Platforms
    'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'digitalocean', 'kubernetes', 'docker', 'terraform', 'ansible',
    
    # Data Science & AI
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy', 'opencv', 'nlp', 'computer vision', 'ai', 'artificial intelligence', 'nlp',
    
    # DevOps & Tools
    'git', 'github', 'gitlab', 'jenkins', 'ci/cd', 'linux', 'unix', 'windows', 'macos', 'bash', 'shell scripting', 'docker', 'kubernetes',
    
    # Mobile Development
    'android', 'ios', 'react native', 'flutter', 'xamarin', 'ionic',
    
    # Other Skills
    'agile', 'scrum', 'jira', 'rest api', 'graphql', 'microservices', 'oauth', 'jwt', 'ssl/tls', 'api development',
}

# Common soft skills
SOFT_SKILLS = {
    'communication', 'leadership', 'teamwork', 'problem solving', 'critical thinking',
    'project management', 'time management', 'adaptability', 'creativity', 'analytical',
    'strategic thinking', 'decision making', 'collaboration', 'interpersonal', 'negotiation',
}

def extract_skills_from_text(text: str) -> dict:
    """
    Extract technical and soft skills from text.
    Returns a dict with 'technical', 'soft', and 'all' skills.
    """
    # Convert to lowercase for matching
    text_lower = text.lower()
    
    # Remove special characters and extra spaces
    cleaned_text = re.sub(r'[^\w\s+#/.]', ' ', text_lower)
    
    # Extract technical skills
    technical = set()
    for skill in TECHNICAL_SKILLS:
        # Use word boundary matching to avoid partial matches
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, cleaned_text):
            technical.add(skill.title())
    
    # Extract soft skills
    soft = set()
    for skill in SOFT_SKILLS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, cleaned_text):
            soft.add(skill.title())
    
    # Combine all skills
    all_skills = sorted(list(technical | soft))
    
    return {
        'technical': sorted(list(technical)),
        'soft': sorted(list(soft)),
        'all': all_skills
    }

def match_resume_to_job(resume_text: str, job_description: str, required_skills: List[str]) -> dict:
    """
    Match resume to job based on skills and keywords.
    Returns match analysis with score.
    """
    resume_skills = extract_skills_from_text(resume_text)
    job_skills = set(skill.lower() for skill in required_skills)
    candidate_skills = set(skill.lower() for skill in resume_skills['all'])
    
    # Calculate match score
    matched_skills = candidate_skills & job_skills
    match_percentage = (len(matched_skills) / len(job_skills)) * 100 if job_skills else 0
    
    # Check for gaps
    missing_skills = job_skills - candidate_skills
    
    return {
        'match_score': round(match_percentage, 2),
        'matched_skills': sorted(list(matched_skills)),
        'missing_skills': sorted(list(missing_skills)),
        'candidate_skills': resume_skills,
        'match_percentage': f"{round(match_percentage)}%"
    }

def extract_professional_experience(text: str) -> List[str]:
    """Extract professional experience/roles from resume"""
    patterns = [
        r'(?:senior|junior|lead|principal)\s+(\w+)',  # Role with seniority
        r'(\w+)\s+(?:engineer|developer|analyst|manager|specialist)',  # Role titles
    ]
    
    experience = set()
    for pattern in patterns:
        matches = re.findall(pattern, text.lower())
        experience.update(matches)
    
    return sorted([exp.title() for exp in experience])

def extract_certifications(text: str) -> List[str]:
    """Extract certifications from resume text"""
    certification_patterns = [
        r'(?:certified|cert\.?)\s+([a-zA-Z0-9\s&\-]+?)(?:\,|$)',
        r'(?:aws|azure|gcp|google)\s+(?:certified|certification)\s+([a-zA-Z0-9\s\-]+)',
    ]
    
    certifications = set()
    for pattern in certification_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        certifications.update(matches)
    
    return sorted(list(certifications))
