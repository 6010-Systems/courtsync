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
        Schema::table('facilities', function (Blueprint $table) {
            $table->string('logo_url')->nullable()->after('slug');
            $table->string('cover_photo_url')->nullable()->after('logo_url');
        });

        $defaultCovers = [
            'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=1600&q=80',
        ];

        foreach (DB::table('facilities')->cursor() as $index => $facility) {
            DB::table('facilities')
                ->where('id', $facility->id)
                ->update([
                    'cover_photo_url' => $defaultCovers[$index % count($defaultCovers)],
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('facilities', function (Blueprint $table) {
            $table->dropColumn(['logo_url', 'cover_photo_url']);
        });
    }
};
