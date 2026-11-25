<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Owners get an independent system fee for walk-in bookings, while every
     * booking records the channel it came through (online, walk-in, or a staff
     * court block) so fee reporting and dashboards can tell them apart.
     */
    public function up(): void
    {
        Schema::table('facilities', function (Blueprint $table) {
            $table->string('walk_in_fee_type')->default('FIXED')->after('booking_fee_value');
            $table->decimal('walk_in_fee_value', 8, 2)->default(0)->after('walk_in_fee_type');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->string('source', 20)->default('online')->after('status')->index();
        });

        // Keep today's economics: existing facilities keep charging their current
        // online fee on walk-ins until the owner edits the new setting.
        DB::table('facilities')->update([
            'walk_in_fee_type' => DB::raw('booking_fee_type'),
            'walk_in_fee_value' => DB::raw('booking_fee_value'),
        ]);

        // Anonymous bookings were the manual/walk-in entries created at the desk.
        DB::table('bookings')->whereNull('user_id')->update(['source' => 'walk_in']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['source']);
            $table->dropColumn('source');
        });

        Schema::table('facilities', function (Blueprint $table) {
            $table->dropColumn(['walk_in_fee_type', 'walk_in_fee_value']);
        });
    }
};
