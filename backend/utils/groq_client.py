import os
import json
import re
import time
from urllib import request, error

def safe_int(value, default=0):
    """Safely convert a value (often from LLM) to an integer, handling percents and non-numeric chars."""
    if value is None:
        return default
    if isinstance(value, (int, float)):
        return int(value)
    
    try:
        # Remove %, commas, and whitespace
        s = str(value).replace('%', '').replace(',', '').strip()
        # Handle cases where LLM might return "Score: 85"
        if ':' in s:
            s = s.split(':')[-1].strip()
        # Find first group of digits
        match = re.search(r'(\d+)', s)
        if match:
            return int(match.group(1))
        return default
    except Exception:
        return default

def call_groq_llm(system_prompt: str, user_prompt: str, model="llama-3.3-70b-versatile", retries=3):
    """
    Directly call the Groq REST API using urllib without any external dependencies 
    like Langchain or CrewAI, returning parsed JSON.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable not set")

    url = "https://api.groq.com/openai/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    data = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.1,
        "response_format": {"type": "json_object"}
    }
    
    req = request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)
    
    for attempt in range(retries):
        try:
            with request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                content = result["choices"][0]["message"]["content"]
                return json.loads(content)
        except error.HTTPError as e:
            err_msg = e.read().decode('utf-8')
            if e.code == 429: # Rate limit
                wait_time = (attempt + 1) * 2
                print(f"⚠️ Groq Rate Limit (429). Retrying in {wait_time}s... (Attempt {attempt+1}/{retries})")
                time.sleep(wait_time)
                continue
            
            print(f"Groq API Error: {err_msg}")
            raise ValueError(f"Groq API call failed: {e.code}")
        except json.JSONDecodeError:
            # If it's the inner JSON fail, sometimes LLM adds markdown blocks
            try:
                # Try to extract JSON from code blocks
                match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
                if match:
                    return json.loads(match.group(1))
            except:
                pass
            print(f"Failed to parse JSON response: {content}")
            return {}
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1)
                continue
            print(f"Unexpected error calling Groq: {str(e)}")
            raise
    return {}
