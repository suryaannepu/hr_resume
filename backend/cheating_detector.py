import os
import cv2
import numpy as np
import base64
import torch
from ultralytics import YOLO
import time

# Prevent YOLO CPU inference from starving the OS/Browser rendering threads
torch.set_num_threads(2)

class CheatingDetector:
    def __init__(self):
        print("Loading YOLO models...")
        # Ultralytics will automatically download from HF hub if the prefix is right,
        # otherwise we can use the direct hub names
        
        # Load the models
        # Provided by user locally
        try:
            self.face_person_model = YOLO(r"c:\Users\acer\Desktop\RESUME_AI\backend\yolomodels\yolov8x_person_face.pt")
        except Exception as e:
            print(f"Failed to load Face-Person model. Detail: {e}")
            self.face_person_model = None
            
        try:
            self.phone_model = YOLO(r"c:\Users\acer\Desktop\RESUME_AI\backend\yolomodels\yolov8m.pt")
        except Exception as e:
            print(f"Failed to load Mobile Phone model. Detail: {e}")
            self.phone_model = None

        print("Models loaded successfully.")
        
        # Tracking state
        self.last_face_seen = time.time()
        self.active_flags = []
        self.consecutive_phone_frames = 0
    
    def process_frame(self, base64_image):
        """Processes a base64 encoded jpeg frame and returns detections and cheating flags"""
        results = {
            "boxes": [],
            "flags": [],
            "person_count": 0,
            "phone_count": 0
        }
        
        if not self.face_person_model and not self.phone_model:
            return results
            
        # Decode base64 to numpy array for OpenCV
        try:
            # Strip data URI prefix if present
            if ',' in base64_image:
                base64_image = base64_image.split(',')[1]
                
            img_data = base64.b64decode(base64_image)
            nparr = np.frombuffer(img_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if frame is None:
                return results
                
        except Exception as e:
            print(f"Error decoding image: {e}")
            return results

        # Run Face & Person Detection
        current_time = time.time()
        face_detected = False
        persons = 0
        
        if self.face_person_model:
            # inference (imgsz=640 improves accuracy for phones and small faces vs 320)
            fp_results = self.face_person_model(frame, verbose=False, imgsz=640)[0]
            
            for box in fp_results.boxes:
                # get class id
                cls_id = int(box.cls[0].item())
                # get label name
                label = self.face_person_model.names[cls_id]
                
                # coordinates
                x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
                conf = float(box.conf[0].item())
                
                if conf > 0.45: # Raised threshold to 0.45 to prevent hallucinations
                    results["boxes"].append({
                        "label": label.capitalize(),
                        "confidence": conf,
                        "x": x1, "y": y1, "w": x2 - x1, "h": y2 - y1
                    })
                    
                    lbl = label.lower()
                    if lbl == "person":
                        persons += 1
                    if "face" in lbl or "head" in lbl:
                        face_detected = True

        # Run Phone Detection
        phones = 0
        if self.phone_model:
            # Enforce 0.65 confidence, 0.45 IoU, and class 67 (cell phone) natively
            p_results = self.phone_model(frame, verbose=False, imgsz=640, conf=0.65, iou=0.45, classes=[67])[0]
            for box in p_results.boxes:
                # since we restrict to classes=[67], we don't need to check the label strings.
                x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
                conf = float(box.conf[0].item())
                
                frame_h, frame_w = frame.shape[:2]
                frame_area = frame_w * frame_h
                box_w = x2 - x1
                box_h = y2 - y1
                box_area = box_w * box_h
                
                # Size validation (1% to 25% of frame)
                if 0.01 * frame_area <= box_area <= 0.25 * frame_area:
                    if box_h > 0:
                        ratio = box_w / box_h
                        # Aspect ratio validation
                        if 0.4 <= ratio <= 0.8:
                            results["boxes"].append({
                                "label": "Phone",
                                "confidence": conf,
                                "x": x1, "y": y1, "w": box_w, "h": box_h
                            })
                            phones += 1

        results["person_count"] = persons
        results["phone_count"] = phones
        
        # Track consecutive phone frames
        if phones > 0:
            self.consecutive_phone_frames += 1
        else:
            self.consecutive_phone_frames = 0

        # --- Rule Engine ---
        flags = []
        
        # 1. Multiple persons
        if persons > 1:
            flags.append("Multiple persons detected")
            
        # 2. Phone detected in at least 3 consecutive frames
        if self.consecutive_phone_frames >= 3:
            flags.append("Mobile phone detected")
            
        # 3. Face absence
        if face_detected:
            self.last_face_seen = current_time
        elif (current_time - self.last_face_seen) > 3.0:
            flags.append("Candidate left screen")
            
        results["flags"] = flags
        return results

# Singleton instance for the routes to import
detector_instance = None

def get_detector():
    global detector_instance
    if detector_instance is None:
        detector_instance = CheatingDetector()
    return detector_instance
