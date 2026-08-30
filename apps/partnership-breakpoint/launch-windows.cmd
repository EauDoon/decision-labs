@echo off
setlocal

set "PROJECT_ROOT=%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or newer is required. Install Node.js, then run this launcher again.
  exit /b 1
)

for /f "tokens=1 delims=." %%A in ('node -p "process.versions.node" 2^>nul') do set "NODE_MAJOR=%%A"
if not defined NODE_MAJOR (
  echo Node.js 20 or newer is required. The installed Node.js version could not be read.
  exit /b 1
)
if %NODE_MAJOR% LSS 20 (
  echo Node.js 20 or newer is required. Found Node.js %NODE_MAJOR%.
  exit /b 1
)

node "%PROJECT_ROOT%scripts\launch.mjs"
set "EXIT_CODE=%ERRORLEVEL%"
endlocal & exit /b %EXIT_CODE%
