<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. HAPUS DATA ORPHAN (data yang customernya sudah tidak ada)
        // ============================================
        
        // Hapus realisasi_visits yang plan_visit_id nya sudah tidak ada
        DB::statement('
            DELETE rv FROM realisasi_visits rv
            LEFT JOIN plan_visits pv ON rv.plan_visit_id = pv.id
            WHERE pv.id IS NULL
        ');
        
        // Hapus plan_visits yang customer_id nya sudah tidak ada
        DB::statement('
            DELETE pv FROM plan_visits pv
            LEFT JOIN customers c ON pv.customer_id = c.id
            WHERE c.id IS NULL
        ');
        
        // Hapus sales_funnels yang customer_id nya sudah tidak ada
        DB::statement('
            DELETE sf FROM sales_funnels sf
            LEFT JOIN customers c ON sf.customer_id = c.id
            WHERE c.id IS NULL
        ');
        
        // Hapus warnings yang plan_visit_id nya sudah tidak ada
        DB::statement('
            DELETE w FROM warnings w
            LEFT JOIN plan_visits pv ON w.plan_visit_id = pv.id
            WHERE w.plan_visit_id IS NOT NULL AND pv.id IS NULL
        ');
        
        // 2. DROP EXISTING FOREIGN KEYS USING RAW SQL
        // ============================================
        
        // Drop FK dari realisasi_visits
        try { DB::statement('ALTER TABLE realisasi_visits DROP FOREIGN KEY realisasi_visits_plan_visit_id_foreign'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE realisasi_visits DROP FOREIGN KEY realisasi_visits_visited_by_foreign'); } catch (\Exception $e) {}
        
        // Drop FK dari plan_visits
        try { DB::statement('ALTER TABLE plan_visits DROP FOREIGN KEY plan_visits_customer_id_foreign'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE plan_visits DROP FOREIGN KEY plan_visits_assigned_to_foreign'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE plan_visits DROP FOREIGN KEY plan_visits_created_by_foreign'); } catch (\Exception $e) {}
        
        // Drop FK dari sales_funnels
        try { DB::statement('ALTER TABLE sales_funnels DROP FOREIGN KEY sales_funnels_customer_id_foreign'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE sales_funnels DROP FOREIGN KEY sales_funnels_assigned_to_foreign'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE sales_funnels DROP FOREIGN KEY sales_funnels_created_by_foreign'); } catch (\Exception $e) {}
        
        // Drop FK dari warnings
        try { DB::statement('ALTER TABLE warnings DROP FOREIGN KEY warnings_user_id_foreign'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE warnings DROP FOREIGN KEY warnings_plan_visit_id_foreign'); } catch (\Exception $e) {}
        
        // Drop FK dari customers
        try { DB::statement('ALTER TABLE customers DROP FOREIGN KEY customers_created_by_foreign'); } catch (\Exception $e) {}
        
        // 3. ADD FOREIGN KEYS WITH CASCADE DELETE USING RAW SQL
        // ============================================
        
        // CUSTOMERS table
        DB::statement('
            ALTER TABLE customers
            ADD CONSTRAINT customers_created_by_foreign 
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        ');
        
        // PLAN_VISITS table
        DB::statement('
            ALTER TABLE plan_visits
            ADD CONSTRAINT plan_visits_customer_id_foreign 
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
        ');
        
        DB::statement('
            ALTER TABLE plan_visits
            ADD CONSTRAINT plan_visits_assigned_to_foreign 
            FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
        ');
        
        DB::statement('
            ALTER TABLE plan_visits
            ADD CONSTRAINT plan_visits_created_by_foreign 
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        ');
        
        // REALISASI_VISITS table
        DB::statement('
            ALTER TABLE realisasi_visits
            ADD CONSTRAINT realisasi_visits_plan_visit_id_foreign 
            FOREIGN KEY (plan_visit_id) REFERENCES plan_visits(id) ON DELETE CASCADE
        ');
        
        DB::statement('
            ALTER TABLE realisasi_visits
            ADD CONSTRAINT realisasi_visits_visited_by_foreign 
            FOREIGN KEY (visited_by) REFERENCES users(id) ON DELETE SET NULL
        ');
        
        // SALES_FUNNELS table (only if customer_id column exists)
        if (Schema::hasColumn('sales_funnels', 'customer_id')) {
            DB::statement('
                ALTER TABLE sales_funnels
                ADD CONSTRAINT sales_funnels_customer_id_foreign 
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            ');
        }
        
        if (Schema::hasColumn('sales_funnels', 'assigned_to')) {
            // Make assigned_to nullable first
            DB::statement('ALTER TABLE sales_funnels MODIFY assigned_to BIGINT UNSIGNED NULL');
            
            DB::statement('
                ALTER TABLE sales_funnels
                ADD CONSTRAINT sales_funnels_assigned_to_foreign 
                FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
            ');
        }
        
        if (Schema::hasColumn('sales_funnels', 'created_by')) {
            DB::statement('
                ALTER TABLE sales_funnels
                ADD CONSTRAINT sales_funnels_created_by_foreign 
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            ');
        }
        
        // WARNINGS table
        DB::statement('
            ALTER TABLE warnings
            ADD CONSTRAINT warnings_user_id_foreign 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ');
        
        if (Schema::hasColumn('warnings', 'plan_visit_id')) {
            DB::statement('
                ALTER TABLE warnings
                ADD CONSTRAINT warnings_plan_visit_id_foreign 
                FOREIGN KEY (plan_visit_id) REFERENCES plan_visits(id) ON DELETE CASCADE
            ');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original foreign keys without cascade
        
        // Drop CASCADE foreign keys
        try { DB::statement('ALTER TABLE warnings DROP FOREIGN KEY warnings_user_id_foreign'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE warnings DROP FOREIGN KEY warnings_plan_visit_id_foreign'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE sales_funnels DROP FOREIGN KEY sales_funnels_customer_id_foreign'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE sales_funnels DROP FOREIGN KEY sales_funnels_assigned_to_foreign'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE sales_funnels DROP FOREIGN KEY sales_funnels_created_by_foreign'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE realisasi_visits DROP FOREIGN KEY realisasi_visits_plan_visit_id_foreign'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE realisasi_visits DROP FOREIGN KEY realisasi_visits_visited_by_foreign'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE plan_visits DROP FOREIGN KEY plan_visits_customer_id_foreign'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE plan_visits DROP FOREIGN KEY plan_visits_assigned_to_foreign'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE plan_visits DROP FOREIGN KEY plan_visits_created_by_foreign'); } catch (\Exception $e) {}
        try { DB::statement('ALTER TABLE customers DROP FOREIGN KEY customers_created_by_foreign'); } catch (\Exception $e) {}
        
        // Re-add original foreign keys without CASCADE
        DB::statement('ALTER TABLE customers ADD CONSTRAINT customers_created_by_foreign FOREIGN KEY (created_by) REFERENCES users(id)');
        DB::statement('ALTER TABLE plan_visits ADD CONSTRAINT plan_visits_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES customers(id)');
        DB::statement('ALTER TABLE plan_visits ADD CONSTRAINT plan_visits_assigned_to_foreign FOREIGN KEY (assigned_to) REFERENCES users(id)');
        DB::statement('ALTER TABLE plan_visits ADD CONSTRAINT plan_visits_created_by_foreign FOREIGN KEY (created_by) REFERENCES users(id)');
        DB::statement('ALTER TABLE realisasi_visits ADD CONSTRAINT realisasi_visits_plan_visit_id_foreign FOREIGN KEY (plan_visit_id) REFERENCES plan_visits(id)');
        DB::statement('ALTER TABLE realisasi_visits ADD CONSTRAINT realisasi_visits_visited_by_foreign FOREIGN KEY (visited_by) REFERENCES users(id)');
        DB::statement('ALTER TABLE warnings ADD CONSTRAINT warnings_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id)');
        
        if (Schema::hasColumn('warnings', 'plan_visit_id')) {
            DB::statement('ALTER TABLE warnings ADD CONSTRAINT warnings_plan_visit_id_foreign FOREIGN KEY (plan_visit_id) REFERENCES plan_visits(id)');
        }
    }
};
