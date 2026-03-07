from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
from config import MONGODB_URI, DATABASE_NAME

client = None
db = None

def connect_db():
    """Connect to MongoDB"""
    global client, db
    if db is not None:
        # Already connected
        return db
    
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        # Verify connection
        client.admin.command('ping')
        db = client[DATABASE_NAME]
        print("✓ Connected to MongoDB")
        return db
    except ConnectionFailure as e:
        print(f"✗ Failed to connect to MongoDB: {e}")
        return None
    except Exception as e:
        print(f"✗ Database error: {e}")
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
