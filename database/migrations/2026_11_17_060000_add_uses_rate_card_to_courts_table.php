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
            // true = follow the rate card (assigned plans, or the facility card when none),
            // false = ignore the rate card and charge this court's own flat / day-night rates.
            $table->boolean('uses_rate_card')->default(true)->after('pricing_mode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courts', function (Blueprint $table) {
            $table->dropColumn('uses_rate_card');
        });
    }
};
