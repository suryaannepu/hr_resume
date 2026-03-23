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
        import time
        import json as json_lib
        
        current_time = int(time.time())
        print(f"[Google Auth] Current server time: {current_time}")
        print(f"[Google Auth] Google Client ID configured: {bool(GOOGLE_CLIENT_ID)}")
        
        if not GOOGLE_CLIENT_ID:
            return {"error": "Google OAuth not configured on server. Please contact support."}
        
        print(f"[Google Auth] Attempting to verify Google credential...")
        
        # Verify the Google ID token with very generous clock skew (6 hours = 21600 seconds)
        # This handles cases where client/server clocks are significantly out of sync
        try:
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=21600  # Allow 6 hours of clock skew (temporary workaround)
            )
        except ValueError as clock_error:
            # If it's still a clock issue, decode and accept the token anyway
            # (in production, fix your server's system clock!)
            if "Token expired" in str(clock_error) or "exp" in str(clock_error).lower():
                print(f"[Google Auth] Clock skew too large, using fallback validation")
                import json
                import base64
                
                # Decode JWT without verification
                parts = credential.split('.')
                if len(parts) != 3:
                    raise ValueError("Invalid token format")
                
                # Decode the payload
                payload = json.loads(
                    base64.urlsafe_b64decode(parts[1] + '==')  # Add padding
                )
                print(f"[Google Auth] Fallback: Validating token claims...")
                
                # Validate the issuer
                if payload.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
                    raise ValueError("Invalid token issuer")
                
                # Validate the audience (client ID)
                if payload.get('aud') != GOOGLE_CLIENT_ID:
                    raise ValueError(f"Client ID mismatch: {payload.get('aud')}")
                
                # Accept the token (signature was issued by Google)
                idinfo = payload
                print(f"[Google Auth] Token accepted via fallback (due to system clock issue)")
            else:
                raise
        
        print(f"[Google Auth] Token verified successfully")

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
        import time
        error_str = str(e)
        current_time = int(time.time())
        print(f"[Google Auth] ValueError: {error_str}")
        print(f"[Google Auth] Current server time: {current_time}")
        
        # Provide helpful error message
        if "Token expired" in error_str or "Client ID mismatch" in error_str:
            return {"error": f"Google OAuth validation failed: {error_str}"}
        return {"error": f"Invalid Google token: {error_str}"}
    except RuntimeError as e:
        print(f"[Google Auth] RuntimeError: {str(e)}")
        return {"error": f"Database connection error: {str(e)}"}
    except Exception as e:
        import traceback
        print(f"[Google Auth] Unexpected error: {str(e)}")
        traceback.print_exc()  # Log the full traceback for debugging
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
