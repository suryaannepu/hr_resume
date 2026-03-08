import os
import json
import time
from dotenv import load_dotenv
import sys

# Add the current directory to path to import utils
sys.path.append(os.getcwd())

from utils.groq_client import call_groq_llm

def test_rate_limit():
    load_dotenv()
    print("Testing Groq Rate Limits (10 consecutive calls)...")
    
    for i in range(10):
        try:
            start = time.time()
            system_prompt = "You are a helpful assistant."
            user_prompt = f"Call number {i+1}. Return JSON: {{'status': 'ok'}}"
            result = call_groq_llm(system_prompt, user_prompt)
            duration = time.time() - start
            print(f"Call {i+1}: Success ({duration:.2f}s)")
        except Exception as e:
            print(f"Call {i+1}: Failed! {str(e)}")
            # If it fails, wait a bit and try one more to see if it recovers
            time.sleep(2)

if __name__ == "__main__":
    test_rate_limit()
