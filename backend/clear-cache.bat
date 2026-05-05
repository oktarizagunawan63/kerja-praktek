@echo off
cd /d "%~dp0"
C:\laragon\bin\php\php-8.2.4-Win32-vs16-x64\php.exe artisan clear-compiled
C:\laragon\bin\php\php-8.2.4-Win32-vs16-x64\php.exe artisan cache:clear
C:\laragon\bin\php\php-8.2.4-Win32-vs16-x64\php.exe artisan config:clear
C:\laragon\bin\php\php-8.2.4-Win32-vs16-x64\php.exe artisan route:clear
C:\laragon\bin\php\php-8.2.4-Win32-vs16-x64\php.exe artisan view:clear
echo Cache cleared!
pause
