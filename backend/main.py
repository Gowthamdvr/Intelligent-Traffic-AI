from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import cv2
import asyncio
import json
import base64
import time
import os
import shutil
import numpy as np
from datetime import datetime

from traffic_monitor import TrafficMonitor
from database import engine, get_db, Base
from models import TrafficLog

# Create Tables
Base.metadata.create_all(bind=engine)

# Ensure upload directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

monitor = TrafficMonitor()

# Global variable to store latest stats
latest_stats = {
    "total_vehicles": 0,
    "density": "Low",
    "breakdown": {'Car': 0, 'Bike': 0, 'Bus': 0, 'Truck': 0, 'Person': 0},
    "alert": None,
    "signal_state": "GREEN"
}

@app.get("/")
async def root():
    return {"message": "Intelligent Traffic Monitoring System API is Running"}

@app.get("/stats")
async def get_stats():
    return latest_stats

@app.get("/logs")
async def get_logs(db: Session = Depends(get_db), limit: int = 50):
    logs = db.query(TrafficLog).order_by(TrafficLog.timestamp.desc()).limit(limit).all()
    return logs

@app.post("/analyze/image")
async def analyze_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
             raise HTTPException(status_code=400, detail="Invalid image file")
             
        # Process frame
        processed_frame, stats = monitor.process_frame(frame, is_static=True)
        
        # Encode result
        _, buffer = cv2.imencode('.jpg', processed_frame)
        frame_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return {
            "image": frame_base64,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/video")
async def upload_video(file: UploadFile = File(...)):
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"filename": file.filename, "message": "Video uploaded successfully"}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/video")
async def video_feed(websocket: WebSocket, source: str = "webcam", db: Session = Depends(get_db)):
    await websocket.accept()
    
    # Determine source
    video_source = 0
    if source != "webcam":
        potential_path = os.path.join(UPLOAD_DIR, source)
        if os.path.exists(potential_path):
            video_source = potential_path
        else:
             print(f"File not found: {potential_path}")
             # Fallback to webcam or close? Let's close with error code if possible or just fallback
             # await websocket.close(code=1000, reason="File not found")
             # return
    
    cap = cv2.VideoCapture(video_source)
    
    last_log_time = time.time()
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0) # Loop if video file
                if source != "webcam":
                    # If it's a video file, maybe we stop after one loop? or Loop?
                    # Let's loop for demo purposes
                    pass
                continue
            
            # Process frame with AI model
            processed_frame, stats = monitor.process_frame(frame)
            
            # Update global stats only if it's the live feed? 
            # If multiple people view different videos, this global state is messy.
            # For this MVP, we will only write to global stats if source is webcam
            if source == "webcam":
                global latest_stats
                latest_stats = stats
            
            # DB Logging Logic (Log every 5 seconds OR if there is an alert)
            # Only log for live webcam to avoid polluting DB with test videos re-runs
            if source == "webcam" and (time.time() - last_log_time > 5 or stats['alert']):
                # Basic throttling for alert logging to avoid spamming can be added
                new_log = TrafficLog(
                    total_vehicles=stats['total_vehicles'],
                    density_status=stats['density'],
                    vehicle_breakdown=stats['breakdown'],
                    alert_type=stats['alert']
                )
                try:
                    with next(get_db()) as session:
                        session.add(new_log)
                        session.commit()
                except Exception as e:
                    print(f"DB Error: {e}")
                
                last_log_time = time.time()

            # Encode frame to JPEG
            _, buffer = cv2.imencode('.jpg', processed_frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # Send data to client
            payload = {
                "image": frame_base64,
                "stats": stats
            }
            
            await websocket.send_json(payload)
            
            # Control frame rate (approx 30 FPS)
            await asyncio.sleep(0.033)
            
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cap.release()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
