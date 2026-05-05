@echo off
echo Stopping any running dev servers...
taskkill /F /IM node.exe 2>nul

echo Clearing Vite cache...
if exist node_modules\.vite (
    rmdir /s /q node_modules\.vite
    echo Vite cache cleared
)

echo Starting dev server...
npm run dev
