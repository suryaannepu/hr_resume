import os
from dotenv import load_dotenv
from pymongo import MongoClient

def test_db():
    load_dotenv()
    uri = os.getenv("MONGODB_URI")
    print(f"Connecting to: {uri[:20]}...")
    
    try:
        # Try with tlsAllowInvalidCertificates=True
        client = MongoClient(uri, serverSelectionTimeoutMS=5000, tlsAllowInvalidCertificates=True)
        db = client["hiring_platform"]
        apps = db["applications"]
        
        failed = apps.find_one({"status": "failed"})
        if failed:
            print(f"Found failed app: {failed['_id']}")
            print(f"Error: {failed.get('error')}")
            print(f"Step: {failed.get('processing_step')}")
        else:
            print("No failed applications found.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_db()
