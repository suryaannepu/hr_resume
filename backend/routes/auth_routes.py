"""Authentication routes"""
from flask import Blueprint, request, jsonify
from auth.auth_handler import google_login_or_register, verify_token, get_user_by_id
from database.connection import get_users_collection
from utils.cloudinary_handler import upload_profile_photo
from bson.objectid import ObjectId

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/google', methods=['POST'])
def google_auth():
    """Handle Google OAuth login/registration"""
    data = request.get_json()

    credential = data.get('credential')
    if not credential:
        return jsonify({"error": "Google credential is required"}), 400

    role = data.get('role')  # Optional: provided when registering
    company_name = data.get('company_name')  # Optional: for recruiters

    result = google_login_or_register(credential, role, company_name)

    if 'error' in result:
        return jsonify(result), 400

    if result.get('needs_role'):
        # New user — frontend should show role selection
        return jsonify(result), 200

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


@auth_bp.route('/profile/photo', methods=['PUT'])
def update_profile_photo():
    """Upload/update profile photo to Cloudinary"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')

    if not token:
        return jsonify({"error": "No token provided"}), 401

    payload = verify_token(token)
    if not payload:
        return jsonify({"error": "Invalid token"}), 401

    data = request.get_json()
    photo_base64 = data.get('photo_base64')

    if not photo_base64:
        return jsonify({"error": "No photo data provided"}), 400

    # Upload to Cloudinary
    result = upload_profile_photo(photo_base64, payload['user_id'])

    if not result.get('success'):
        return jsonify({"error": result.get('error', 'Upload failed')}), 500

    # Update user document in MongoDB
    users = get_users_collection()
    users.update_one(
        {"_id": ObjectId(payload['user_id'])},
        {"$set": {"profile_photo": result['photo_url']}}
    )

    return jsonify({
        "success": True,
        "photo_url": result['photo_url']
    }), 200

@auth_bp.route('/profile/company', methods=['PUT'])
def update_company_name():
    """Update user's company name"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')

    if not token:
        return jsonify({"error": "No token provided"}), 401

    payload = verify_token(token)
    if not payload:
        return jsonify({"error": "Invalid token"}), 401

    data = request.get_json()
    new_company_name = data.get('company_name')

    if not new_company_name:
        return jsonify({"error": "No company name provided"}), 400

    users = get_users_collection()
    users.update_one(
        {"_id": ObjectId(payload['user_id'])},
        {"$set": {"company_name": new_company_name}}
    )

    return jsonify({"success": True, "company_name": new_company_name}), 200


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

