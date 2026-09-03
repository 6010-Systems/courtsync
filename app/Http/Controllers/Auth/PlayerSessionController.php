<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Facility;

class PlayerSessionController extends Controller
{
    /**
     * Display the player login view.
     */
    public function create(Request $request, $facilitySlug): Response
    {
        $facility = Facility::with('verification')->where('slug', $facilitySlug)->firstOrFail();
        
        return Inertia::render('Auth/PlayerLogin', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'lastLoginMethod' => $request->cookie('last_login_method'),
            'facility' => $facility,
        ]);
    }

    /**
     * Handle an incoming player authentication request.
     */
    public function store(LoginRequest $request, $facilitySlug): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $facility = Facility::where('slug', $facilitySlug)->first();
        if ($facility) {
            $request->user()->joinedFacilities()->syncWithoutDetaching([$facility->id]);
        }

        // Redirect back to the facility show page
        return redirect()->intended('/' . $facilitySlug)
                         ->withCookie(cookie('last_login_method', 'email', 60 * 24 * 365));
    }
}
