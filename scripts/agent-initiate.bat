:: scripts\agent-initiate.bat
@echo off
REM --------------------------------------------
REM Scaffold Python FastAPI Agent Service
REM --------------------------------------------

REM 1) Ensure agent directory exists and navigate into it
cd /d "%~dp0..\agent"

REM 2) Create Python virtual environment if missing
if not exist venv (
  echo Creating Python virtual environment...
  python -m venv venv
) else (
  echo Virtual environment already exists.
)

REM 3) Activate virtual environment
call venv\Scripts\activate

REM 4) Upgrade pip
python -m pip install --upgrade pip

REM 5) Install FastAPI and Uvicorn
echo Installing FastAPI & Uvicorn...
pip install fastapi uvicorn

REM 6) Create main.py with basic FastAPI scaffold if missing
if not exist main.py (
  echo Creating main.py...
  > main.py echo "from fastapi import FastAPI"
  >> main.py echo "from pydantic import BaseModel"
  >> main.py echo ""
  >> main.py echo "app = FastAPI()"
  >> main.py echo ""
  >> main.py echo "class SuggestRequest(BaseModel):"
  >> main.py echo "    sessionId: str"
  >> main.py echo "    lastQuestionId: str"
  >> main.py echo "    wasCorrect: bool"
  >> main.py echo "    timeTaken: float"
  >> main.py echo ""
  >> main.py echo "@app.post(\"/agent/suggest-next\")"
  >> main.py echo "async def suggest_next(req: SuggestRequest):"
  >> main.py echo "    # TODO: implement agent logic here"  
  >> main.py echo "    return { 'nextQuestionId': None, 'strategyTip': '', 'message': '', 'reflectionPrompt': '' }"
) else (
  echo main.py already exists, skipping scaffold.
)

REM 7) Create requirements.txt if missing
if not exist requirements.txt (
  echo Creating requirements.txt...
  echo fastapi>requirements.txt
  echo uvicorn>>requirements.txt
) else (
  echo requirements.txt already exists.
)

REM 8) Provide run command reminder
echo.
echo To start the agent service, run:

echo    call venv\Scripts\activate

echo    uvicorn main:app --host 0.0.0.0 --port 8001 --reload

echo.
pausesec 5
