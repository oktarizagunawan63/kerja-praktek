-- ============================================
-- FIX CASCADE DELETE FOR ALL CUSTOMER RELATIONS
-- ============================================
-- Jalankan script ini di phpMyAdmin atau MySQL client
-- Database: amsar_dashboard

USE amsar_dashboard;

-- 1. HAPUS DATA ORPHAN (data yang customernya sudah tidak ada)
-- ============================================

-- Hapus realisasi_visits yang plan_visit_id nya sudah tidak ada
DELETE rv FROM realisasi_visits rv
LEFT JOIN plan_visits pv ON rv.plan_visit_id = pv.id
WHERE pv.id IS NULL;

-- Hapus plan_visits yang customer_id nya sudah tidak ada
DELETE pv FROM plan_visits pv
LEFT JOIN customers c ON pv.customer_id = c.id
WHERE c.id IS NULL;

-- Hapus sales_funnels yang customer_id nya sudah tidak ada
DELETE sf FROM sales_funnels sf
LEFT JOIN customers c ON sf.customer_id = c.id
WHERE c.id IS NULL;

-- Hapus funnel_activities yang sales_funnel_id nya sudah tidak ada
DELETE fa FROM funnel_activities fa
LEFT JOIN sales_funnels sf ON fa.sales_funnel_id = sf.id
WHERE sf.id IS NULL;

-- Hapus warnings yang plan_visit_id nya sudah tidak ada
DELETE w FROM warnings w
LEFT JOIN plan_visits pv ON w.plan_visit_id = pv.id
WHERE w.plan_visit_id IS NOT NULL AND pv.id IS NULL;

-- 2. DROP EXISTING FOREIGN KEYS
-- ============================================

-- Drop FK dari realisasi_visits
ALTER TABLE realisasi_visits DROP FOREIGN KEY IF EXISTS realisasi_visits_plan_visit_id_foreign;
ALTER TABLE realisasi_visits DROP FOREIGN KEY IF EXISTS realisasi_visits_visited_by_foreign;

-- Drop FK dari plan_visits
ALTER TABLE plan_visits DROP FOREIGN KEY IF EXISTS plan_visits_customer_id_foreign;
ALTER TABLE plan_visits DROP FOREIGN KEY IF EXISTS plan_visits_assigned_to_foreign;
ALTER TABLE plan_visits DROP FOREIGN KEY IF EXISTS plan_visits_created_by_foreign;

-- Drop FK dari sales_funnels
ALTER TABLE sales_funnels DROP FOREIGN KEY IF EXISTS sales_funnels_customer_id_foreign;
ALTER TABLE sales_funnels DROP FOREIGN KEY IF EXISTS sales_funnels_assigned_to_foreign;
ALTER TABLE sales_funnels DROP FOREIGN KEY IF EXISTS sales_funnels_created_by_foreign;

-- Drop FK dari funnel_activities
ALTER TABLE funnel_activities DROP FOREIGN KEY IF EXISTS funnel_activities_sales_funnel_id_foreign;
ALTER TABLE funnel_activities DROP FOREIGN KEY IF EXISTS funnel_activities_created_by_foreign;

-- Drop FK dari warnings
ALTER TABLE warnings DROP FOREIGN KEY IF EXISTS warnings_user_id_foreign;
ALTER TABLE warnings DROP FOREIGN KEY IF EXISTS warnings_plan_visit_id_foreign;

-- Drop FK dari customers
ALTER TABLE customers DROP FOREIGN KEY IF EXISTS customers_created_by_foreign;

-- 3. ADD FOREIGN KEYS WITH CASCADE DELETE
-- ============================================

-- CUSTOMERS table
ALTER TABLE customers
  ADD CONSTRAINT customers_created_by_foreign 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

-- PLAN_VISITS table
ALTER TABLE plan_visits
  ADD CONSTRAINT plan_visits_customer_id_foreign 
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  
  ADD CONSTRAINT plan_visits_assigned_to_foreign 
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  
  ADD CONSTRAINT plan_visits_created_by_foreign 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

-- REALISASI_VISITS table
ALTER TABLE realisasi_visits
  ADD CONSTRAINT realisasi_visits_plan_visit_id_foreign 
  FOREIGN KEY (plan_visit_id) REFERENCES plan_visits(id) ON DELETE CASCADE,
  
  ADD CONSTRAINT realisasi_visits_visited_by_foreign 
  FOREIGN KEY (visited_by) REFERENCES users(id) ON DELETE SET NULL;

-- SALES_FUNNELS table
ALTER TABLE sales_funnels
  ADD CONSTRAINT sales_funnels_customer_id_foreign 
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  
  ADD CONSTRAINT sales_funnels_assigned_to_foreign 
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  
  ADD CONSTRAINT sales_funnels_created_by_foreign 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

-- FUNNEL_ACTIVITIES table
ALTER TABLE funnel_activities
  ADD CONSTRAINT funnel_activities_sales_funnel_id_foreign 
  FOREIGN KEY (sales_funnel_id) REFERENCES sales_funnels(id) ON DELETE CASCADE,
  
  ADD CONSTRAINT funnel_activities_created_by_foreign 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

-- WARNINGS table
ALTER TABLE warnings
  ADD CONSTRAINT warnings_user_id_foreign 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  ADD CONSTRAINT warnings_plan_visit_id_foreign 
  FOREIGN KEY (plan_visit_id) REFERENCES plan_visits(id) ON DELETE CASCADE;

-- 4. VERIFY CASCADE DELETE SETUP
-- ============================================

SELECT 
  TABLE_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  DELETE_RULE
FROM information_schema.REFERENTIAL_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = 'amsar_dashboard'
  AND DELETE_RULE = 'CASCADE'
ORDER BY TABLE_NAME;

-- ============================================
-- SELESAI!
-- ============================================
-- Sekarang ketika customer dihapus, semua data terkait akan otomatis terhapus:
-- - plan_visits (cascade)
-- - realisasi_visits (cascade via plan_visits)
-- - sales_funnels (cascade)
-- - funnel_activities (cascade via sales_funnels)
-- - warnings (cascade jika terkait plan_visit)
