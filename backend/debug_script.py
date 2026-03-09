import requests
import json

base_url = "http://localhost:5000/api"

def test_routes():
    # 1. Login to get token for candidate and recruiter
    # Need existing users or register one
    reg_cand = requests.post(f"{base_url}/auth/register", json={
        "email": "testcand@debug.com",
        "password": "pass",
        "name": "Test Candidate",
        "role": "candidate"
    })
    
    reg_rec = requests.post(f"{base_url}/auth/register", json={
        "email": "testrec@debug.com",
        "password": "pass",
        "name": "Test Recruiter",
        "role": "recruiter",
        "company_name": "Debug Inc"
    })

    log_cand = requests.post(f"{base_url}/auth/login", json={
        "email": "testcand@debug.com",
        "password": "pass"
    }).json()
    
    log_rec = requests.post(f"{base_url}/auth/login", json={
        "email": "testrec@debug.com",
        "password": "pass"
    }).json()

    print("Cand Login:", log_cand)
    print("Rec Login:", log_rec)
    
    if "token" not in log_cand or "token" not in log_rec:
        return
        
    cand_token = log_cand["token"]
    rec_token = log_rec["token"]

    # 2. Create Job as recruiter
    job_res = requests.post(f"{base_url}/jobs/create", headers={"Authorization": f"Bearer {rec_token}"}, json={
        "job_title": "Software Engineer",
        "description": "Must know Python.",
        "required_skills": "Python, SQL",
        "company_name": "Debug Inc"
    }).json()
    print("Job Creation:", job_res)
    job_id = job_res.get("job_id")

    # 3. Apply as candidate
    apply_res = requests.post(f"{base_url}/applications/apply", headers={"Authorization": f"Bearer {cand_token}"}, json={
        "job_id": job_id,
        "resume_base64": "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAwALJMLY0E0oYQ0qAAAgD8LwWECmVuZHN0cmVhbQplbmRvYmoKCjMgMCBvYmoKMjgKZW5kb2JqCgo1IDAgb2JqCjw8L0xlbmd0aCA2IDAgUi9GaWx0ZXIvRmxhdGVEZWNvZGU+PgpzdHJlYW0KeJwr5ypUMFAwAFLMDUz0k4vydXMVgCwgBgB3LQU3CmVuZHN0cmVhbQplbmRvYmoKCjYgMCBvYmoKMjYKZW5kb2JqCgo3IDAgb2JqCjw8L1R5cGUvUGFnZS9NZWRpYUJveFswIDAgNTk1IDg0Ml0vUmVzb3VyY2VzPDwvRm9udDw8L0YxIDEgMCBSPj4+Pi9Db250ZW50cyA1IDAgUi9QYXJlbnQgNCAwIFI+PgplbmRvYmoKCjEgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj4KZW5kb2JqCgo0IDAgb2JqCjw8L1R5cGUvUGFnZXMvQ291bnQgMS9LaWRzWzcgMCBSXT4+CmVuZG9iagoKOCAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgNCAwIFI+PgplbmRvYmoKCjkgMCBvYmoKPDwvUHJvZHVjZXIoUHlQREYyKTw+CmVuZG9iagoKeHJlZgowIDEwCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDI1OCAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwOTUgMDAwMDAgbiAKMDAwMDAwMDMzNiAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAxOTQgMDAwMDAgbiAKMDAwMDAwMDIxNiAwMDAwMCBuIAowMDAwMDAwMzkzIDAwMDAwIG4gCjAwMDAwMDA0NDIgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDEwL1Jvb3QgOCAwIFIvSW5mbyA5IDAgUj4+CnN0YXJ0eHJlZgo0ODAKJSVFT0YK",
        "resume_filename": "test.pdf"
    })
    print("Apply:", apply_res.status_code, apply_res.text)

    # 4. Trigger AI Rank Shortlist
    rank_res = requests.post(f"{base_url}/recruiter/job/{job_id}/ai-rank", headers={"Authorization": f"Bearer {rec_token}"})
    print("AI Rank:", rank_res.status_code, rank_res.text)

    # 5. Trigger AI Insights
    insights_res = requests.get(f"{base_url}/recruiter/job/{job_id}/ai-insights", headers={"Authorization": f"Bearer {rec_token}"})
    print("AI Insights:", insights_res.status_code, insights_res.text)

if __name__ == '__main__':
    test_routes()
