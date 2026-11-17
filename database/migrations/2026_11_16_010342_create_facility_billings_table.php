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
        Schema::create('facility_billings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facility_id')->constrained()->cascadeOnDelete();
            $table->string('period', 7); // Billing month, e.g. 2026-11
            $table->string('status')->default('UNBILLED'); // UNBILLED, BILLED
            $table->timestamp('billed_at')->nullable();
            $table->foreignId('billed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['facility_id', 'period']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('facility_billings');
    }
};
