@echo off
echo Building Blackwood Pines executable...
echo.

echo Step 1: Building the game...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Creating Windows executable...
call npm run dist-win
if %errorlevel% neq 0 (
    echo Executable creation failed!
    pause
    exit /b 1
)

echo.
echo =====================================================
echo SUCCESS! Executable created in 'release' folder
echo =====================================================
echo.
echo Find your .exe file here: release\Blackwood Pines Setup 1.0.0.exe
echo.
pause
