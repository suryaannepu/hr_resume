from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import os
import certifi
from core.config import MONGODB_URI, DATABASE_NAME
import time

client = None
db = None
MAX_RETRIES = 3
RETRY_DELAY = 2

def connect_db(retry_count=0, is_startup=False):
    """Connect to MongoDB with retry logic (non-blocking)"""
    global client, db
    if db is not None:
        # Already connected
        return db
    
    max_retries = 1 if is_startup else MAX_RETRIES  # Limit initial startup attempts
    
    try:
        print(f"🔄 Attempting to connect to MongoDB...")
        
        # Use certifi for SSL certificates to avoid handshake failures
        client = MongoClient(MONGODB_URI, tlsCAFile=certifi.where())
        
        print("🔄 Pinging MongoDB...")
        client.admin.command('ping', timeoutMS=20000)
        db = client[DATABASE_NAME]
        print("✓ Connected to MongoDB successfully")
        
        # Create indexes for performance
        create_indexes(db)
        
        return db
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        if retry_count < max_retries:
            retry_count += 1
            if not is_startup:
                print(f"⚠️  MongoDB connection failed, retrying... (Attempt {retry_count}/{max_retries})")
                time.sleep(RETRY_DELAY)
            return connect_db(retry_count, is_startup)
        else:
            if not is_startup or retry_count > 0:
                print(f"⚠️  MongoDB unavailable: {type(e).__name__}. App will continue, but API calls may fail.")
            db = None
            return None
    except Exception as e:
        if not is_startup:
            print(f"⚠️  Database error: {e}")
        return None

def create_indexes(db_instance):
    """Create essential indexes for performance"""
    try:
        # Users collection
        db_instance["users"].create_index("google_id", sparse=True)
        db_instance["users"].create_index("email", unique=True)
        
        # Jobs collection
        db_instance["jobs"].create_index("recruiter_id")
        db_instance["jobs"].create_index("status")
        db_instance["jobs"].create_index([("created_at", -1)])
        db_instance["jobs"].create_index("location")
        db_instance["jobs"].create_index("required_skills")
        db_instance["jobs"].create_index("job_type")
        
        # Saved Jobs collection
        db_instance["saved_jobs"].create_index("candidate_id")
        db_instance["saved_jobs"].create_index("job_id")
        
        # Applications collection
        db_instance["applications"].create_index("job_id")
        db_instance["applications"].create_index("candidate_id")
        db_instance["applications"].create_index("status")
        db_instance["applications"].create_index([("match_score", -1)])
        db_instance["applications"].create_index([("created_at", -1)])
        
        # Shortlisted collection
        db_instance["shortlisted_candidates"].create_index("job_id")
        db_instance["shortlisted_candidates"].create_index("candidate_id")
        
        # ATS Checks collection
        db_instance["ats_checks"].create_index("candidate_id")
        db_instance["ats_checks"].create_index([("created_at", -1)])
        
        print("✓ Database indexes verified/created")
    except Exception as e:
        print(f"⚠️  Failed to create indexes: {e}")

def get_db():
    """Get database instance"""
    global db
    if db is None:
        connect_db()
    return db

def close_db():
    """Close database connection"""
    global client, db
    if client:
        client.close()
        db = None

# Collections - with safety checks
def get_users_collection():
    db_instance = get_db()
    if db_instance is None:
        raise RuntimeError("Database connection not available")
    return db_instance["users"]

def get_jobs_collection():
    db_instance = get_db()
    if db_instance is None:
        raise RuntimeError("Database connection not available")
    return db_instance["jobs"]

def get_applications_collection():
    db_instance = get_db()
    if db_instance is None:
        raise RuntimeError("Database connection not available")
    return db_instance["applications"]

def get_shortlisted_collection():
    db_instance = get_db()
    if db_instance is None:
        raise RuntimeError("Database connection not available")
    return db_instance["shortlisted_candidates"]

def get_saved_jobs_collection():
    db_instance = get_db()
    if db_instance is None:
        raise RuntimeError("Database connection not available")
    return db_instance["saved_jobs"]

def get_voice_sessions_collection():
    db_instance = get_db()
    if db_instance is None:
        raise RuntimeError("Database connection not available")
    return db_instance["voice_interview_sessions"]
