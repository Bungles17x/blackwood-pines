@echo off
echo Starting Blackwood Pines in Chrome Incognito mode...
echo.
echo This will open Chrome in Incognito mode at http://localhost:3000
echo Incognito mode prevents browser extensions from interfering with the game.
echo.
pause

start chrome --incognito http://localhost:3000

echo.
echo If Chrome doesn't open, make sure:
echo 1. The dev server is running (npm run dev)
echo 2. Chrome is installed on your system
echo.
pause
