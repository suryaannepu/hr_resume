#!/usr/bin/env python
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

MONGODB_URI = "mongodb+srv://suryaannepu922_db_user:kDYN6EHTTypBena4@cluster0.ldyv5ju.mongodb.net/?appName=Cluster0"

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
