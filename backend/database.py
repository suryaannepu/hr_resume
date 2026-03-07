from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import os
import certifi
from config import MONGODB_URI, DATABASE_NAME
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
        
        # Try absolute minimal config first
        # Let the connection string handle everything
        client = MongoClient(MONGODB_URI)
        
        print("🔄 Pinging MongoDB...")
        client.admin.command('ping', timeoutMS=20000)
        db = client[DATABASE_NAME]
        print("✓ Connected to MongoDB successfully")
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
