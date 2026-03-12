#!/usr/bin/env python
"""Test script to verify phone and person detection models are working"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from cheating_detector import get_detector
import cv2
import base64
import numpy as np

def test_model_loading():
    """Test if models load correctly"""
    print("=" * 60)
    print("Testing Model Loading...")
    print("=" * 60)
    
    detector = get_detector()
    status = detector.get_detection_status()
    
    print(f"Face/Person Model: {'✓ LOADED' if status['models_loaded']['face_person'] else '✗ FAILED'}")
    print(f"Phone Model: {'✓ LOADED' if status['models_loaded']['phone'] else '✗ FAILED'}")
    
    if not status['models_loaded']['phone']:
        print("\n⚠️ Phone model failed to load!")
        print("Checking available models in yolomodels/:")
        import os
        models_dir = os.path.join(os.path.dirname(__file__), 'yolomodels')
        if os.path.exists(models_dir):
            for f in os.listdir(models_dir):
                print(f"  - {f}")
        else:
            print(f"  Models directory not found: {models_dir}")
    
    return status['models_loaded']['phone']

def test_dummy_frame():
    """Test detection on a dummy frame"""
    print("\n" + "=" * 60)
    print("Testing Detection on Dummy Frame...")
    print("=" * 60)
    
    # Create a simple test image (640x480)
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    # Add some white area to simulate a phone-like object
    cv2.rectangle(dummy_frame, (200, 100), (300, 400), (255, 255, 255), -1)
    
    # Encode to base64
    _, buffer = cv2.imencode('.jpg', dummy_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    base64_image = base64.b64encode(buffer).decode('utf-8')
    
    detector = get_detector()
    results = detector.process_frame(base64_image)
    
    print(f"Persons detected: {results['person_count']}")
    print(f"Phones detected: {results['phone_count']}")
    print(f"Flags: {results['flags']}")
    print(f"Detection boxes: {len(results['boxes'])}")
    
    return results

def test_real_camera():
    """Test detection on real camera feed"""
    print("\n" + "=" * 60)
    print("Testing Detection on Real Camera Feed")
    print("Press 'q' to quit, 'p' to test phone detection, 'm' for multiple persons")
    print("=" * 60)
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Cannot access camera!")
        return
    
    detector = get_detector()
    frame_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_count += 1
        
        # Only process every 5th frame to save CPU
        if frame_count % 5 != 0:
            continue
        
        # Resize for faster processing
        small_frame = cv2.resize(frame, (640, 480))
        
        # Encode to base64
        _, buffer = cv2.imencode('.jpg', small_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        base64_image = base64.b64encode(buffer).decode('utf-8')
        
        # Detect
        results = detector.process_frame(base64_image)
        
        # Draw boxes on frame
        for box in results['boxes']:
            x, y, w, h = box['x'], box['y'], box['w'], box['h']
            color = (0, 0, 255) if box['label'] == 'Phone' else (255, 0, 0)
            cv2.rectangle(small_frame, (x, y), (x + w, y + h), color, 2)
            label = f"{box['label']} {box['confidence']*100:.0f}%"
            cv2.putText(small_frame, label, (x, y - 5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        # Display
        cv2.imshow('Detection Test', small_frame)
        
        # Console log
        if results['person_count'] > 0 or results['phone_count'] > 0:
            print(f"Frame {frame_count}: Persons={results['person_count']}, Phones={results['phone_count']}, Flags={results['flags']}")
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('p'):
            print(f"Last detection: {results}")
        elif key == ord('m'):
            print("Multi-person detection will trigger if 2+ people in frame")
    
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    print("\n🔍 CHEAT DETECTION SYSTEM TEST\n")
    
    # Test 1: Model loading
    model_ok = test_model_loading()
    
    if not model_ok:
        print("\n❌ Phone model not loaded! Cannot continue with other tests.")
        sys.exit(1)
    
    # Test 2: Dummy frame
    test_dummy_frame()
    
    # Test 3: Real camera (optional)
    try:
        test_real_camera()
    except Exception as e:
        print(f"Camera test skipped: {e}")
    
    print("\n✓ Tests complete!")
