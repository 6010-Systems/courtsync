<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class PlayerRegisteredUserController extends Controller
{
    /**
     * Display the player registration view.
     */
    public function create($facilitySlug): Response
    {
        $facility = Facility::with('verification')->where('slug', $facilitySlug)->firstOrFail();

        return Inertia::render('Player/Auth/Register', [
            'facility' => $facility,
        ]);
    }

    /**
     * Handle an incoming player registration request.
     */
    public function store(Request $request, $facilitySlug): RedirectResponse
    {
        $facility = Facility::where('slug', $facilitySlug)->firstOrFail();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'PLAYER',
            'status' => 'VERIFIED',
        ]);

        // Attach player to this facility
        $user->joinedFacilities()->syncWithoutDetaching([$facility->id]);
        session(['last_facility_slug' => $facility->slug]);

        event(new Registered($user));

        Auth::login($user);

        // Honour the booking page the player was sent to login from (e.g. a court
        // card deep-link with ?court={id}); otherwise land on the booking page.
        return redirect()->intended('/'.$facilitySlug.'/book');
    }
}
