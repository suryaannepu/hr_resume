import os
from dotenv import load_dotenv
from pymongo import MongoClient
from bson.objectid import ObjectId

def check_failures():
    load_dotenv()
    uri = os.getenv("MONGODB_URI")
    print(f"Connecting to: {uri[:20]}...")
    
    try:
        import certifi
        client = MongoClient(uri, serverSelectionTimeoutMS=5000, tlsCAFile=certifi.where())
        db = client["hiring_platform"]
        apps = db["applications"]
        
        failed_apps = list(apps.find({"status": "failed"}).sort("created_at", -1).limit(5))
        
        if not failed_apps:
            print("No failed applications found.")
            return

        print(f"Found {len(failed_apps)} failed applications.")
        for app in failed_apps:
            print(f"ID: {app['_id']}")
            print(f"Error: {app.get('error')}")
            print(f"Step: {app.get('processing_step')}")
            print("-" * 20)
            
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    check_failures()
