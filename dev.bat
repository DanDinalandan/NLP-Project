@echo off
echo Starting ReviewBot dev servers...
start "ReviewBot Backend" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat && uvicorn main:app --host 127.0.0.1 --port 8765 --reload"
timeout /t 2 >nul
start "ReviewBot Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo Done. Two windows opened — backend on :8765, frontend on :1420
