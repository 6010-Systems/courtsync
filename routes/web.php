<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\FacilityController;
use App\Http\Controllers\Auth\SocialiteController;
use App\Http\Controllers\Auth\PlayerSessionController;
use App\Http\Controllers\Auth\PlayerRegisteredUserController;
use App\Http\Controllers\ProfileController;
use App\Http\Middleware\CheckAdmin;
use App\Http\Middleware\CheckBanned;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Facility;

Route::get('/', function () {
    $facilities = Facility::select('id','name', 'slug', 'city', 'province', 'description')
        ->with('verification:id,facility_id,facility_photos')
        ->where('verification_status', 'APPROVED')
        ->latest()
        ->take(6)
        ->get();

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
        'facilities' => $facilities,
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

    Route::get('/dashboard', function (Request $request) {
        $user = $request->user();
        $user->load('facilities.verification', 'facilities.staff');
        return Inertia::render('Dashboard', [
            'user' => $user
        ]);
    })->middleware(['verified'])->name('dashboard');
    
    // Facilities Management
    Route::get('/facilities', [FacilityController::class, 'index'])->name('facilities.index');
    Route::post('/facility', [FacilityController::class, 'store'])->name('facility.store');
    Route::delete('/facility/{facility}', [FacilityController::class, 'destroy'])->name('facility.destroy');
    Route::post('/facility/verification', [FacilityController::class, 'storeVerification'])->name('facility.verification.store');
    
    // Facility Staff Routes
    Route::get('/facility/staff', [FacilityController::class, 'staff'])->name('facility.staff');
    Route::post('/facility/staff', [FacilityController::class, 'storeStaff'])->name('facility.staff.store');
    Route::delete('/facility/staff/{user}', [FacilityController::class, 'deleteStaff'])->name('facility.staff.destroy');
    
    // Facility Players Routes
    Route::get('/facility/players', [FacilityController::class, 'players'])->name('facility.players');
    Route::post('/facility/players/{user}/toggle-ban', [FacilityController::class, 'toggleBanPlayer'])->name('facility.players.toggle-ban');
});

Route::middleware(['auth', CheckBanned::class, CheckAdmin::class])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/owners', [AdminController::class, 'owners'])->name('owners');
    Route::post('/owners', [AdminController::class, 'storeOwner'])->name('owners.store');
    
    Route::get('/staff', [AdminController::class, 'staff'])->name('staff');
    Route::post('/staff', [AdminController::class, 'storeStaff'])->name('staff.store');
    
    Route::put('/users/{id}', [AdminController::class, 'updateUser'])->name('users.update');
    Route::delete('/users/{id}', [AdminController::class, 'deleteUser'])->name('users.destroy');
    
    Route::get('/verifications', [AdminController::class, 'verifications'])->name('verifications');
    Route::post('/verifications/{facility_id}/status', [AdminController::class, 'updateVerificationStatus'])->name('verifications.status');

    Route::get('/facilities', [AdminController::class, 'facilities'])->name('facilities');
    Route::post('/facilities', [AdminController::class, 'storeFacility'])->name('facilities.store');
    Route::put('/facilities/{id}', [AdminController::class, 'updateFacility'])->name('facilities.update');
});

// Player Auth Routes for specific facilities
Route::middleware('guest')->group(function () {
    Route::get('/{facility:slug}/login', [PlayerSessionController::class, 'create'])->name('player.login');
    Route::post('/{facility:slug}/login', [PlayerSessionController::class, 'store']);
    Route::get('/{facility:slug}/register', [PlayerRegisteredUserController::class, 'create'])->name('player.register');
    Route::post('/{facility:slug}/register', [PlayerRegisteredUserController::class, 'store']);
});

// Public Facility Page (Must be at the bottom to avoid catching other routes like /admin)
Route::get('/{facility:slug}', [FacilityController::class, 'show'])->name('facility.show');
