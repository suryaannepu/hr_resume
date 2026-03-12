@echo off
REM Quick test script to verify detection is working

cd /d "%~dp0backend"

echo ==================================================
echo Testing Phone Detection System
echo ==================================================
echo.

python test_phone_detection.py

pause
