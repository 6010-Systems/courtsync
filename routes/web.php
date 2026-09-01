<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\FacilityController;
use App\Http\Controllers\Auth\SocialiteController;
use App\Http\Controllers\ProfileController;
use App\Http\Middleware\CheckAdmin;
use App\Http\Middleware\CheckBanned;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
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

// Replaced by group

Route::middleware(['auth', CheckBanned::class])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

Route::get('/auth/google/{tenant}', [SocialiteController::class, 'redirect'])->name('google.redirect');
Route::get('/auth/google/{tenant}/callback', [SocialiteController::class, 'callback'])->name('google.callback');

Route::middleware(['auth', CheckBanned::class])->group(function () {
    Route::get('/dashboard', function (Illuminate\Http\Request $request) {
        $user = $request->user();
        $user->load('facility.verification', 'facility.staff');
        return Inertia::render('Dashboard', [
            'user' => $user
        ]);
    })->middleware(['verified'])->name('dashboard');
    
    Route::post('/facility', [FacilityController::class, 'store'])->name('facility.store');
    Route::post('/facility/verification', [FacilityController::class, 'storeVerification'])->name('facility.verification.store');
    
    // Facility Staff Routes
    Route::get('/facility/staff', [FacilityController::class, 'staff'])->name('facility.staff');
    Route::post('/facility/staff', [FacilityController::class, 'storeStaff'])->name('facility.staff.store');
});

Route::middleware(['auth', CheckBanned::class, CheckAdmin::class])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/owners', [AdminController::class, 'owners'])->name('owners');
    Route::post('/owners', [AdminController::class, 'storeOwner'])->name('owners.store');
    
    Route::get('/staff', [AdminController::class, 'staff'])->name('staff');
    Route::post('/staff', [AdminController::class, 'storeStaff'])->name('staff.store');
    
    Route::put('/users/{id}', [AdminController::class, 'updateUser'])->name('users.update');
    Route::delete('/users/{id}', [AdminController::class, 'deleteUser'])->name('users.destroy');
    
    Route::get('/verifications', [AdminController::class, 'verifications'])->name('verifications');
    Route::post('/verifications/{facility_id}/approve', [AdminController::class, 'approveVerification'])->name('verifications.approve');
});
