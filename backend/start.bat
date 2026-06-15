@echo off
cd /d "%~dp0"
call venv\Scripts\activate.bat
uvicorn main:app --host 127.0.0.1 --port 8765 --reload
