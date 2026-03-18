import os
import base64
from datetime import datetime
from supabase import create_client, Client

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_ANON_KEY')

supabase = None
if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)

def upload_resume_from_base64(base64_data: str, candidate_id: str, filename: str) -> dict:
    """
    Upload resume from base64 data to Supabase
    """
    try:
        if not supabase:
            raise Exception("Supabase credentials not found in environment variables")
            
        public_id = f"{datetime.now().timestamp()}_{filename}"
        # Structured folder: {candidate_id}/{filename} inside the 'resumes' bucket
        file_path = f"{candidate_id}/{public_id}"
        
        # Clean base64 string if it contains prefix
        clean_b64 = base64_data.split(',')[1] if ',' in base64_data else base64_data
        file_bytes = base64.b64decode(clean_b64)
        
        # Upload using the Supabase SDK
        # We assume the bucket is named "resumes" and it already exists with Public permissions
        supabase.storage.from_("resumes").upload(
            file=file_bytes,
            path=file_path,
            file_options={"content-type": "application/pdf"}
        )
        
        public_url = supabase.storage.from_("resumes").get_public_url(file_path)
        
        return {
            "success": True,
            "public_url": public_url,
            "resource_id": file_path,
            "file_size": len(file_bytes),
            "upload_timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }
