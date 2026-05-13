@echo off
echo ============================================
echo FIX CASCADE DELETE - KERJAPRAKTEK
echo ============================================
echo.
echo Script ini akan:
echo 1. Hapus data orphan (data yang customernya sudah tidak ada)
echo 2. Setup CASCADE DELETE untuk semua relasi customer
echo 3. Setelah ini, hapus customer akan otomatis hapus semua data terkait
echo.
echo PENTING: Backup database dulu sebelum jalankan!
echo.
pause

cd /d "%~dp0"

echo.
echo Menjalankan SQL script...
echo.

mysql -u root amsar_dashboard < FIX_CASCADE_DELETE.sql

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
    echo - Funnel Activities
    echo - Warnings
    echo.
    echo Data orphan juga sudah dibersihkan.
    echo.
) else (
    echo.
    echo ============================================
    echo GAGAL!
    echo ============================================
    echo.
    echo Terjadi error saat menjalankan SQL script.
    echo Pastikan:
    echo 1. MySQL service sudah jalan
    echo 2. Database 'amsar_dashboard' sudah ada
    echo 3. Username 'root' tanpa password
    echo.
    echo Atau jalankan manual di phpMyAdmin:
    echo 1. Buka phpMyAdmin
    echo 2. Pilih database 'amsar_dashboard'
    echo 3. Klik tab SQL
    echo 4. Copy-paste isi file FIX_CASCADE_DELETE.sql
    echo 5. Klik Go
    echo.
)

pause
