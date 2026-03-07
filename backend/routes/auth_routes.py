"""Authentication routes"""
from flask import Blueprint, request, jsonify
from auth.auth_handler import register_user, login_user, verify_token, get_user_by_id

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register new user"""
    data = request.get_json()
    
    required = ['email', 'password', 'name', 'role']
    if not all(k in data for k in required):
        return jsonify({"error": "Missing required fields"}), 400
    
    if data['role'] == 'recruiter' and 'company_name' not in data:
        return jsonify({"error": "Company name required for recruiter"}), 400
    
    result = register_user(
        email=data['email'],
        password=data['password'],
        name=data['name'],
        role=data['role'],
        company_name=data.get('company_name')
    )
    
    if 'error' in result:
        return jsonify(result), 400
    
    return jsonify(result), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    data = request.get_json()
    
    if 'email' not in data or 'password' not in data:
        return jsonify({"error": "Email and password required"}), 400
    
    result = login_user(data['email'], data['password'])
    
    if 'error' in result:
        return jsonify(result), 401
    
    return jsonify(result), 200

@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get current user profile"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if not token:
        return jsonify({"error": "No token provided"}), 401
    
    payload = verify_token(token)
    if not payload:
        return jsonify({"error": "Invalid token"}), 401
    
    user = get_user_by_id(payload['user_id'])
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify(user), 200

@auth_bp.route('/verify', methods=['POST'])
def verify():
    """Verify token"""
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({"error": "No token provided"}), 401
    
    payload = verify_token(token)
    if not payload:
        return jsonify({"error": "Invalid token"}), 401
    
    return jsonify({"valid": True, "user_id": payload['user_id']}), 200
