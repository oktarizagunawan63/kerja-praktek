-- SQL Script untuk menambahkan kolom customer manual di realisasi_visits
-- Jalankan di phpMyAdmin pada database: amsar_dashboard

-- Tambah kolom customer fields untuk unplanned visits
ALTER TABLE realisasi_visits 
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255) NULL AFTER customer_id,
ADD COLUMN IF NOT EXISTS customer_company VARCHAR(255) NULL AFTER customer_name,
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(255) NULL AFTER customer_company,
ADD COLUMN IF NOT EXISTS customer_address TEXT NULL AFTER customer_phone;

-- Verifikasi struktur table
DESCRIBE realisasi_visits;

-- Cek data yang ada
SELECT id, type, customer_id, customer_name, customer_company, approval_status 
FROM realisasi_visits 
ORDER BY created_at DESC 
LIMIT 10;
