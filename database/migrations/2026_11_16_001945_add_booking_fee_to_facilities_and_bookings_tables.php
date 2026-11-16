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
        Schema::table('facilities', function (Blueprint $table) {
            // A zero value disables the fee. PERCENT is a share of the court subtotal.
            $table->string('booking_fee_type')->default('FIXED')->after('maya_qr_url');
            $table->decimal('booking_fee_value', 8, 2)->default(0)->after('booking_fee_type');
        });

        Schema::table('bookings', function (Blueprint $table) {
            // Snapshot of the court charge and the fee applied at booking time.
            $table->decimal('subtotal', 10, 2)->nullable()->after('total_price');
            $table->decimal('booking_fee', 10, 2)->default(0)->after('subtotal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['subtotal', 'booking_fee']);
        });

        Schema::table('facilities', function (Blueprint $table) {
            $table->dropColumn(['booking_fee_type', 'booking_fee_value']);
        });
    }
};
