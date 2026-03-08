import os
from pymongo import MongoClient
from dotenv import load_dotenv
import certifi

def clear_legacy_errors():
    load_dotenv()
    uri = os.getenv("MONGODB_URI")
    client = MongoClient(uri, tlsCAFile=certifi.where())
    db = client.get_database("hiring_platform")
    apps_col = db.get_collection("applications")
    
    query = {"error": {"$regex": ".*OPENAI_API_KEY.*", "$options": "i"}}
    count = apps_col.count_documents(query)
    
    if count > 0:
        print(f"Clearing {count} legacy OpenAI error applications...")
        # Reset them to 'uploaded' so they can be re-processed if the user clicks 'Process'
        apps_col.update_many(
            query,
            {"$set": {
                "status": "uploaded",
                "processing_step": "uploaded",
                "error": None,
                "updated_at": None
            }}
        )
        print("Done.")
    else:
        print("No legacy OpenAI errors found.")

if __name__ == "__main__":
    clear_legacy_errors()
