"""Audit logging for cheating detection events"""
import logging
from datetime import datetime
from database.connection import get_db
from bson.objectid import ObjectId

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('cheating_detector')

class CheatingAuditLog:
    """Logs and tracks cheating detection events"""
    
    @staticmethod
    def log_detection(application_id: str, detection_type: str, details: dict):
        """Log a cheating detection event"""
        try:
            db = get_db()
            if db is None:
                logger.warning(f"Database not available for audit log: {application_id}")
                return
            
            audit_entry = {
                "timestamp": datetime.utcnow(),
                "application_id": application_id,
                "detection_type": detection_type,  # "phone", "multiple_persons", "tab_switch", "left_screen"
                "confidence": details.get("confidence", 0),
                "flags": details.get("flags", []),
                "detection_count": details.get("detection_count", 1),
                "consecutive_frames": details.get("consecutive_frames", 0),
                "additional_info": details.get("additional_info", {})
            }
            
            db["cheating_audit_logs"].insert_one(audit_entry)
            logger.info(f"🚨 AUDIT: Cheating detected - {detection_type} in application {application_id}")
            
            return str(audit_entry.get("_id"))
        except Exception as e:
            logger.error(f"Error logging detection: {e}")
            return None
    
    @staticmethod
    def get_application_audit_history(application_id: str):
        """Retrieve all cheating detection events for an application"""
        try:
            db = get_db()
            if db is None:
                return []
            
            logs = list(db["cheating_audit_logs"].find(
                {"application_id": application_id}
            ).sort("timestamp", -1).limit(50))
            
            # Convert ObjectIds to strings
            for log in logs:
                log["_id"] = str(log["_id"])
            
            return logs
        except Exception as e:
            logger.error(f"Error retrieving audit history: {e}")
            return []
    
    @staticmethod
    def get_statistics():
        """Get overall cheating detection statistics"""
        try:
            db = get_db()
            if db is None:
                return {}
            
            stats = {
                "total_detections": db["cheating_audit_logs"].count_documents({}),
                "by_type": {},
                "recent_24h": db["cheating_audit_logs"].count_documents({
                    "timestamp": {"$gte": datetime.utcnow() - __import__('datetime').timedelta(hours=24)}
                })
            }
            
            # Get breakdown by detection type
            pipeline = [
                {"$group": {"_id": "$detection_type", "count": {"$sum": 1}}}
            ]
            for doc in db["cheating_audit_logs"].aggregate(pipeline):
                stats["by_type"][doc["_id"]] = doc["count"]
            
            return stats
        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            return {}

def log_cheating_detection(app_id, detection_type, confidence=0, flags=None, consecutive=0):
    """Simple wrapper for logging cheating detection"""
    details = {
        "confidence": confidence,
        "flags": flags or [],
        "detection_count": 1,
        "consecutive_frames": consecutive
    }
    return CheatingAuditLog.log_detection(app_id, detection_type, details)
