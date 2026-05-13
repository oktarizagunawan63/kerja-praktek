@echo off
echo ============================================
echo CLEAR LARAVEL LOGS
echo ============================================
echo.
echo File log akan dikosongkan...
echo.

cd /d "%~dp0"

REM Clear laravel.log using PowerShell
powershell -Command "Clear-Content 'storage\logs\laravel.log'"

echo.
echo ============================================
echo BERHASIL!
echo ============================================
echo.
echo File laravel.log sudah dikosongkan.
echo.

pause
