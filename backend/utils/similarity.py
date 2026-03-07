"""Similarity and scoring utilities"""
from sentence_transformers import SentenceTransformer, util
import torch

# Load pre-trained model once
model = SentenceTransformer('all-MiniLM-L6-v2')

def calculate_skill_match_score(candidate_skills, required_skills):
    """
    Calculate similarity score between candidate skills and required skills.
    Uses sentence-transformers for semantic similarity.
    """
    if not candidate_skills or not required_skills:
        return 0
    
    try:
        # Encode all skills
        candidate_embeddings = model.encode(candidate_skills, convert_to_tensor=True)
        required_embeddings = model.encode(required_skills, convert_to_tensor=True)
        
        # Calculate cosine similarities
        cos_scores = util.pytorch_cos_sim(candidate_embeddings, required_embeddings)
        
        # Get max score for each required skill
        max_scores = torch.max(cos_scores, dim=0)[0]
        
        # Average the scores and convert to 0-100 scale
        avg_score = torch.mean(max_scores).item()
        match_score = int(avg_score * 100)
        
        return min(max(match_score, 0), 100)
    except Exception as e:
        print(f"Error calculating similarity: {e}")
        return 0

def normalize_skill(skill):
    """Normalize skill name for better matching"""
    # Convert to lowercase
    skill = skill.lower().strip()
    
    # Common mappings
    skill_mappings = {
        'pytorch framework': 'pytorch',
        'tensorflow framework': 'tensorflow',
        'scikit-learn': 'sklearn',
        'aws': 'amazon web services',
        'gcp': 'google cloud platform',
        'javascript': 'js',
        'typescript': 'ts',
        'c#': 'csharp',
        'c++': 'cpp',
        'r programming': 'r',
        'machine learning': 'ml',
        'deep learning': 'dl',
        'nlp': 'natural language processing',
    }
    
    return skill_mappings.get(skill, skill)

def calculate_experience_score(years_of_experience, required_experience):
    """Calculate score based on years of experience"""
    if years_of_experience >= required_experience:
        return 100
    elif years_of_experience >= required_experience * 0.5:
        return int((years_of_experience / required_experience) * 100)
    else:
        return int((years_of_experience / required_experience) * 50)
