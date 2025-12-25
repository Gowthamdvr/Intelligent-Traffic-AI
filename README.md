# AI-Based Intelligent Traffic Monitoring System

This is a real-time traffic monitoring system using **YOLOv8** for vehicle detection and **FastAPI/React** for the application interface.

## System Architecture
- **Backend**: FastAPI (Python)
  - Runs YOLOv8 inference on live webcam feed.
  - Broadcasts video frames and traffic stats via WebSockets.
- **Frontend**: React + Vite
  - Displays live video feed.
  - Shows real-time analytics (Vehicle counts, Density, Alerts).
  - Premium Dark Mode UI.

## Prerequisites
- Python 3.8+
- Node.js & npm
- A Webcam (default ID: 0)

## Installation & Running

### 1. Setup Backend
Open a terminal in the `backend` folder:
```powershell
cd backend
pip install -r requirements.txt
python main.py
```
*Note: On the first run, it will automatically download the YOLOv8 model weights.*

### 2. Setup Frontend
Open a new terminal in the `frontend` folder:
```powershell
cd frontend
npm install
npm run dev
```

### 3. Usage
- Open your browser to the URL shown in the frontend terminal (usually `http://localhost:5173`).
- Allow camera access if prompted (though the backend uses the camera directly).
- The dashboard will show live traffic data.

## Features
- **Vehicle Detection**: Cars, Bikes, Buses, Trucks.
- **Traffic Density**: Low, Moderate, High context-aware status.
- **Speed/Accident Alerts**: Simulated logic for demonstration purposes (as calibration requires real-world setup).
