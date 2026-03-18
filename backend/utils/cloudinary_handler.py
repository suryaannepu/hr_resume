"""Cloudinary file upload handler"""
import os
import tempfile
import base64
from datetime import datetime

import cloudinary
import cloudinary.uploader

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

def upload_resume_to_cloudinary(file_path: str, candidate_id: str, filename: str) -> dict:
    """
    Upload resume to Cloudinary
    Returns: dict with public_url, secure_url, resource_id
    """
    try:
        public_id = f"{datetime.now().timestamp()}_{filename}"
        folder = f"resumes/{candidate_id}"
        
        result = cloudinary.uploader.upload(
            file_path,
            public_id=public_id,
            resource_type="raw",
            folder=folder,
            overwrite=False
        )
        
        return {
            "success": True,
            "public_url": result.get("secure_url"),
            "resource_id": result.get("public_id"),
            "file_size": result.get("bytes"),
            "upload_timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def upload_resume_from_base64(base64_data: str, candidate_id: str, filename: str) -> dict:
    """
    Upload resume from base64 data to Cloudinary
    """
    try:
        public_id = f"{datetime.now().timestamp()}_{filename}"
        folder = f"resumes/{candidate_id}"
        
        # Clean base64 string if it contains prefix
        clean_b64 = base64_data.split(',')[1] if ',' in base64_data else base64_data
        file_bytes = base64.b64decode(clean_b64)
        
        # Cloudinary python SDK rejects data URIs for resource_type="raw". 
        # We must write to a temporary file locally before uploading.
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
            temp_pdf.write(file_bytes)
            temp_pdf_path = temp_pdf.name
            
        try:
            result = cloudinary.uploader.upload(
                temp_pdf_path,
                public_id=public_id,
                resource_type="raw",
                folder=folder,
                overwrite=False
            )
        finally:
            if os.path.exists(temp_pdf_path):
                os.remove(temp_pdf_path)
        
        return {
            "success": True,
            "public_url": result.get("secure_url"),
            "resource_id": result.get("public_id"),
            "file_size": result.get("bytes"),
            "upload_timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def delete_resume_from_cloudinary(resource_id: str) -> bool:
    """Delete resume from Cloudinary"""
    try:
        cloudinary.uploader.destroy(resource_id)
        return True
    except Exception as e:
        print(f"Error deleting from Cloudinary: {e}")
        return False


def upload_profile_photo(base64_data: str, user_id: str) -> dict:
    """Upload profile photo from base64 data to Cloudinary"""
    try:
        public_id = f"profile_photos/{user_id}/{datetime.now().timestamp()}"

        result = cloudinary.uploader.upload(
            f"data:image/jpeg;base64,{base64_data}",
            public_id=public_id,
            resource_type="image",
            folder="profile_photos",
            overwrite=True,
            transformation=[
                {"width": 256, "height": 256, "crop": "fill", "gravity": "face"}
            ]
        )

        return {
            "success": True,
            "photo_url": result.get("secure_url"),
            "resource_id": result.get("public_id"),
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

