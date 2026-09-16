<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        
        // Force HTTPS for Production or Ngrok
    if ($this->app->environment('production') || str_contains(config('app.url'), 'ngrok-free.dev')) {
        \Illuminate\Support\Facades\URL::forceScheme('https');
    }
    }
}
