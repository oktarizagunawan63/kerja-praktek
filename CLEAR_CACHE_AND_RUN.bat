@echo off
echo ========================================
echo CLEARING ALL CACHES AND RESTARTING
echo ========================================

echo.
echo [1/4] Stopping any running processes...
taskkill /F /IM node.exe 2>nul

echo.
echo [2/4] Deleting Vite cache...
if exist "frontend\node_modules\.vite" (
    rmdir /s /q "frontend\node_modules\.vite"
    echo Vite cache deleted!
) else (
    echo Vite cache not found, skipping...
)

echo.
echo [3/4] Deleting dist folder...
if exist "frontend\dist" (
    rmdir /s /q "frontend\dist"
    echo Dist folder deleted!
) else (
    echo Dist folder not found, skipping...
)

echo.
echo [4/4] Starting Vite dev server...
cd frontend
start cmd /k "npm run dev"

echo.
echo ========================================
echo DONE! 
echo ========================================
echo.
echo NEXT STEPS:
echo 1. Wait for Vite to start (check the new terminal window)
echo 2. Open browser and press Ctrl+Shift+R to hard refresh
echo 3. Or clear browser cache: Ctrl+Shift+Delete
echo.
echo All errors should be GONE now!
echo ========================================
pause
