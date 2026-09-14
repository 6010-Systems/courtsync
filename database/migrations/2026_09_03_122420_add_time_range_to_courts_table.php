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
        Schema::table('courts', function (Blueprint $table) {
            $table->string('time_range')->nullable()->after('type');
        });

        // Status is a free-form string column (no DB-level enum), so existing
        // rows are remapped in code to the new vocabulary the UI now uses.
        DB::table('courts')->where('status', 'ACTIVE')->update(['status' => 'AVAILABLE']);
        DB::table('courts')->where('status', 'MAINTENANCE')->update(['status' => 'BLOCKED']);
        DB::table('courts')->where('status', 'INACTIVE')->update(['status' => 'NOT_AVAILABLE']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('courts')->where('status', 'AVAILABLE')->update(['status' => 'ACTIVE']);
        DB::table('courts')->where('status', 'BLOCKED')->update(['status' => 'MAINTENANCE']);
        DB::table('courts')->where('status', 'NOT_AVAILABLE')->update(['status' => 'INACTIVE']);
        DB::table('courts')->where('status', 'OPEN_PLAY')->update(['status' => 'ACTIVE']);

        Schema::table('courts', function (Blueprint $table) {
            $table->dropColumn('time_range');
        });
    }
};
