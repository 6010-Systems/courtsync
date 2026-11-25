<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('facilities', function (Blueprint $table) {
            $table->json('qr_theme')->nullable()->after('cover_photo_url');
            $table->text('map_embed_url')->nullable()->after('qr_theme');
        });
    }

    public function down(): void
    {
        Schema::table('facilities', function (Blueprint $table) {
            $table->dropColumn(['qr_theme', 'map_embed_url']);
        });
    }
};
