@echo off
setlocal EnableExtensions

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js 20 or newer is required, but Node.js was not found on PATH.
  echo Install Node.js 20 or newer, then run this launcher again.
  exit /b 1
)

set "NODE_MAJOR="
for /f "tokens=1 delims=." %%A in ('node --version 2^>nul') do set "NODE_MAJOR=%%A"
set "NODE_MAJOR=%NODE_MAJOR:v=%"
for /f "delims=0123456789" %%A in ("%NODE_MAJOR%") do set "NODE_MAJOR="
if not defined NODE_MAJOR (
  echo Node.js 20 or newer is required, but the installed Node.js version could not be read.
  exit /b 1
)
if %NODE_MAJOR% LSS 20 (
  echo Node.js 20 or newer is required. Found Node.js %NODE_MAJOR%.
  exit /b 1
)

node "%~dp0scripts\launch.mjs"
set "LAUNCH_EXIT=%ERRORLEVEL%"
endlocal & exit /b %LAUNCH_EXIT%
