import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv

load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")

try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("✓ MongoDB Connection Successful!")
    print(f"✓ Connected to database")
    
    # List databases
    print(f"✓ Databases: {client.list_database_names()}")
    client.close()
except ConnectionFailure as e:
    print(f"✗ MongoDB Connection Failed: {e}")
except Exception as e:
    print(f"✗ Error: {e}")
