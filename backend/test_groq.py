import os
import json
from dotenv import load_dotenv
import sys

# Add the current directory to path to import utils
sys.path.append(os.getcwd())

from utils.groq_client import call_groq_llm

def test_groq():
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    print(f"Testing Groq API with key: {api_key[:5]}...{api_key[-5:] if api_key else 'NONE'}")
    
    if not api_key:
        print("Error: GROQ_API_KEY not found in .env")
        return

    try:
        system_prompt = "You are a helpful assistant."
        user_prompt = "Return a JSON object with 'status': 'success'"
        result = call_groq_llm(system_prompt, user_prompt)
        print("Groq API Call Successful!")
        print(f"Result: {json.dumps(result, indent=2)}")
    except Exception as e:
        print(f"Groq API Call Failed: {str(e)}")

if __name__ == "__main__":
    test_groq()
