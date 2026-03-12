"""Cloudinary file upload handler"""
import cloudinary
import cloudinary.uploader
import os
from datetime import datetime

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
        # Create a unique public_id for the file
        public_id = f"resumes/{candidate_id}/{datetime.now().timestamp()}_{filename}"
        
        result = cloudinary.uploader.upload(
            file_path,
            public_id=public_id,
            resource_type="auto",
            folder="resumes",
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
        # Create a unique public_id
        public_id = f"resumes/{candidate_id}/{datetime.now().timestamp()}_{filename}"
        
        result = cloudinary.uploader.upload(
            f"data:application/pdf;base64,{base64_data}",
            public_id=public_id,
            resource_type="auto",
            folder="resumes",
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

def delete_resume_from_cloudinary(resource_id: str) -> bool:
    """Delete resume from Cloudinary"""
    try:
        cloudinary.uploader.destroy(resource_id)
        return True
    except Exception as e:
        print(f"Error deleting from Cloudinary: {e}")
        return False
