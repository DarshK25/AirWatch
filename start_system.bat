@echo off
REM AirWatch Pro Startup Script
REM This script starts both the backend and frontend servers

echo ===================================================
echo AirWatch Pro - System Startup
echo ===================================================
echo.

REM Check if PostgreSQL is running
echo Checking PostgreSQL status...
pg_isready > nul
if %errorlevel% neq 0 (
    echo PostgreSQL is not running! Please start PostgreSQL first.
    exit /b 1
)

REM Start the backend server
echo Starting backend server...
start cmd /k "cd fastapi_app && .venv\Scripts\activate && python run.py"

REM Wait for backend to start
echo Waiting for backend to initialize (10 seconds)...
timeout /t 10 /nobreak > nul

REM Start the frontend server
echo Starting frontend server...
start cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo System is starting up!
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo ===================================================
echo Press any key to shut down all servers...

pause > nul

echo Shutting down servers...
taskkill /f /im node.exe > nul 2>&1
taskkill /f /im python.exe > nul 2>&1

echo System shutdown complete.