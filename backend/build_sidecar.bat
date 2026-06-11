@echo off
:: Build the FastAPI sidecar and copy it to the Tauri binaries directory.
:: Run from the backend/ directory: build_sidecar.bat
pyinstaller reviewbot-api.spec --distpath dist --noconfirm
if %errorlevel% neq 0 (
    echo Build failed.
    exit /b 1
)
copy /Y "dist\reviewbot-api.exe" "..\frontend\src-tauri\binaries\reviewbot-api-x86_64-pc-windows-msvc.exe"
echo Done. Binary copied to frontend/src-tauri/binaries/
