@echo off
title ExecFlow - Management Execution System
cd /d "%~dp0backend"
echo ========================================================
echo       Starting ExecFlow Server on Port 8000...
echo ========================================================
echo App will open in your default browser at http://localhost:8000
echo Keep this window open while using the application.
echo.
call .venv312\Scripts\activate.bat
start "" "http://localhost:8000"
python run.py
pause
