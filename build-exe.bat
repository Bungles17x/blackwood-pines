@echo off
echo Building Blackwood Pines executable...
echo.

echo Step 0: Pushing code to GitHub...
git add .
git commit -m "Update auto-update system with in-game notifications" 2>nul
git push origin main
if %errorlevel% neq 0 (
    echo Warning: Git push failed or nothing to push. Continuing with build...
) else (
    echo Code pushed to GitHub successfully!
)
echo.

echo Step 1: Cleaning release folder...
if exist release (
    echo Release folder exists, attempting to clean...
    timeout /t 2 /nobreak >nul
    rmdir /s /q release 2>nul
    if exist release (
        echo WARNING: Release folder is locked. Please close any running instances of Blackwood Pines.
        pause
        exit /b 1
    )
)
echo Release folder cleaned.
echo.

echo Step 2: Building the game...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Step 3: Creating Windows executable...
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
echo Find your .exe file here: release\Blackwood-Pines Setup 1.0.0.exe
echo.
pause
