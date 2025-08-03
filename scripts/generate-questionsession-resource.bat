@echo off
SETLOCAL enabledelayedexpansion

REM Navigate to backend directory
cd /d "%~dp0..\backend"
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Could not navigate to backend directory.
  echo Make sure the path "%~dp0..\backend" exists.
  goto :error
)

echo Generating questionsession resource...
call npx @nestjs/cli g resource questionSessions --no-spec
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Failed to generate resource.
  goto :error
)

echo Done! The questionSessions module has been created with controller, service, DTOs, and entity.
goto :end

:error
echo.
echo Script execution halted due to errors.
goto :end

:end
echo.
echo Press any key to exit...
pause
ENDLOCAL
