@echo off
setlocal enabledelayedexpansion

REM --------------------------------------------
REM Check if npm is available
REM --------------------------------------------
where /q npm
if %ERRORLEVEL% NEQ 0 (
  echo ⚠️ npm is not installed or not in PATH. Please install Node.js and npm first.
  goto :error
)

echo.
REM --------------------------------------------
REM Scaffold Quasar frontend into /frontend
REM --------------------------------------------

REM 1) Jump to repo root
cd /d "%~dp0.."

REM 2) Ensure /frontend folder exists
if not exist frontend mkdir frontend
cd frontend

REM 3) Scaffold Quasar project here using the current recommended method
echo Creating Quasar project in /frontend...
echo This may take a moment...

echo Using npm init quasar (new recommended method)...
call npm init quasar@latest

set QUASAR_ERROR=%ERRORLEVEL%
if %QUASAR_ERROR% NEQ 0 (
  echo.
  echo ⚠️ Failed to create Quasar project with error code: %QUASAR_ERROR%
  goto :error
) else (
  echo ✅ Quasar project created successfully
)

REM 4) Install dependencies if not automatically done
if exist package.json (
  echo.
  echo Installing dependencies...
  call npm install
  if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ Failed to install dependencies.
    goto :error
  )
)

REM 5) Install Capacitor and Electron if needed
echo.
echo Checking for Capacitor and Electron support...

REM Check if capacitor is already in package.json
findstr "@capacitor/core" package.json >nul
if %ERRORLEVEL% NEQ 0 (
  echo Adding Capacitor support...
  call npm install -D @capacitor/core @capacitor/cli
  if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ Failed to add Capacitor support.
    goto :warning
  ) else (
    echo ✅ Added Capacitor support
  )
) else (
  echo ✅ Capacitor support already present
)

REM Check if electron is already in package.json
findstr "electron" package.json >nul
if %ERRORLEVEL% NEQ 0 (
  echo Adding Electron support...
  call npm install -D electron electron-packager
  if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ Failed to add Electron support.
    goto :warning
  ) else (
    echo ✅ Added Electron support
  )
) else (
  echo ✅ Electron support already present
)

echo.
echo ✅ Frontend scaffolded at %CD%
echo    Contains Quasar framework
goto :end

:warning
echo.
echo Script completed with warnings. Some features might not be available.
goto :end

:error
echo.
echo Script execution halted due to errors.
echo See above for error details.
goto :end

:end
echo.
echo Press any key to exit...
pause
endlocal