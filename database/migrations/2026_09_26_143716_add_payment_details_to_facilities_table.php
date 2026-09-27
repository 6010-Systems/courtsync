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
            $table->string('gcash_name')->nullable();
            $table->string('gcash_number')->nullable();
            $table->string('gcash_qr_url')->nullable();
            $table->string('maya_name')->nullable();
            $table->string('maya_number')->nullable();
            $table->string('maya_qr_url')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('facilities', function (Blueprint $table) {
            $table->dropColumn([
                'gcash_name', 'gcash_number', 'gcash_qr_url',
                'maya_name', 'maya_number', 'maya_qr_url'
            ]);
        });
    }
};
