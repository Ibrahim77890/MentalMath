@echo off
setlocal enabledelayedexpansion

REM --------------------------------------------
REM Start Quasar dev server for frontend
REM --------------------------------------------

REM Navigate to the frontend directory
cd /d "%~dp0..\frontend\mental-math-ui"
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Could not navigate to the frontend directory.
  echo Make sure the path "%~dp0..\frontend\mental-math-ui" exists.
  goto :error
)

echo Installing dependencies (if needed)...
call npm install
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Failed to install dependencies.
  goto :error
)

echo.
echo Starting Quasar dev server...
echo.
call npx quasar dev
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Quasar dev server failed to start.
  goto :error
)

goto :end

:error
echo.
echo Script execution halted due to errors.
goto :end

:end
echo.
echo Press any key to exit...
pause
endlocal