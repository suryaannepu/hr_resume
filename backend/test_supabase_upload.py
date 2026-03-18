import os
from dotenv import load_dotenv

load_dotenv()

from supabase import create_client, Client

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_ANON_KEY")

if not url or not key:
    print("Missing credentials")
    exit(1)

supabase = create_client(url, key)

try:
    print("Testing upload to bucket resumes...")
    res = supabase.storage.from_("resumes").upload(
        file=b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\n",
        path="test_candidate/test_file.pdf",
        file_options={"content-type": "application/pdf"}
    )
    print("Upload Success! File created.")
except Exception as e:
    import traceback
    traceback.print_exc()
    print("Upload Error:", type(e).__name__, str(e))
