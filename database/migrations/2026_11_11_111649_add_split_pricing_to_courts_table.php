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
        Schema::table('courts', function (Blueprint $table) {
            $table->string('pricing_mode', 20)->default('FLAT')->after('hourly_rate');
            $table->decimal('day_rate', 8, 2)->nullable()->after('pricing_mode');
            $table->decimal('night_rate', 8, 2)->nullable()->after('day_rate');
            $table->time('day_start_time')->default('06:00:00')->after('night_rate');
            $table->time('night_start_time')->default('18:00:00')->after('day_start_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courts', function (Blueprint $table) {
            $table->dropColumn([
                'pricing_mode',
                'day_rate',
                'night_rate',
                'day_start_time',
                'night_start_time',
            ]);
        });
    }
};
