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
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('FACILITY_OWNER')->after('email');
            $table->string('staff_role')->nullable()->after('role');
            $table->string('status')->default('PENDING_VERIFICATION')->after('staff_role');
            $table->string('mobile_number')->nullable()->after('status');
            $table->string('google_id')->nullable()->after('mobile_number');
            $table->string('avatar')->nullable()->after('google_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'staff_role', 'status', 'mobile_number', 'google_id', 'avatar']);
        });
    }
};
