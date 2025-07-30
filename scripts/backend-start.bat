@echo off
setlocal enabledelayedexpansion

REM --------------------------------------------
REM Start NestJS backend in development mode
REM --------------------------------------------

REM Navigate to backend directory
cd /d "%~dp0..\backend"
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Could not navigate to backend directory.
  echo Make sure the path "%~dp0..\backend" exists.
  goto :error
)

echo Installing dependencies (if needed)...
call npm install
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Failed to install dependencies.
  goto :error
)

echo.
echo Starting backend in dev mode (watch + auto-reload)...
call npm run start:dev
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Backend failed to start.
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