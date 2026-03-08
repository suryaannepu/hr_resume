import requests

# Test if the API handles a JSON answer correctly.
# First, create a dummy token and user to get a session
# We can just skip to calling Groq directly with the exact same evaluate_answer format
from voice_interview_handler import evaluate_answer, generate_question

session_id = str("69adbe18fb6a781aa726cbe3") # use the one we found
print("Testing evaluation...")
try:
    eval_res = evaluate_answer(session_id, "Hi there, tell me about yourself", "I am a Data Scientist with 5 years experience")
    print("Evaluation successful:", eval_res)
except Exception as e:
    print("Evaluation failed:", e)

# Test generate_question
print("\nTesting generate_question...")
try:
    gen_res = generate_question(session_id)
    print("Generate successful:", gen_res)
except Exception as e:
    print("Generate failed:", e)
