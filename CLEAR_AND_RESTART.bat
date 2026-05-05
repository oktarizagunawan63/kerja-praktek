@echo off
echo ========================================
echo CLEARING CACHE AND RESTARTING FRONTEND
echo ========================================
echo.

echo [1/5] Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo Node processes killed
) else (
    echo No Node processes running
)
timeout /t 2 /nobreak >nul

echo.
echo [2/5] Clearing Vite cache...
if exist "frontend\node_modules\.vite" (
    rmdir /s /q "frontend\node_modules\.vite"
    echo ✓ Vite cache cleared!
) else (
    echo ✓ No Vite cache found
)

echo.
echo [3/5] Clearing dist folder...
if exist "frontend\dist" (
    rmdir /s /q "frontend\dist"
    echo ✓ Dist folder cleared!
) else (
    echo ✓ No dist folder found
)

echo.
echo [4/5] Clearing browser storage...
echo IMPORTANT: You need to manually clear browser storage:
echo 1. Open DevTools (F12)
echo 2. Go to Application tab
echo 3. Click "Clear storage"
echo 4. Click "Clear site data"

echo.
echo [5/5] Starting frontend dev server...
cd frontend
start cmd /k "npm run dev"

echo.
echo ========================================
echo DONE! Frontend server is starting...
echo ========================================
echo.
echo CRITICAL STEPS:
echo 1. Wait for dev server to fully start
echo 2. Clear browser storage (see above)
echo 3. Hard refresh: Ctrl + Shift + R
echo 4. If still error, close ALL browser tabs and reopen
echo.
pause
