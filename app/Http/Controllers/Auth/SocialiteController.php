<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialiteController extends Controller
{
    public function redirect($tenant)
    {
        $provider = "google_{$tenant}";

        if (!in_array($provider, ['google_staff', 'google_owner'])) {
            abort(404);
        }

        $config = config("services.{$provider}");

        return Socialite::buildProvider(\Laravel\Socialite\Two\GoogleProvider::class, $config)->stateless()->redirect();
    }

    public function callback($tenant)
    {
        $provider = "google_{$tenant}";

        if (!in_array($provider, ['google_staff', 'google_owner'])) {
            abort(404);
        }

        $config = config("services.{$provider}");

        try {
            $socialiteProvider = Socialite::buildProvider(\Laravel\Socialite\Two\GoogleProvider::class, $config)->stateless();
            
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
            $role = $tenant === 'staff' ? 'FACILITY_STAFF' : 'FACILITY_OWNER';
            
            // Create a new user
            $user = User::create([
                'name' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'password' => bcrypt(Str::password(24)),
                'role' => $role,
                'status' => 'PENDING_VERIFICATION',
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
            ]);
        }

        Auth::login($user);

        return redirect('/dashboard')->withCookie(cookie('last_login_method', 'google', 60 * 24 * 365));
    }
}
