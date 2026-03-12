import os
import cv2
import numpy as np
import base64
import torch
from ultralytics import YOLO
import time
from datetime import datetime

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
            
        # Updated to use YOLOv11 mobile phone model (trained on mobile phone detection)
        try:
            self.phone_model = YOLO(r"c:\Users\acer\Desktop\RESUME_AI\backend\yolomodels\yolomobile11x.pt")
            print("✓ YOLOv11 Mobile Phone Detection model loaded successfully")
        except Exception as e:
            print(f"Failed to load YOLOv11 Mobile Phone model. Detail: {e}")
            # Fallback to generic model if custom model not found
            try:
                self.phone_model = YOLO(r"c:\Users\acer\Desktop\RESUME_AI\backend\yolomodels\yolov8m.pt")
                print("⚠ Fallback to YOLOv8m model")
            except Exception as e2:
                print(f"Failed to load fallback model. Detail: {e2}")
                self.phone_model = None

        print("Models loaded successfully.")
        
        # Tracking state
        self.last_face_seen = time.time()
        self.active_flags = []
        self.consecutive_phone_frames = 0
        self.phone_detection_history = []  # Store recent phone detections
        self.cheating_frame = None  # Store the frame where cheating was detected
        self.cheating_boxes = []  # Store detection boxes for the cheated frame
        self.phone_frame_buffer = {}  # Buffer to store frames with phone detections
    
    def process_frame(self, base64_image):
        """Processes a base64 encoded jpeg frame and returns detections and cheating flags"""
        results = {
            "boxes": [],
            "flags": [],
            "person_count": 0,
            "phone_count": 0,
            "cheated_frame": None,  # Will contain base64 of frame with phone detection
            "cheated_boxes": []  # Boxes drawn on the cheated frame
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
            # inference with lower confidence for better detection
            fp_results = self.face_person_model(frame, verbose=False, imgsz=640, conf=0.30)[0]
            
            for box in fp_results.boxes:
                # get class id
                cls_id = int(box.cls[0].item())
                # get label name
                label = self.face_person_model.names[cls_id]
                
                # coordinates
                x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
                conf = float(box.conf[0].item())
                
                if conf > 0.3:  # Much lower threshold for detection
                    results["boxes"].append({
                        "label": label.capitalize(),
                        "confidence": conf,
                        "x": x1, "y": y1, "w": x2 - x1, "h": y2 - y1
                    })
                    
                    lbl = label.lower()
                    if "person" in lbl:
                        persons += 1
                    if "face" in lbl or "head" in lbl:
                        face_detected = True

        # Run Phone Detection - AGGRESSIVE DETECTION MODE
        phones = 0
        phone_boxes = []
        
        if self.phone_model:
            # AGGRESSIVE phone detection: very low confidence threshold
            # conf=0.30: accept even weak detections from the model
            p_results = self.phone_model(frame, verbose=False, imgsz=640, conf=0.30)[0]
            
            print(f"📱 Phone detection raw results: {len(p_results.boxes)} boxes found")
            
            for box in p_results.boxes:
                x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
                conf = float(box.conf[0].item())
                
                frame_h, frame_w = frame.shape[:2]
                frame_area = frame_w * frame_h
                box_w = x2 - x1
                box_h = y2 - y1
                box_area = box_w * box_h
                
                # VERY RELAXED size validation (0.1% to 50% of frame)
                # Phones can appear anywhere from very small to quite large
                if 0.001 * frame_area <= box_area <= 0.50 * frame_area:
                    # Relaxed aspect ratio: accept portrait (0.3-0.7) AND landscape (1.2-3)
                    if box_h > 0:
                        ratio = box_w / box_h
                        # Accept both vertical phones (0.3-0.7) and horizontal (1.2-3)
                        if (0.3 <= ratio <= 0.7) or (1.2 <= ratio <= 3.0):
                            phone_box = {
                                "label": "Phone",
                                "confidence": conf,
                                "x": x1, "y": y1, "w": box_w, "h": box_h
                            }
                            results["boxes"].append(phone_box)
                            phone_boxes.append((x1, y1, x2, y2, conf))
                            phones += 1
                            print(f"  ✓ Phone detected: conf={conf:.2f}, ratio={ratio:.2f}, size={box_area/frame_area*100:.1f}%")

        results["person_count"] = persons
        results["phone_count"] = phones
        
        # Track consecutive phone frames
        if phones > 0:
            self.consecutive_phone_frames += 1
            self.phone_detection_history.append({
                "timestamp": datetime.now().isoformat(),
                "confidence": max([box[4] for box in phone_boxes]) if phone_boxes else 0,
                "count": phones
            })
            print(f"🔄 Phone frames: {self.consecutive_phone_frames} consecutive")
            # Keep last 100 detections
            if len(self.phone_detection_history) > 100:
                self.phone_detection_history.pop(0)
        else:
            if self.consecutive_phone_frames > 0:
                print(f"❌ Phone detection lost (was {self.consecutive_phone_frames} frames)")
            self.consecutive_phone_frames = 0

        # --- Rule Engine ---
        flags = []
        
        # 1. Multiple persons - IMMEDIATE termination
        if persons > 1:
            flags.append("Multiple persons detected")
            print(f"🚨 VIOLATION: {persons} persons detected")
            # Capture evidence immediately
            if persons > 0:
                self.cheating_frame = frame.copy()
                results["cheated_frame"] = self._create_annotated_frame_b64(frame, phone_boxes)
            
        # 2. Phone detected in at least 1 consecutive frame (AGGRESSIVE)
        if self.consecutive_phone_frames >= 1:
            flags.append("Mobile phone detected")
            print(f"🚨 VIOLATION: Phone detected ({self.consecutive_phone_frames} frames)")
            
            # Capture the frame with phone detection
            if phones > 0:
                self.cheating_frame = frame.copy()
                self.cheating_boxes = phone_boxes
                # Convert frame with detection boxes to base64
                results["cheated_frame"] = self._create_annotated_frame_b64(frame, phone_boxes)
                results["cheated_boxes"] = [{
                    "x": box[0], "y": box[1], 
                    "w": box[2] - box[0], "h": box[3] - box[1],
                    "confidence": box[4]
                } for box in phone_boxes]
            
        # 3. Face absence
        if face_detected:
            self.last_face_seen = current_time
        elif (current_time - self.last_face_seen) > 3.0:
            flags.append("Candidate left screen")
            
        results["flags"] = flags
        return results
    
    def _create_annotated_frame_b64(self, frame, phone_boxes):
        """Creates a base64 encoded frame with phone detection boxes drawn"""
        try:
            frame_copy = frame.copy()
            for x1, y1, x2, y2, conf in phone_boxes:
                # Draw thick red box for phone detection
                cv2.rectangle(frame_copy, (x1, y1), (x2, y2), (0, 0, 255), 5)
                
                # Draw filled rectangle for label background
                label_text = f"PHONE {conf*100:.0f}%"
                font_scale = 1.0
                thickness = 2
                font = cv2.FONT_HERSHEY_BOLD
                
                text_size = cv2.getTextSize(label_text, font, font_scale, thickness)[0]
                label_x = x1
                label_y = max(y1 - 10, text_size[1] + 5)
                
                # Draw red background for text
                cv2.rectangle(frame_copy, 
                             (label_x, label_y - text_size[1] - 5),
                             (label_x + text_size[0] + 5, label_y + 5),
                             (0, 0, 255), -1)
                
                # Draw white text
                cv2.putText(frame_copy, label_text, (label_x + 3, label_y - 3), 
                           font, font_scale, (255, 255, 255), thickness)
            
            # Encode to base64 with maximum quality
            _, buffer = cv2.imencode('.jpg', frame_copy, [cv2.IMWRITE_JPEG_QUALITY, 95])
            frame_b64 = base64.b64encode(buffer).decode('utf-8')
            print(f"✓ Annotated frame created: {len(frame_b64)} bytes")
            return frame_b64
        except Exception as e:
            print(f"Error creating annotated frame: {e}")
            return None

    def get_cheating_evidence(self):
        """Returns evidence of cheating if available"""
        if self.cheating_frame is not None and self.cheating_boxes:
            return {
                "frame_b64": self._create_annotated_frame_b64(self.cheating_frame, self.cheating_boxes),
                "boxes": self.cheating_boxes,
                "history": self.phone_detection_history[-10:] if self.phone_detection_history else []
            }
        return None
    
    def reset_detection(self):
        """Reset the detector state for a new interview"""
        self.last_face_seen = time.time()
        self.active_flags = []
        self.consecutive_phone_frames = 0
        self.phone_detection_history = []
        self.cheating_frame = None
        self.cheating_boxes = []
        self.phone_frame_buffer = {}
        print("✓ Cheat detector reset for new interview")
    
    def get_detection_status(self):
        """Get current detection status for debugging"""
        return {
            "consecutive_phone_frames": self.consecutive_phone_frames,
            "total_detections": len(self.phone_detection_history),
            "last_detection": self.phone_detection_history[-1] if self.phone_detection_history else None,
            "cheating_frame_captured": self.cheating_frame is not None,
            "models_loaded": {
                "face_person": self.face_person_model is not None,
                "phone": self.phone_model is not None
            }
        }


# Singleton instance for the routes to import
detector_instance = None

def get_detector():
    global detector_instance
    if detector_instance is None:
        detector_instance = CheatingDetector()
    return detector_instance
