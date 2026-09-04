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

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard/Index');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/bookings', function () {
        return Inertia::render('Bookings/Index');
    })->name('bookings.index');

    Route::get('/calendar', function () {
        return Inertia::render('Calendar/Index');
    })->name('calendar.index');

    Route::get('/facilities', function () {
        return Inertia::render('Facilities/Index');
    })->name('facilities.index');

    Route::get('/courts', function () {
        return Inertia::render('Courts/Index');
    })->name('courts.index');

    Route::get('/customers', function () {
        return Inertia::render('Customers/Index');
    })->name('customers.index');

    Route::get('/staff', function () {
        return Inertia::render('Staff/Index');
    })->name('staff.index');

    Route::get('/payments', function () {
        return Inertia::render('Payments/Index');
    })->name('payments.index');

    Route::get('/reports', function () {
        return Inertia::render('Reports/Index');
    })->name('reports.index');

    Route::get('/verification', function () {
        return Inertia::render('Verification/Index');
    })->name('verification.index');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';