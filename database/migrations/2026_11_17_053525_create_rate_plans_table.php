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
        Schema::create('rate_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facility_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            // COURT plans are bookable packages (Court Rental, All-In), ADDON plans are hourly extras.
            $table->string('kind', 20)->default('COURT');
            $table->string('description')->nullable();
            $table->decimal('day_rate', 8, 2);
            $table->decimal('night_rate', 8, 2)->nullable();
            $table->time('day_start_time')->default('05:00:00');
            $table->time('night_start_time')->default('17:00:00');
            $table->boolean('includes_ball')->default(true);
            $table->unsignedTinyInteger('included_paddles')->default(0);
            $table->unsignedTinyInteger('max_quantity')->default(4);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['facility_id', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rate_plans');
    }
};
