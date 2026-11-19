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
        Schema::table('bookings', function (Blueprint $table) {
            // Snapshot of the selected package and hourly add-ons at booking time.
            $table->foreignId('rate_plan_id')->nullable()->after('court_id')->constrained()->nullOnDelete();
            $table->string('rate_plan_name')->nullable()->after('rate_plan_id');
            $table->decimal('addons_total', 10, 2)->default(0)->after('booking_fee');
            $table->json('price_breakdown')->nullable()->after('addons_total');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('rate_plan_id');
            $table->dropColumn(['rate_plan_name', 'addons_total', 'price_breakdown']);
        });
    }
};
