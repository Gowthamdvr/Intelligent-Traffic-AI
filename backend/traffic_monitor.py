import cv2
import numpy as np
from ultralytics import YOLO
import time
from collections import deque

class TrafficMonitor:
    def __init__(self, model_path="yolov8n.pt"):
        # Load the YOLOv8 model
        self.model = YOLO(model_path)
        
        # Vehicle classes + Person for crowd counting
        # COCO: 0=person, 2=car, 3=motorcycle, 5=bus, 7=truck
        self.target_classes = [0, 2, 3, 5, 7]
        self.class_names = {0: 'Person', 2: 'Car', 3: 'Bike', 5: 'Bus', 7: 'Truck'}
        
        # Tracking & State
        self.vehicle_count = 0
        self.heatmap_accum = None # Will initialize based on frame size
        self.track_history = {} # ID -> deque of past centroids
        
        # Simulation States
        self.signal_state = "GREEN" # GREEN or RED
        self.last_signal_switch = time.time()
        
        # Traffic states
        self.traffic_density = "Low"
        self.alert_status = None
        self.active_alerts = [] # List of current alerts
        
    def process_frame(self, frame, is_static=False):
        # Handle Heatmap Resolution Mismatch
        if self.heatmap_accum is None or self.heatmap_accum.shape != frame.shape[:2]:
            self.heatmap_accum = np.zeros((frame.shape[0], frame.shape[1]), dtype=np.float32)

        # Simulate Traffic Light Cycle (every 10 seconds)
        if time.time() - self.last_signal_switch > 10:
            self.signal_state = "RED" if self.signal_state == "GREEN" else "GREEN"
            self.last_signal_switch = time.time()

        # Run YOLOv8 inference
        # If static, don't use track persistence to avoid linking to previous video frames
        if is_static:
            results = self.model(frame, verbose=False, classes=self.target_classes)
        else:
            results = self.model.track(frame, persist=True, verbose=False, classes=self.target_classes)
            
        result = results[0]
        
        # Reset per-frame counters
        counts = {name: 0 for name in self.class_names.values()}
        self.active_alerts = []
        
        # Draw Traffic Light Indicator
        color = (0, 255, 0) if self.signal_state == "GREEN" else (0, 0, 255)
        cv2.circle(frame, (50, 50), 30, color, -1)
        cv2.putText(frame, self.signal_state, (90, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
        
        # Define Lane/Violation Lines (Arbitrary for demo: roughly middle of screen)
        # Using a vertical line for lane violation and horizontal for stop line
        h, w = frame.shape[:2]
        lane_line_x = int(w * 0.6) 
        stop_line_y = int(h * 0.7)
        
        cv2.line(frame, (lane_line_x, 0), (lane_line_x, h), (0, 255, 255), 2) # Yellow Lane Line
        cv2.line(frame, (0, stop_line_y), (w, stop_line_y), (0, 0, 255), 2)   # Red Stop Line

        if result.boxes:
            for box in result.boxes:
                # Get bounding box coordinates
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                
                class_id = int(box.cls[0])
                label = self.class_names.get(class_id, 'Unknown')
                counts[label] += 1
                
                track_id = None
                if not is_static and box.id is not None:
                     track_id = int(box.id[0])

                # Update Heatmap
                try:
                    self.heatmap_accum[cy, cx] += 1
                except IndexError:
                    pass # Centroid out of bounds
                
                # --- VIOLATION & TRACKING LOGIC (Only for Video/Tracking) ---
                if track_id is not None:
                    # Track history
                    if track_id not in self.track_history:
                        self.track_history[track_id] = deque(maxlen=30)
                    self.track_history[track_id].append((cx, cy))
                    
                    # 1. Lane Violation (crossing the yellow line from left to right)
                    if len(self.track_history[track_id]) > 1:
                        prev_cx, _ = self.track_history[track_id][-2]
                        if prev_cx < lane_line_x and cx >= lane_line_x:
                            alert = f"Lane Violation: {label} #{track_id}"
                            self.active_alerts.append(alert)
                            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 3)

                    # 2. Red Light Violation (crossing stop line when RED)
                    if self.signal_state == "RED":
                        if len(self.track_history[track_id]) > 1:
                            _, prev_cy = self.track_history[track_id][-2]
                            if prev_cy < stop_line_y and cy >= stop_line_y:
                                alert = f"Red Light Running: {label} #{track_id}"
                                self.active_alerts.append(alert)
                                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 3)

                    # 3. Accident/Stalled Vehicle (Stationary for too long)
                    if len(self.track_history[track_id]) > 20: # Approx 1 sec @ 20fps
                        # Calculate movement
                        past_points = list(self.track_history[track_id])
                        dist = np.linalg.norm(np.array(past_points[0]) - np.array(past_points[-1]))
                        if dist < 5 and class_id != 0: # Ignore persons standing still
                            alert = f"Stalled Vehicle/Accident: {label} #{track_id}"
                            self.active_alerts.append(alert)
                            cv2.putText(frame, "!", (cx, cy-20), cv2.FONT_HERSHEY_DUPLEX, 2, (0,0,255), 3)

                    # Draw Box (with ID)
                    color = (0, 255, 0)
                    if label == 'Person': color = (255, 0, 0)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(frame, f"{label} {track_id}", (x1, y1 - 10), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                else:
                    # Static Mode Drawing (No ID)
                    color = (0, 255, 0)
                    if label == 'Person': color = (255, 0, 0)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(frame, f"{label}", (x1, y1 - 10), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        # Traffic Density
        total_vehicles = sum([v for k,v in counts.items() if k != 'Person'])
        if total_vehicles < 5: self.traffic_density = "Low"
        elif total_vehicles < 15: self.traffic_density = "Moderate"
        else: self.traffic_density = "High"
        
        # consolidate alerts
        final_alert = self.active_alerts[0] if self.active_alerts else None
        
        stats = {
            "total_vehicles": total_vehicles,
            "density": self.traffic_density,
            "breakdown": counts,
            "alert": final_alert,
            "signal_state": self.signal_state
        }
        
        return frame, stats
