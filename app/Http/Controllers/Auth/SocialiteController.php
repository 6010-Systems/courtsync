<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;

class SocialiteController extends Controller
{
    public function redirect($tenant)
    {
        $provider = "google_{$tenant}";

        if (!in_array($provider, ['google_staff', 'google_owner', 'google_player'])) {
            abort(404);
        }

        if ($tenant === 'player' && request()->has('facility')) {
            session(['auth_facility_slug' => request('facility')]);
        }

        $config = config("services.{$provider}");

        return Socialite::buildProvider(GoogleProvider::class, $config)->stateless()->redirect();
    }

    public function callback($tenant)
    {
        $provider = "google_{$tenant}";

        if (!in_array($provider, ['google_staff', 'google_owner', 'google_player'])) {
            abort(404);
        }

        $config = config("services.{$provider}");

        try {
            $socialiteProvider = Socialite::buildProvider(GoogleProvider::class, $config)->stateless();
            
            if (app()->environment('local')) {
                $socialiteProvider->setHttpClient(new \GuzzleHttp\Client(['verify' => false]));
            }

            $googleUser = $socialiteProvider->user();
        } catch (\Exception $e) {
            return redirect('/login')->with('error', 'Authentication failed: ' . $e->getMessage());
        }

        $user = User::where('email', $googleUser->getEmail())->first();

        if ($user && $user->status === 'BANNED') {
            return redirect('/login')->with('status', 'Your account has been banned. Please contact support.');
        }

        if ($user) {
            // Associate identity
            $user->update([
                'google_id' => $googleUser->getId(),
                'avatar' => $user->avatar ?? $googleUser->getAvatar(),
            ]);
        } else {
            // Determine role based on tenant
            $role = $tenant === 'staff' ? 'FACILITY_STAFF' : ($tenant === 'player' ? 'PLAYER' : 'FACILITY_OWNER');
            
            // Create a new user
            $user = User::create([
                'name' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'password' => bcrypt(Str::password(24)),
                'role' => $role,
                'status' => $role === 'PLAYER' ? 'VERIFIED' : 'PENDING_VERIFICATION',
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
            ]);
        }

        Auth::login($user);
        
        // Attach player to the facility they logged in from
        if ($tenant === 'player' && session()->has('auth_facility_slug')) {
            $slug = session()->pull('auth_facility_slug');
            $facility = \App\Models\Facility::where('slug', $slug)->first();
            if ($facility) {
                $user->joinedFacilities()->syncWithoutDetaching([$facility->id]);
            }
            return redirect('/' . $slug)->withCookie(cookie('last_login_method', 'google', 60 * 24 * 365));
        }

        return redirect('/dashboard')->withCookie(cookie('last_login_method', 'google', 60 * 24 * 365));
    }
}
