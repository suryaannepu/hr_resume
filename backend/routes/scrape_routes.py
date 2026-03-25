"""Career Page Scraper routes — uses Selenium + BeautifulSoup to extract jobs from public career pages."""
import re
import time
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from auth.auth_handler import verify_token
from core.config import GROQ_API_KEY, LLM_MODEL
from groq import Groq
import json

scrape_bp = Blueprint('scrape', __name__)

# ── Auth decorator (same pattern as bulk_upload_routes) ──
def require_auth(f):
    def decorator(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"error": "No token provided"}), 401
        payload = verify_token(token)
        if not payload:
            return jsonify({"error": "Invalid token"}), 401
        return f(payload, *args, **kwargs)
    decorator.__name__ = f.__name__
    return decorator


# ── Reuse normalisation helpers from bulk_upload_routes ──
def _get_bulk_helpers():
    from routes.bulk_upload_routes import (
        process_single_job, normalize_job_type,
        normalize_employment_type, detect_domain
    )
    return process_single_job, normalize_job_type, normalize_employment_type, detect_domain


# ────────────────────────────────────────────────────────────────
# Heuristic extractors
# ────────────────────────────────────────────────────────────────

def _extract_jobs_llm(soup, url):
    """
    Use Groq LLM to parse the unstructured text of the page.
    Returns a list of raw job dicts.
    """
    if not GROQ_API_KEY:
        raise Exception("GROQ_API_KEY is not configured.")

    client = Groq(api_key=GROQ_API_KEY)
    
    # Extract visible text, cleaning up excessive whitespace
    text = soup.body.get_text(separator=' ', strip=True) if soup.body else soup.get_text(separator=' ', strip=True)
    # Truncate text to roughly 20,000 words (fits well within context window and keeps it fast)
    text = ' '.join(text.split()[:20000])

    company_guess = _guess_company(soup, url)

    prompt = f"""You are an expert HR data extractor. I am giving you the raw text scraped from a career page ({url}).
Please extract up to 30 job listings from this text and return them as a JSON array of objects.

For each job, provide these exact keys:
- "job_title": string
- "company_name": string (use "{company_guess}" if not specified)
- "location": string (or empty string if not found)
- "description": string (summarize the role, requirements, and responsibilities. Max 400 words)
- "employment_type": string (e.g. "Full-time", "Part-time", "Internship", "Contract". Default to "Full-time" if unknown)
- "job_type": string (e.g. "Remote", "Hybrid", "Onsite". Default to "Onsite" if unknown)
- "experience_required": string (or empty string)
- "salary_range": string (or empty string)

CRITICAL INSTRUCTIONS:
1. Return ONLY the raw JSON array. Do not wrap in ```json blocks. No conversational text.
2. If no valid jobs are found, return an empty array `[]`.
3. Filter out generic navigational items entirely (e.g., "Search Jobs", "Home"). Only include actual job roles.
4. Ensure the JSON is perfectly well-formed.

Raw Text:
{text}"""

    try:
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": "You output strictly valid JSON arrays without markdown formatting."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=8192,
        )
        
        content = response.choices[0].message.content.strip()
        
        # Clean up markdown if the LLM hallucinated it despite instructions
        if content.startswith('```json'):
            content = content[7:]
        if content.startswith('```'):
            content = content[3:]
        if content.endswith('```'):
            content = content[:-3]
            
        jobs = json.loads(content.strip())
        
        if not isinstance(jobs, list):
            jobs = [jobs] if isinstance(jobs, dict) and jobs else []
            
        # Add source URL to all
        valid_jobs = []
        for j in jobs:
            if not isinstance(j, dict) or not j.get('job_title'):
                continue
            j['source_url'] = url
            # Clean up job title just in case
            title = j['job_title']
            for btn in [' Save', ' expand_more']:
                if title.endswith(btn):
                    title = title[:-len(btn)]
            j['job_title'] = title
            valid_jobs.append(j)
            
        return valid_jobs
    except Exception as e:
        print(f"LLM Parsing error: {e}")
        return []


def _guess_company(soup, url):
    """Try to infer company name from meta tags or the URL domain."""
    og = soup.find('meta', property='og:site_name')
    if og and og.get('content'):
        return og['content'].strip()
    # from domain e.g. careers.google.com → Google
    domain = re.sub(r'^www\.', '', url.split('/')[2])
    parts = domain.split('.')
    # strip common subdomains
    for skip in ('careers', 'jobs', 'boards', 'apply', 'recruiter'):
        if parts[0].lower() == skip:
            parts = parts[1:]
    return parts[0].title() if parts else ''


# ────────────────────────────────────────────────────────────────
# Selenium helper
# ────────────────────────────────────────────────────────────────

def _get_driver():
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
    try:
        from webdriver_manager.chrome import ChromeDriverManager
        service = Service(ChromeDriverManager().install())
    except Exception:
        service = Service()  # fall back to system chromedriver

    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--window-size=1280,900')
    options.add_argument('--log-level=3')
    options.add_argument(
        'user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )
    return webdriver.Chrome(service=service, options=options)


def _scrape_url(url):
    """Scrape a single URL, return (raw_jobs_list, warning_or_None)."""
    from bs4 import BeautifulSoup

    driver = None
    try:
        driver = _get_driver()
        driver.set_page_load_timeout(30)
        driver.get(url)
        time.sleep(2)  # initial wait to render JS

        # Scroll down to load dynamic content
        last_height = driver.execute_script("return document.body.scrollHeight")
        for _ in range(3):
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(1.0)
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height

        html = driver.page_source
        soup = BeautifulSoup(html, 'lxml')

        # Remove noise
        for tag in soup(['script', 'style', 'noscript', 'header', 'footer', 'nav', 'svg', 'img', 'iframe']):
            tag.decompose()

        raw_jobs = _extract_jobs_llm(soup, url)
        return raw_jobs, None
    except Exception as e:
        return [], f"Failed to scrape {url}: {str(e)}"
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass


# ────────────────────────────────────────────────────────────────
# Route
# ────────────────────────────────────────────────────────────────

@scrape_bp.route('/extract', methods=['POST'])
@require_auth
def extract_jobs(payload):
    """
    POST /api/scrape/extract
    Body: { "urls": ["https://..."] }
    Returns same shape as /api/bulk-upload/parse
    """
    try:
        data = request.get_json()
        if not data or not data.get('urls'):
            return jsonify({"error": "No URLs provided"}), 400

        urls = [u.strip() for u in data['urls'] if u.strip()]
        if not urls:
            return jsonify({"error": "No valid URLs provided"}), 400
        if len(urls) > 10:
            return jsonify({"error": "Maximum 10 URLs per request"}), 400

        # Get recruiter info for defaults
        from database.connection import get_users_collection
        from bson.objectid import ObjectId
        users = get_users_collection()
        user = users.find_one({"_id": ObjectId(payload['user_id'])})
        company_name_default = user.get('company_name', '') if user else ''

        process_single_job, normalize_job_type, normalize_employment_type, detect_domain = _get_bulk_helpers()

        # Default deadline: 60 days from today
        default_deadline = (datetime.utcnow() + timedelta(days=60)).strftime('%Y-%m-%d')

        processed_jobs = []
        all_warnings = []
        duplicates = []

        for url in urls:
            raw_jobs, warning = _scrape_url(url)
            if warning:
                all_warnings.append(warning)
            if not raw_jobs:
                all_warnings.append(f"No jobs found at: {url}")
                continue

            for i, raw_job in enumerate(raw_jobs):
                # Ensure deadline
                if not raw_job.get('deadline'):
                    raw_job['deadline'] = default_deadline

                processed = process_single_job(raw_job, payload['user_id'], company_name_default)
                processed['_index'] = len(processed_jobs)
                processed['_is_duplicate'] = False
                processed['source'] = 'scraped'
                processed['source_url'] = raw_job.get('source_url', url)
                processed_jobs.append(processed)

        return jsonify({
            "success": True,
            "total_parsed": len(processed_jobs),
            "total_raw": len(urls),
            "jobs": processed_jobs,
            "warnings": all_warnings,
            "duplicates": duplicates,
        }), 200

    except Exception as e:
        return jsonify({"error": f"Scraping failed: {str(e)}"}), 500
