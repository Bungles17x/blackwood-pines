@echo off
echo Attempting to force-clean release folder...
echo.

echo Step 1: Checking for running processes...
tasklist | find /I "Blackwood-Pines.exe" >nul
if %errorlevel% equ 0 (
    echo Found running Blackwood Pines process. Attempting to terminate...
    taskkill /F /IM "Blackwood-Pines.exe" >nul 2>&1
    timeout /t 2 /nobreak >nul
)

tasklist | find /I "electron.exe" >nul
if %errorlevel% equ 0 (
    echo Found running Electron process. Attempting to terminate...
    taskkill /F /IM "electron.exe" >nul 2>&1
    timeout /t 2 /nobreak >nul
)

echo.
echo Step 2: Attempting to delete release folder...
if exist release (
    rd /s /q release 2>nul
    timeout /t 3 /nobreak >nul
)

if exist release (
    echo.
    echo WARNING: Release folder is still locked.
    echo.
    echo Please try one of these solutions:
    echo 1. Restart your computer
    echo 2. Use Task Manager to end any Blackwood Pines or Electron processes
    echo 3. Delete the release folder manually from File Explorer
    echo.
    echo Manual deletion path: C:\Users\lildc\Downloads\blackwood-pines (1)\release
    echo.
    pause
    exit /b 1
) else (
    echo SUCCESS! Release folder deleted.
    echo.
    echo You can now run build-exe.bat
    echo.
    pause
)
