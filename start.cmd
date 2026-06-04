@echo off
cd /d "%~dp0"
set "NODE_DIR=C:\Program Files\nodejs"
if not exist "%NODE_DIR%\npm.cmd" (
  echo Node.js not found. Install from https://nodejs.org/
  pause
  exit /b 1
)
set "PATH=%NODE_DIR%;%PATH%"

if exist ".next" (
  echo Clearing old build cache...
  rmdir /s /q ".next"
)

echo.
echo Starting Portfolio AI at http://localhost:3003/portfolio
echo Press Ctrl+C to stop.
echo.

call npm run dev
