from database import get_db

db = get_db()
if db is None:
    print("No DB connection")
    exit()

sessions = list(db["voice_interview_sessions"].find().sort("_id", -1).limit(1))
if not sessions:
    print("No sessions found")
else:
    s = sessions[0]
    print(f"Session ID: {s['_id']}")
    print(f"Status: {s['status']}")
    print(f"Role: {s['role']}")
    print(f"Current Q Index: {s['current_question_index']}")
    print(f"Questions: {s.get('questions', [])}")
    print(f"Answers: {s.get('answers', [])}")
    print(f"Scores: {s.get('scores', [])}")
