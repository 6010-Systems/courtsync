<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Owner/Placeholder', ['title' => 'Dashboard']);
    })->name('dashboard');

    Route::prefix('owner')->name('owner.')->group(function () {
        Route::get('/bookings', fn () => Inertia::render('Owner/Placeholder', ['title' => 'Bookings']))->name('bookings');
        Route::get('/calendar', fn () => Inertia::render('Owner/Placeholder', ['title' => 'Calendar']))->name('calendar');
        Route::get('/facilities', fn () => Inertia::render('Owner/Placeholder', ['title' => 'Facilities']))->name('facilities');
        Route::get('/courts', fn () => Inertia::render('Owner/Placeholder', ['title' => 'Courts']))->name('courts');
        Route::get('/customers', fn () => Inertia::render('Owner/Placeholder', ['title' => 'Customers']))->name('customers');
        Route::get('/staff', fn () => Inertia::render('Owner/Placeholder', ['title' => 'Staff']))->name('staff');
        Route::get('/payments', fn () => Inertia::render('Owner/Placeholder', ['title' => 'Payments']))->name('payments');
        Route::get('/reports', fn () => Inertia::render('Owner/Placeholder', ['title' => 'Reports']))->name('reports');
        Route::get('/verification', fn () => Inertia::render('Owner/Placeholder', ['title' => 'Verification']))->name('verification');
        Route::get('/settings', fn () => Inertia::render('Owner/Placeholder', ['title' => 'Settings']))->name('settings');
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
