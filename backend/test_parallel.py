import os
import json
import time
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
import sys

# Add the current directory to path to import utils/agents
sys.path.append(os.getcwd())

# Mock agents if needed, but here we want to test the LLM performance
from agents.resume_agent import run_resume_parsing
from agents.jd_agent import run_jd_analysis
from agents.scoring_agent import run_scoring

def test_parallel_pipeline():
    load_dotenv()
    resume_text = "Software Engineer with 5 years experience in Python and React."
    job_description = "Looking for a Python developer with React knowledge."
    
    print("Testing Parallel Pipeline timing...")
    start_total = time.time()
    
    with ThreadPoolExecutor(max_workers=3) as executor:
        print("Level 0: Parsing Resume & JD...")
        f1 = executor.submit(run_resume_parsing, resume_text)
        f2 = executor.submit(run_jd_analysis, job_description)
        
        resume_data = f1.result()
        jd_data = f2.result()
        print(f"Level 0 done in {time.time() - start_total:.2f}s")
        
    print(f"Total time so far: {time.time() - start_total:.2f}s")
    # This is enough to see if parallel works for the first level.
    
if __name__ == "__main__":
    test_parallel_pipeline()
