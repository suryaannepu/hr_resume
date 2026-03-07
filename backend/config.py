"""Backend configuration"""
import os
from dotenv import load_dotenv

load_dotenv()

# Flask
FLASK_ENV = os.getenv("FLASK_ENV", "development")
DEBUG = FLASK_ENV == "development"

# MongoDB
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/hiring_platform")
DATABASE_NAME = "hiring_platform"

# Groq LLM
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
LLM_MODEL = "llama-3.3-70b-versatile"

# JWT
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")

# CORS
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

# Port
PORT = int(os.getenv("PORT", 5000))
