<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Null means same-day booking; a date value means the booking crosses midnight
            // into that calendar day (the customer chose an end time earlier than start time).
            $table->date('end_date')->nullable()->after('date');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('end_date');
        });
    }
};
