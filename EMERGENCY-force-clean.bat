@echo off
title Blackwood Pines - EMERGENCY CLEAN ADMIN PANEL

:: Enable ANSI color escape codes in Windows Command Prompt
for /f "tokens=4-5 delims=[.] " %%a in ('ver') do set VERSION=%%a.%%b
reg add "HKCU\Console" /v VirtualTerminalLevel /t REG_DWORD /d 1 /f >nul 2>&1

:: Define ANSI Color Escape Codes
set "ESC="
set "RED=%ESC%[91m"
set "GREEN=%ESC%[92m"
set "YELLOW=%ESC%[93m"
set "CYAN=%ESC%[96m"
set "RESET=%ESC%[0m"

:: Initialize failed attempt counter
set "FAIL_COUNT=0"
set "MAX_ATTEMPTS=10"
set "LOCKOUT_TIME=30"

:MAIN_LOOP
cls
echo %CYAN%================================================
echo Blackwood Pines - EMERGENCY CLEAN ADMIN PANEL
echo ================================================%RESET%
echo.

:: Check if user reached maximum failed attempts
if %FAIL_COUNT% gtr 0 (
    echo %YELLOW%Failed attempts: %FAIL_COUNT% / %MAX_ATTEMPTS%%RESET%
    echo.
)

if %FAIL_COUNT% geq %MAX_ATTEMPTS% goto LOCKOUT_PERIOD

set "GITHUB_PAT="
set "HTTP_STATUS="
set /p "GITHUB_PAT=Enter your GitHub Personal Access Token: "

if "%GITHUB_PAT%"=="" (
    echo.
    echo %RED%[ERROR] Token cannot be empty. Please try again.%RESET%
    echo.
    echo Press any key to retry...
    pause >nul
    goto MAIN_LOOP
)

echo.
echo Verifying token with GitHub API...

:: Check status code using curl
for /f "tokens=*" %%A in ('curl -s -o nul -w "%%{http_code}" -H "Authorization: token %GITHUB_PAT%" https://api.github.com/user') do set "HTTP_STATUS=%%A"

:: Verify HTTP status code
if not "%HTTP_STATUS%"=="200" goto AUTH_FAILED

:: Reset attempt counter on success
set "FAIL_COUNT=0"

echo %GREEN%[SUCCESS] Token verified successfully! Proceeding with cleanup...%RESET%
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
    echo %RED%================================================%RESET%
    echo %RED%[ERROR] Release folder is still locked or in use!%RESET%
    echo %RED%================================================%RESET%
    echo.
    echo %YELLOW%Please try one of these solutions:%RESET%
    echo 1. Restart your computer
    echo 2. Use Task Manager to end any Blackwood Pines or Electron processes
    echo 3. Delete the release folder manually from File Explorer
    echo.
    echo Manual deletion path: C:\Users\lildc\Downloads\blackwood-pines (1)\release
    echo.
    echo %CYAN%Press any key to exit panel...%RESET%
    pause >nul
    exit /b 1
) else (
    echo.
    echo %GREEN%================================================%RESET%
    echo %GREEN%[SUCCESS] Release folder successfully deleted!%RESET%
    echo %GREEN%================================================%RESET%
    echo.
    echo You can now run build-exe.bat safely.
    echo.
    echo %CYAN%Press any key to exit panel...%RESET%
    pause >nul
    exit /b 0
)

:AUTH_FAILED
set /a FAIL_COUNT+=1
echo.
echo %RED%================================================%RESET%
echo %RED%[ERROR] Invalid GitHub Personal Access Token!%RESET%
echo %RED%GitHub API returned HTTP status: %HTTP_STATUS% (Unauthorized)%RESET%
echo %RED%================================================%RESET%
echo %RED%Access Denied. Please provide a valid token.%RESET%
echo.
echo %YELLOW%Press any key to try entering your token again...%RESET%
pause >nul
goto MAIN_LOOP

:LOCKOUT_PERIOD
echo %RED%================================================%RESET%
echo %RED%[SECURITY LOCKOUT] Too many failed attempts!%RESET%
echo %RED%Maximum of %MAX_ATTEMPTS% attempts reached.%RESET%
echo %RED%================================================%RESET%
echo.
echo %YELLOW%Please wait %LOCKOUT_TIME% seconds before trying again...%RESET%
echo.

:: Countdown loop for 30 seconds
for /l %%i in (%LOCKOUT_TIME%,-1,1) do (
    <nul set /p "=%RED%Locked out! Try again in %%i seconds...   %ESC%[1G%RESET%"
    timeout /t 1 /nobreak >nul
)

:: Reset count after lockout finishes
set "FAIL_COUNT=0"
echo.
echo.
echo %GREEN%Lockout expired. You may now try entering your token again.%RESET%
echo Press any key to continue...
pause >nul
goto MAIN_LOOP