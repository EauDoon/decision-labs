@echo off
setlocal
set "PROJECT_ROOT=%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Weekend Gap needs Node.js 20 or newer.
  echo Install Node.js, then double-click this file again.
  pause
  exit /b 1
)

set "NODE_MAJOR="
for /f "tokens=1 delims=." %%V in ('node -p "process.versions.node" 2^>nul') do set "NODE_MAJOR=%%V"
if not defined NODE_MAJOR (
  echo Weekend Gap could not determine the installed Node.js version.
  echo Install Node.js 20 or newer, then double-click this file again.
  pause
  exit /b 1
)
if %NODE_MAJOR% LSS 20 (
  echo Weekend Gap needs Node.js 20 or newer. Found Node.js %NODE_MAJOR%.
  echo Install a supported Node.js version, then double-click this file again.
  pause
  exit /b 1
)

node "%PROJECT_ROOT%scripts\launch.mjs" %*
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" pause
exit /b %EXIT_CODE%
