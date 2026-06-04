@echo off
cd /d "%~dp0"
set "NODE_DIR=C:\Program Files\nodejs"
if not exist "%NODE_DIR%\npm.cmd" (
  echo Install Node.js from https://nodejs.org/ then run this script again.
  pause
  exit /b 1
)
set "PATH=%NODE_DIR%;%PATH%"

echo Installing dependencies...
call npm install
if errorlevel 1 (
  echo.
  echo npm install failed. If you see a certificate error, fix SSL or try another network.
  pause
  exit /b 1
)

if not exist ".env.local" (
  if exist ".env.example" (
    copy /Y ".env.example" ".env.local" >nul
    echo Created .env.local — open it and add your GROQ_API_KEY from https://console.groq.com/keys
  ) else (
    echo Warning: .env.example not found.
  )
) else (
  echo .env.local already exists.
)

if exist ".next" (
  echo Clearing old build cache...
  rmdir /s /q ".next"
)

echo.
echo Setup complete. Next steps:
echo   1. Edit .env.local and set GROQ_API_KEY=
echo   2. Run start.cmd
echo   3. Open http://localhost:3003/portfolio
echo.
pause
