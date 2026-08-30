@echo off
setlocal

where node >nul 2>&1
if errorlevel 1 (
  echo Common Cart requires Node.js 20 or newer.
  echo Install Node.js, then run this launcher again.
  pause
  exit /b 1
)

pushd "%~dp0"
node scripts\launch.mjs %*
set "launch_status=%errorlevel%"
popd

if not "%launch_status%"=="0" pause
exit /b %launch_status%
