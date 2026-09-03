<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\FacilityOwner\CourtController;
use App\Http\Controllers\FacilityOwner\FacilityController;
use App\Http\Controllers\FacilityOwner\StaffController;
use App\Http\Controllers\FacilityOwner\PlayerController;
use App\Http\Controllers\Player\FacilityShowController;
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

// ── Public Platform Landing ───────────────────────────────────────────
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

// ── Authenticated Common Routes (Profile) ──────────────────────────────
Route::middleware(['auth', CheckBanned::class])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

// ── OAuth Socialite ───────────────────────────────────────────────────
Route::get('/auth/google/{tenant}', [SocialiteController::class, 'redirect'])->name('google.redirect');
Route::get('/auth/google/{tenant}/callback', [SocialiteController::class, 'callback'])->name('google.callback');

// ── Role-Dispatched Dashboard ─────────────────────────────────────────
Route::middleware(['auth', CheckBanned::class, 'verified'])->get('/dashboard', function (Request $request) {
    $user = $request->user();

    if ($user->role === 'ADMIN') {
        return (new AdminController)->dashboard($request);
    }

    return (new FacilityController)->dashboard($request);
})->name('dashboard');

// ── Facility Owner & Staff Routes ─────────────────────────────────────
Route::middleware(['auth', CheckBanned::class])->group(function () {
    // Facilities Management
    Route::get('/facilities', [FacilityController::class, 'index'])->name('facilities.index');
    Route::post('/facility', [FacilityController::class, 'store'])->name('facility.store');
    Route::delete('/facility/{facility}', [FacilityController::class, 'destroy'])->name('facility.destroy');
    Route::post('/facility/verification', [FacilityController::class, 'storeVerification'])->name('facility.verification.store');
    
    // Facility Staff Routes
    Route::get('/facility/staff', [StaffController::class, 'index'])->name('facility.staff');
    Route::post('/facility/staff', [StaffController::class, 'store'])->name('facility.staff.store');
    Route::get('/facility/staff/{user}/permissions', [StaffController::class, 'editPermissions'])->name('facility.staff.permissions.edit');
    Route::put('/facility/staff/{user}/permissions', [StaffController::class, 'updatePermissions'])->name('facility.staff.permissions.update');
    Route::put('/facility/staff/{user}/facility', [StaffController::class, 'updateFacility'])->name('facility.staff.facility.update');
    Route::delete('/facility/staff/{user}', [StaffController::class, 'destroy'])->name('facility.staff.destroy');

    // Facility Players Routes
    Route::get('/facility/players', [PlayerController::class, 'index'])->name('facility.players');
    Route::post('/facility/players/{user}/toggle-ban', [PlayerController::class, 'toggleBan'])->name('facility.players.toggle-ban');

    // Facility Courts Routes
    Route::get('/facility/courts', [CourtController::class, 'index'])->name('facility.courts');
    Route::post('/facility/courts', [CourtController::class, 'store'])->name('facility.courts.store');
    Route::put('/facility/courts/{court}', [CourtController::class, 'update'])->name('facility.courts.update');
    Route::delete('/facility/courts/{court}', [CourtController::class, 'destroy'])->name('facility.courts.destroy');
});

// ── Platform Administrator Routes ─────────────────────────────────────
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

    Route::get('/courts', [AdminController::class, 'courts'])->name('courts');
});

// ── Tenant Player Auth Routes ─────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/{facility:slug}/login', [PlayerSessionController::class, 'create'])->name('player.login');
    Route::post('/{facility:slug}/login', [PlayerSessionController::class, 'store']);
    Route::get('/{facility:slug}/register', [PlayerRegisteredUserController::class, 'create'])->name('player.register');
    Route::post('/{facility:slug}/register', [PlayerRegisteredUserController::class, 'store']);
});

// ── Tenant Public / Player Facility Profile ───────────────────────────
Route::get('/{facility:slug}', [FacilityShowController::class, 'show'])->name('facility.show');
