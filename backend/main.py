from flask import Flask, jsonify, request
from flask_cors import CORS
from database import connect_db, close_db, get_db
from config import ALLOWED_ORIGINS, PORT, DEBUG
import os

# Import routes
from routes.auth_routes import auth_bp
from routes.job_routes import jobs_bp
from routes.application_routes import applications_bp
from routes.recruiter_routes import recruiter_bp
from routes.interview_routes import interview_bp
from routes.practice_routes import practice_bp
from routes.voice_interview_routes import voice_interview_bp

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
CORS(app, resources={
    r"/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Initialize database connection at startup (non-blocking)
with app.app_context():
    connect_db(is_startup=True)  # Don't block startup if MongoDB is unavailable

# Database setup - attempt connection before processing requests
@app.before_request
def before_request():
    """Ensure database connection is available before processing requests"""
    db = get_db()
    if db is None:
        # Try once more to reconnect
        db = connect_db()
        if db is None:
            # Only return 503 for API endpoints, not health checks
            if not request.path.startswith('/api/health'):
                return jsonify({"error": "Database temporarily unavailable. Please try again."}), 503

@app.teardown_appcontext
def teardown(error):
    """Clean up after request - but keep connection alive in dev"""
    pass

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
app.register_blueprint(applications_bp, url_prefix='/api/applications')
app.register_blueprint(recruiter_bp, url_prefix='/api/recruiter')
app.register_blueprint(interview_bp, url_prefix='/api/interview')
app.register_blueprint(practice_bp, url_prefix='/api/practice')
app.register_blueprint(voice_interview_bp, url_prefix='/api/voice-interview')

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "message": "Agentic AI Hiring Assistant is running"
    }), 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

# Initialize app context and eager-load YOLO models
with app.app_context():
    from cheating_detector import get_detector
    # Eagerly load the models to avoid a massive lag spike on the first candidate frame
    get_detector()

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Agentic AI Hiring Assistant - Backend Server")
    print("="*60)
    print(f"Starting server on http://localhost:{PORT}")
    print(f"Environment: {'Development' if DEBUG else 'Production'}")
    print(f"CORS Origins: {', '.join(ALLOWED_ORIGINS)}")
    print("="*60 + "\n")
    
    app.run(
        host='0.0.0.0',
        port=PORT,
        debug=DEBUG
    )
