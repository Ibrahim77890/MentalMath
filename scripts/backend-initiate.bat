@echo off
setlocal enabledelayedexpansion

REM --------------------------------------------
REM Check if nest CLI is already available
REM --------------------------------------------
where /q nest
if %ERRORLEVEL% EQU 0 (
  echo ✅ NestJS CLI found in PATH.
  set USE_NEST=1
) else (
  echo NestJS CLI not found. Trying global install...
  npm install -g @nestjs/cli
  if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ Global install failed. Will use npx fallback.
    set USE_NPX=1
  ) else (
    echo ✅ NestJS CLI installed successfully.
    set USE_NEST=1
  )
)

echo.
REM --------------------------------------------
REM Prepare folder structure and scaffold services
REM --------------------------------------------

cd /d "%~dp0.."
if not exist backend mkdir backend
if not exist agent mkdir agent

REM Main execution starts here - must come before the function definition
goto :main

REM Function to scaffold a project
:scaffold
set TARGET_DIR=%1
echo Creating %TARGET_DIR% service with TypeScript...
cd %TARGET_DIR%
if defined USE_NEST (
  nest new . --skip-git --package-manager npm --language ts
) else (
  npx -p @nestjs/cli nest new . --skip-git --package-manager npm --language ts
)
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Failed to scaffold %TARGET_DIR%
  exit /b 1
)
echo ✅ Created %TARGET_DIR% (NestJS, TS)
cd ..
exit /b 0

:main
call :scaffold backend
if %ERRORLEVEL% NEQ 0 goto :error

call :scaffold agent
if %ERRORLEVEL% NEQ 0 goto :error

echo.
echo Structure now contains:
echo    /backend    (NestJS, TypeScript)
echo    /agent      (NestJS, TypeScript)
echo    /frontend   (empty—run frontend-initiate.bat next)
echo    /scripts

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