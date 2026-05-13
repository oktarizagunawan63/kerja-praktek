<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales_funnels', function (Blueprint $table) {
            // Add customer_id column if not exists
            if (!Schema::hasColumn('sales_funnels', 'customer_id')) {
                $table->foreignId('customer_id')->nullable()->after('id')->constrained('customers')->onDelete('cascade');
            } else {
                // If column exists but no foreign key, add the constraint
                $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_funnels', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
        });
    }
};
