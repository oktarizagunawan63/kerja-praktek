-- Script untuk menghapus material duplikat
-- Hanya menyimpan 1 material per nama per project

-- Lihat duplikat dulu
SELECT name, project_id, COUNT(*) as jumlah
FROM materials
GROUP BY name, project_id
HAVING COUNT(*) > 1;

-- Hapus duplikat, simpan yang ID paling kecil (yang pertama dibuat)
DELETE m1 FROM materials m1
INNER JOIN materials m2 
WHERE m1.id > m2.id 
AND m1.name = m2.name 
AND m1.project_id = m2.project_id;

-- Cek hasil setelah dihapus
SELECT * FROM materials ORDER BY project_id, name;
