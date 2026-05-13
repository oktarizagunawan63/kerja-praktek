@echo off
echo ============================================
echo FIX CASCADE DELETE - DATABASE
echo ============================================
echo.
echo Script ini akan:
echo 1. Hapus data orphan (data yang customernya sudah tidak ada)
echo 2. Setup CASCADE DELETE untuk semua relasi customer
echo 3. Setelah ini, hapus customer akan otomatis hapus semua data terkait
echo.
echo PENTING: Ini akan mengubah struktur database!
echo.
pause

cd /d "%~dp0"

echo.
echo Menjalankan migration...
echo.

php artisan migrate --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo BERHASIL!
    echo ============================================
    echo.
    echo CASCADE DELETE sudah disetup dengan benar.
    echo Sekarang ketika customer dihapus, semua data terkait akan otomatis terhapus:
    echo - Plan Visits
    echo - Realisasi Visits
    echo - Sales Funnels
    echo - Warnings
    echo.
    echo Data orphan juga sudah dibersihkan.
    echo.
    echo Silakan test dengan:
    echo 1. Buka Customer List
    echo 2. Hapus salah satu customer
    echo 3. Cek Visit Reports - data customer tersebut harus hilang
    echo.
) else (
    echo.
    echo ============================================
    echo GAGAL!
    echo ============================================
    echo.
    echo Terjadi error saat menjalankan migration.
    echo Cek error message di atas.
    echo.
)

pause
