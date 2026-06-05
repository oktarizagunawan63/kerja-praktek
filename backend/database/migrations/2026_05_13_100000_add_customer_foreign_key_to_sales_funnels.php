<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales_funnels', function (Blueprint $table) {
            if (!Schema::hasColumn('sales_funnels', 'customer_id')) {
                $table->foreignId('customer_id')->nullable()->after('id')->constrained('customers')->onDelete('cascade');
            } elseif (!$this->hasForeignKey('sales_funnels', 'sales_funnels_customer_id_foreign')) {
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
            if ($this->hasForeignKey('sales_funnels', 'sales_funnels_customer_id_foreign')) {
                $table->dropForeign(['customer_id']);
            }
        });
    }

    private function hasForeignKey(string $table, string $constraint): bool
    {
        return DB::table('information_schema.referential_constraints')
            ->where('constraint_schema', DB::getDatabaseName())
            ->where('table_name', $table)
            ->where('constraint_name', $constraint)
            ->exists();
    }
};
