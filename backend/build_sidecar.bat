@echo off
:: Build the FastAPI sidecar and copy it to the Tauri binaries directory.
:: Run from the backend/ directory: build_sidecar.bat
::
:: Requires the venv to be set up first:
::   python -m venv venv
::   venv\Scripts\activate
::   pip install -r requirements.txt

if not exist "venv\Scripts\python.exe" (
    echo ERROR: venv not found. Run setup first:
    echo   python -m venv venv
    echo   venv\Scripts\activate
    echo   pip install -r requirements.txt
    exit /b 1
)

echo Using venv Python...
venv\Scripts\pyinstaller reviewbot-api.spec --distpath dist --noconfirm

if %errorlevel% neq 0 (
    echo Build failed.
    exit /b 1
)

copy /Y "dist\reviewbot-api.exe" "..\frontend\src-tauri\binaries\reviewbot-api-x86_64-pc-windows-msvc.exe"
echo Done. Binary copied to frontend/src-tauri/binaries/
