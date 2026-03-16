import os
import cv2
import numpy as np
import base64
import torch
from ultralytics import YOLO
import time
from datetime import datetime
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# Optimize for faster inference
torch.set_num_threads(1)

# MediaPipe Tasks API aliases
BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

# Hand landmark connections for drawing skeleton
HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),         # Thumb
    (0, 5), (5, 6), (6, 7), (7, 8),         # Index
    (5, 9), (9, 10), (10, 11), (11, 12),    # Middle
    (9, 13), (13, 14), (14, 15), (15, 16),  # Ring
    (13, 17), (0, 17), (17, 18), (18, 19), (19, 20)  # Pinky
]

# Fingertip and MCP (base) landmark indices
FINGER_TIPS = [4, 8, 12, 16, 20]   # Thumb, Index, Middle, Ring, Pinky tips
FINGER_MCPS = [2, 5, 9, 13, 17]    # Corresponding base joints


def _calc_dist(lm1, lm2):
    """Euclidean distance between two normalized landmarks"""
    return np.sqrt((lm1.x - lm2.x)**2 + (lm1.y - lm2.y)**2)


class CheatingDetector:
    def __init__(self):
        print("Loading Monitoring Models...")

        # Device selection
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"🖥️ Using device: {self.device}")

        # ── YOLO: Face & Person Detection ──
        try:
            self.face_person_model = YOLO(
                r"c:\Users\acer\Desktop\RESUME_AI\backend\yolomodels\yolov8x_person_face.pt"
            )
            self.face_person_model.to(self.device)
            print("✓ Face-Person model loaded")
        except Exception as e:
            print(f"❌ Face-Person model failed: {e}")
            self.face_person_model = None

        # ── YOLO: Mobile Phone Detection ──
        try:
            self.phone_model = YOLO(
                r"c:\Users\acer\Desktop\RESUME_AI\backend\yolomodels\best (2).pt"
            )
            self.phone_model.to(self.device)
            print("✓ Phone model loaded")
        except Exception as e:
            print(f"❌ Phone model failed: {e}")
            self.phone_model = None

        print("✅ YOLO models ready.")

        # ── MediaPipe: Hand Landmarker ──
        model_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "resources",
            "hand_landmarker.task"
        )
        options = HandLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=model_path),
            running_mode=VisionRunningMode.IMAGE,
            num_hands=2,
            min_hand_detection_confidence=0.5,
            min_hand_presence_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.hands = HandLandmarker.create_from_options(options)
        print("✓ MediaPipe Hands loaded")

        # ── State ──
        self.last_face_seen = time.time()
        # Hand visibility warning system
        self.hand_visible = True
        self.hand_missing_since = None      # timestamp when hands went missing
        self.hand_warning_active = False     # is a warning currently showing?
        self.hand_warning_count = 0          # total successive warnings given
        self.hand_warning_timer_sec = 10     # seconds before each warning fires

        self.consecutive_phone_frames = 0
        self.phone_detection_history = []
        self.cheating_frame = None
        self.cheating_boxes = []

    # ─────────────────────────────────────────────────────────
    def process_frame(self, base64_image):
        """Process a single base64-encoded JPEG frame."""
        results = {
            "boxes": [],
            "flags": [],
            "person_count": 0,
            "phone_count": 0,
            "cheated_frame": None,
            "cheated_boxes": []
        }

        if not self.face_person_model and not self.phone_model:
            return results

        # ── Decode image ──
        try:
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

        current_time = time.time()
        h, w, _ = frame.shape

        # ═══════════════════════════════════════════════════════
        # 1. PERSON & FACE DETECTION  (yolov8x_person_face)
        # ═══════════════════════════════════════════════════════
        face_detected = False
        persons = 0

        if self.face_person_model:
            fp_results = self.face_person_model(
                frame, verbose=False, imgsz=640, conf=0.45,
                half=(self.device == 'cuda'), device=self.device
            )[0]

            for box in fp_results.boxes:
                cls_id = int(box.cls[0].item())
                label = self.face_person_model.names[cls_id].lower()
                conf = float(box.conf[0].item())
                if conf >= 0.45:
                    if "person" in label:
                        persons += 1
                    if "face" in label or "head" in label:
                        face_detected = True

        # ═══════════════════════════════════════════════════════
        # 2. MEDIAPIPE HAND DETECTION  (finger tips + bend)
        # ═══════════════════════════════════════════════════════
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        hand_results = self.hands.detect(mp_image)

        hands_detected = False
        any_bend_detected = False
        hand_boxes = []

        if hand_results.hand_landmarks:
            hands_detected = True

            for hand_landmarks in hand_results.hand_landmarks:
                # ── Draw all 21 landmark dots (GREEN) ──
                for i, lm in enumerate(hand_landmarks):
                    cx, cy = int(lm.x * w), int(lm.y * h)
                    # Fingertips get bigger, brighter dots
                    if i in FINGER_TIPS:
                        cv2.circle(frame, (cx, cy), 6, (0, 255, 255), -1)  # Yellow
                        cv2.circle(frame, (cx, cy), 8, (0, 255, 255), 1)   # Ring
                    else:
                        cv2.circle(frame, (cx, cy), 3, (0, 255, 0), -1)    # Green

                # ── Draw skeleton connections ──
                for s, e in HAND_CONNECTIONS:
                    pt1 = (int(hand_landmarks[s].x * w), int(hand_landmarks[s].y * h))
                    pt2 = (int(hand_landmarks[e].x * w), int(hand_landmarks[e].y * h))
                    cv2.line(frame, pt1, pt2, (0, 255, 0), 2)

                # ── Bounding box around hand (padded 20%) ──
                xs = [int(lm.x * w) for lm in hand_landmarks]
                ys = [int(lm.y * h) for lm in hand_landmarks]
                x_min, x_max = min(xs), max(xs)
                y_min, y_max = min(ys), max(ys)
                pad_x = int((x_max - x_min) * 0.20)
                pad_y = int((y_max - y_min) * 0.20)
                bx1 = max(0, x_min - pad_x)
                by1 = max(0, y_min - pad_y)
                bx2 = min(w, x_max + pad_x)
                by2 = min(h, y_max + pad_y)
                if bx2 > bx1 and by2 > by1:
                    hand_boxes.append((bx1, by1, bx2, by2))

                # ── Finger bend check  (ANY finger bent → trigger) ──
                wrist = hand_landmarks[0]
                for tip_idx, mcp_idx in zip(FINGER_TIPS, FINGER_MCPS):
                    tip = hand_landmarks[tip_idx]
                    mcp = hand_landmarks[mcp_idx]
                    if _calc_dist(tip, wrist) < _calc_dist(mcp, wrist):
                        any_bend_detected = True
                        break

                # Show bend status label above the hand
                label_y = max(10, y_min - 15)
                if any_bend_detected:
                    cv2.putText(frame, "BEND DETECTED", (x_min, label_y),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                else:
                    cv2.putText(frame, "Hand Tracked", (x_min, label_y),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

        # ═══════════════════════════════════════════════════════
        # 3. PHONE DETECTION  (only when a finger bend is seen)
        # ═══════════════════════════════════════════════════════
        phones = 0
        phone_boxes = []

        if any_bend_detected and self.phone_model and hand_boxes:
            for hx1, hy1, hx2, hy2 in hand_boxes:
                hand_crop = frame[hy1:hy2, hx1:hx2]
                if hand_crop.size == 0:
                    continue

                p_results = self.phone_model(
                    hand_crop, verbose=False, imgsz=640,
                    conf=0.50, iou=0.45,
                    half=(self.device == 'cuda'), device=self.device
                )[0]

                for box in p_results.boxes:
                    zx1, zy1, zx2, zy2 = [int(v) for v in box.xyxy[0].tolist()]
                    # Map back to full frame coordinates
                    x1 = zx1 + hx1
                    y1 = zy1 + hy1
                    x2 = zx2 + hx1
                    y2 = zy2 + hy1
                    conf = float(box.conf[0].item())

                    if conf >= 0.50:
                        bw, bh = x2 - x1, y2 - y1
                        area = bw * bh
                        if 0.001 * (w * h) <= area <= 0.60 * (w * h):
                            phone_boxes.append((x1, y1, x2, y2, conf))
                            phones += 1
                            # Draw phone bounding box on frame
                            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
                            cv2.putText(frame, f"PHONE {conf:.0%}", (x1, y1 - 10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

        # ═══════════════════════════════════════════════════════
        # 4. HAND VISIBILITY WARNING SYSTEM
        #    - Hands disappear → start timer
        #    - Timer expires  → show WARNING, increment count
        #    - Hands return   → cancel the timer/warning
        #    - 2 successive warnings → TERMINATE
        # ═══════════════════════════════════════════════════════
        flags = []

        if hands_detected:
            # Hands are back! Cancel any active timer / warning
            if self.hand_missing_since is not None:
                self.hand_missing_since = None
                self.hand_warning_active = False
        else:
            # Hands missing
            if self.hand_missing_since is None:
                self.hand_missing_since = current_time  # start timer
            elapsed = current_time - self.hand_missing_since
            if elapsed >= self.hand_warning_timer_sec and not self.hand_warning_active:
                self.hand_warning_count += 1
                self.hand_warning_active = True

        # Check warning state
        if self.hand_warning_count >= 2:
            flags.append("INTERVIEW TERMINATED – hands not visible (2 warnings)")
            cv2.putText(frame, "INTERVIEW TERMINATED", (30, h // 2),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
        elif self.hand_warning_active and not hands_detected:
            msg = f"WARNING {self.hand_warning_count}: Keep your hands visible!"
            flags.append(msg)
            cv2.putText(frame, msg, (30, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        elif not hands_detected and self.hand_missing_since is not None:
            remaining = max(0, self.hand_warning_timer_sec - (current_time - self.hand_missing_since))
            cv2.putText(frame, f"Hands not visible! Warning in {remaining:.0f}s",
                        (30, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 2)

        # ═══════════════════════════════════════════════════════
        # 5. REMAINING RULE ENGINE
        # ═══════════════════════════════════════════════════════

        # Multiple persons
        if persons > 1:
            flags.append("Multiple persons detected")
            if self.cheating_frame is None:
                self.cheating_frame = frame.copy()

        # Phone consecutive frames
        if phones > 0:
            self.consecutive_phone_frames += 1
            self.phone_detection_history.append({
                "timestamp": datetime.now().isoformat(),
                "confidence": max(b[4] for b in phone_boxes),
                "count": phones
            })
            if len(self.phone_detection_history) > 100:
                self.phone_detection_history.pop(0)
        else:
            self.consecutive_phone_frames = 0

        if self.consecutive_phone_frames >= 5:
            flags.append("Mobile phone detected")
            self.cheating_frame = frame.copy()
            self.cheating_boxes = phone_boxes
            results["cheated_boxes"] = [{
                "x": b[0], "y": b[1],
                "w": b[2] - b[0], "h": b[3] - b[1],
                "confidence": b[4]
            } for b in phone_boxes]

        # Face absence
        if face_detected:
            self.last_face_seen = current_time
        elif (current_time - self.last_face_seen) > 3.0:
            flags.append("Candidate left screen")

        # ── Encode annotated frame back to base64 for frontend ──
        _, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        results["annotated_frame"] = base64.b64encode(buf).decode('utf-8')

        results["person_count"] = persons
        results["phone_count"] = phones
        results["flags"] = flags
        return results

    # ─────────────────────────────────────────────────────────
    def _create_annotated_frame_b64(self, frame, phone_boxes):
        try:
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            return base64.b64encode(buffer).decode('utf-8')
        except Exception as e:
            print(f"Error encoding frame: {e}")
            return None

    def get_cheating_evidence(self):
        if self.cheating_frame is not None and self.cheating_boxes:
            return {
                "frame_b64": self._create_annotated_frame_b64(
                    self.cheating_frame, self.cheating_boxes
                ),
                "boxes": self.cheating_boxes,
                "history": self.phone_detection_history[-10:]
            }
        return None

    def reset_detection(self):
        self.last_face_seen = time.time()
        self.hand_visible = True
        self.hand_missing_since = None
        self.hand_warning_active = False
        self.hand_warning_count = 0
        self.consecutive_phone_frames = 0
        self.phone_detection_history = []
        self.cheating_frame = None
        self.cheating_boxes = []
        print("✓ Cheat detector reset")

    def get_detection_status(self):
        return {
            "hand_warning_count": self.hand_warning_count,
            "hand_missing": self.hand_missing_since is not None,
            "consecutive_phone_frames": self.consecutive_phone_frames,
            "total_detections": len(self.phone_detection_history),
            "cheating_frame_captured": self.cheating_frame is not None,
            "models_loaded": {
                "face_person": self.face_person_model is not None,
                "phone": self.phone_model is not None,
                "hands": self.hands is not None
            }
        }


# Singleton
detector_instance = None

def get_detector():
    global detector_instance
    if detector_instance is None:
        detector_instance = CheatingDetector()
    return detector_instance
