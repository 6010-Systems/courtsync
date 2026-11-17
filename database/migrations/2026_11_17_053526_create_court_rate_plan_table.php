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
        Schema::create('court_rate_plan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('court_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rate_plan_id')->constrained()->cascadeOnDelete();
            // A court only offers the plans assigned (and enabled) to it.
            $table->boolean('is_enabled')->default(true);
            // Optional per-court price overrides, e.g. a premium court charges more.
            $table->decimal('day_rate_override', 8, 2)->nullable();
            $table->decimal('night_rate_override', 8, 2)->nullable();
            $table->timestamps();

            $table->unique(['court_id', 'rate_plan_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('court_rate_plan');
    }
};
