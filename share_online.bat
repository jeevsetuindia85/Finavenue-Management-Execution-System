@echo off
title ExecFlow - Public Team Share Link
echo ========================================================
echo       Generating Public Link for Any Wi-Fi / Phone
echo ========================================================
echo.
echo NOTE: Make sure start_app.bat is already running!
echo.
echo Connecting tunnel via localtunnel...
echo Share the URL shown below with your team:
echo.
npx localtunnel --port 8000
pause
