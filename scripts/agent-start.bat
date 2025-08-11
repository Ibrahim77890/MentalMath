@echo off
REM filepath: e:\MentalMath\scripts\agent-start.bat

REM 1) Ensure agent directory exists and navigate into it
cd /d "%~dp0..\agent"

REM 2) Activate virtual environment
call venv\Scripts\activate.bat

REM 3) Install requirements if needed
pip install -r requirements.txt

REM 3) Set environment variables for longer timeouts
set WORKERS_TIMEOUT=600

REM 4) Start Uvicorn with auto-reload
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

pause