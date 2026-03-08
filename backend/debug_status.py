import os
from pymongo import MongoClient
from dotenv import load_dotenv
import certifi
from bson.objectid import ObjectId

def check_apps():
    load_dotenv()
    uri = os.getenv("MONGODB_URI")
    client = MongoClient(uri, tlsCAFile=certifi.where())
    db = client.get_database("hiring_platform")
    apps_col = db.get_collection("applications")
    
    print("--- Current Application Statuses ---")
    for app in apps_col.find():
        print(f"ID: {app['_id']} | Status: {app.get('status')} | Step: {app.get('processing_step')} | Error: {app.get('error')}")

if __name__ == "__main__":
    check_apps()
