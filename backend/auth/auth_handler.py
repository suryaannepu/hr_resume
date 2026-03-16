"""Authentication handler for user registration and login"""
import jwt
from datetime import datetime, timedelta
from bson.objectid import ObjectId
from database.connection import get_users_collection
from core.config import JWT_SECRET, GOOGLE_CLIENT_ID
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests


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


def google_login_or_register(credential, role=None, company_name=None):
    """Handle Google OAuth login/registration.
    
    - If user exists: log them in (return JWT + user data).
    - If user is new and role is provided: register them and log in.
    - If user is new and no role: return needs_role=True so frontend can ask.
    """
    try:
        # Verify the Google ID token
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )

        email = idinfo.get('email')
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')
        google_id = idinfo.get('sub')

        if not email:
            return {"error": "Google account has no email"}

        users = get_users_collection()

        # Check if user already exists
        existing = users.find_one({"email": email})

        if existing:
            # Existing user — log them in
            token = create_token(existing["_id"], existing["role"], existing["email"])
            return {
                "success": True,
                "token": token,
                "user_id": str(existing["_id"]),
                "email": existing["email"],
                "name": existing.get("name", name),
                "role": existing["role"],
                "company_name": existing.get("company_name"),
                "picture": existing.get("picture", picture)
            }

        # New user — need role selection
        if not role:
            return {
                "needs_role": True,
                "email": email,
                "name": name,
                "picture": picture
            }

        # New user with role — register them
        user_data = {
            "email": email,
            "name": name,
            "picture": picture,
            "google_id": google_id,
            "role": role,
            "auth_provider": "google",
            "created_at": datetime.utcnow()
        }

        if role == "recruiter" and company_name:
            user_data["company_name"] = company_name

        result = users.insert_one(user_data)
        token = create_token(result.inserted_id, role, email)

        return {
            "success": True,
            "token": token,
            "user_id": str(result.inserted_id),
            "email": email,
            "name": name,
            "role": role,
            "company_name": company_name,
            "picture": picture
        }

    except ValueError as e:
        return {"error": f"Invalid Google token: {str(e)}"}
    except RuntimeError as e:
        return {"error": f"Database connection error: {str(e)}"}
    except Exception as e:
        return {"error": f"Google auth error: {str(e)}"}


def get_user_by_id(user_id):
    """Get user by ID"""
    users = get_users_collection()
    try:
        user = users.find_one({"_id": ObjectId(user_id)})
        if user:
            # Remove password_hash if present (legacy users)
            user.pop("password_hash", None)
            user["_id"] = str(user["_id"])
        return user
    except:
        return None
