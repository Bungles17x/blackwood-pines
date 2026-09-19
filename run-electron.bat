@echo off
echo Starting Blackwood Pines in Electron mode...
echo.

echo First, building the game...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Starting Electron...
call npm run electron
