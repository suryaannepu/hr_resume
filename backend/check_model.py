from ultralytics import YOLO
import sys

print("Loading...")
model = YOLO(r"c:\Users\acer\Desktop\RESUME_AI\backend\yolomodels\yolov8n-mobile-phone.pt")
print(model.names)
