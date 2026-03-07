"""Authentication handler for user registration and login"""
import bcrypt
import jwt
from datetime import datetime, timedelta
from bson.objectid import ObjectId
from database import get_users_collection
from config import JWT_SECRET

def hash_password(password):
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt)

def verify_password(password, hashed):
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed)

def create_token(user_id, role, email):
    """Create JWT token"""
    payload = {
        'user_id': str(user_id),
        'role': role,
        'email': email,
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def register_user(email, password, name, role, company_name=None):
    """Register new user"""
    try:
        users = get_users_collection()
        
        # Check if email already exists
        existing = users.find_one({"email": email})
        if existing:
            return {"error": "Email already registered"}
        
        hashed_password = hash_password(password)
        
        user_data = {
            "email": email,
            "password_hash": hashed_password,
            "name": name,
            "role": role,
            "created_at": datetime.utcnow()
        }
        
        if role == "recruiter" and company_name:
            user_data["company_name"] = company_name
        
        result = users.insert_one(user_data)
        
        return {
            "success": True,
            "user_id": str(result.inserted_id),
            "email": email,
            "role": role
        }
    except RuntimeError as e:
        return {"error": f"Database connection error: {str(e)}"}
    except Exception as e:
        return {"error": f"Registration error: {str(e)}"}

def login_user(email, password):
    """Login user"""
    try:
        users = get_users_collection()
        user = users.find_one({"email": email})
        
        if not user or not verify_password(password, user["password_hash"]):
            return {"error": "Invalid email or password"}
        
        token = create_token(user["_id"], user["role"], user["email"])
        
        return {
            "success": True,
            "token": token,
            "user_id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "company_name": user.get("company_name")
        }
    except RuntimeError as e:
        return {"error": f"Database connection error: {str(e)}"}
    except Exception as e:
        return {"error": f"Login error: {str(e)}"}

def get_user_by_id(user_id):
    """Get user by ID"""
    users = get_users_collection()
    try:
        user = users.find_one({"_id": ObjectId(user_id)})
        if user:
            del user["password_hash"]
            user["_id"] = str(user["_id"])
        return user
    except:
        return None
