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
        Schema::table('facilities', function (Blueprint $table) {
            $table->json('operating_days')->nullable()->after('description');
            $table->string('operational_status')->default('OPEN')->after('operating_days');
        });

        DB::table('facilities')->update([
            'operating_days' => json_encode([1, 2, 3, 4, 5, 6, 7]),
            'operational_status' => 'OPEN',
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('facilities', function (Blueprint $table) {
            $table->dropColumn(['operating_days', 'operational_status']);
        });
    }
};
