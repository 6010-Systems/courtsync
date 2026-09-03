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
        Schema::create('facility_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facility_id')->constrained('facilities')->onDelete('cascade');
            $table->string('government_id_type')->nullable();
            $table->string('government_id_number')->nullable();
            $table->string('government_id_image_path')->nullable();
            $table->string('business_permit_path')->nullable();
            $table->string('business_registration_path')->nullable();
            $table->string('proof_of_ownership_path')->nullable();
            $table->json('facility_photos')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('facility_verifications');
    }
};
