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
        Schema::table('facility_verifications', function (Blueprint $table) {
            $table->text('government_id_image_path')->nullable()->change();
            $table->text('business_permit_path')->nullable()->change();
            $table->text('business_registration_path')->nullable()->change();
            $table->text('proof_of_ownership_path')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('facility_verifications', function (Blueprint $table) {
            $table->string('government_id_image_path')->nullable()->change();
            $table->string('business_permit_path')->nullable()->change();
            $table->string('business_registration_path')->nullable()->change();
            $table->string('proof_of_ownership_path')->nullable()->change();
        });
    }
};
