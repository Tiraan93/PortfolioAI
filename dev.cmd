@echo off
set "NODE_DIR=C:\Program Files\nodejs"
if not exist "%NODE_DIR%\npm.cmd" (
  echo Node.js was not found at "%NODE_DIR%".
  echo Install from https://nodejs.org/ and restart the terminal.
  exit /b 1
)
set "PATH=%NODE_DIR%;%PATH%"
cd /d "%~dp0"

if exist ".next" (
  echo Clearing old build cache...
  rmdir /s /q ".next"
)

echo Starting at http://localhost:3003/portfolio
call npm run dev
