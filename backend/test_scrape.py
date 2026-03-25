import sys
import os

# add current dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from routes.scrape_routes import _scrape_url

url = "https://www.google.com/about/careers/applications/jobs/results?location=India"
print(f"Scraping {url}...")
jobs, warning = _scrape_url(url)

if warning:
    print("Warning:", warning)

print(f"Found {len(jobs)} jobs.")
for i, j in enumerate(jobs[:3]): # print first 3
    print(f"\n--- Job {i+1} ---")
    print(f"Title: {j['job_title']}")
    print(f"Location: {j['location']}")
    print(f"Desc: {j['description'][:150]}...")
