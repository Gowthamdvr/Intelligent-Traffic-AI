@echo off
echo Starting Backend Server...
start "Backend - AI Traffic Monitor" cmd /k "cd backend && python main.py"

echo Starting Frontend Dashboard...
start "Frontend - Dashboard" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo  AI Traffic Monitoring System is Starting...
echo  Please wait for the backend to load the YOLOv8 model.
echo  Then access the dashboard at: http://localhost:5173
echo ========================================================
pause
