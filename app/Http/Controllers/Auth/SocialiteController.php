<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use App\Models\User;
use GuzzleHttp\Client;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;
use Laravel\Socialite\Two\InvalidStateException;

class SocialiteController extends Controller
{
    public function redirect($tenant)
    {
        $provider = "google_{$tenant}";

        if (! in_array($provider, ['google_staff', 'google_owner', 'google_player'])) {
            abort(404);
        }

        $facilitySlug = null;

        if ($tenant === 'player' && request()->has('facility')) {
            $facilitySlug = (string) request('facility');
            session(['auth_facility_slug' => $facilitySlug]);
        }

        $config = config("services.{$provider}");

        if (empty($config['client_id']) || empty($config['client_secret'])) {
            return back()->with('error', 'Google authentication is not yet configured on this server.');
        }

        if (! empty($config['redirect']) && ! Str::startsWith($config['redirect'], ['http://', 'https://'])) {
            $config['redirect'] = url($config['redirect']);
        }

        // Use secure OAuth state parameter (RFC 6749) to prevent CSRF and
        // impersonation. For players we append the facility slug so the
        // callback can still return them to that venue when the session is
        // dropped mid-flow (e.g. the flow started on 127.0.0.1 but APP_URL is
        // localhost, so Google lands on a different origin).
        $parameters = ['prompt' => 'select_account'];
        $state = null;

        if ($facilitySlug) {
            $state = $parameters['state'] = Str::random(40).'.'.$facilitySlug;
        }

        $response = Socialite::buildProvider(GoogleProvider::class, $config)
            ->with($parameters)
            ->redirect();

        if ($state) {
            // Socialite stores its own generated state in the session; align it
            // with the state we embedded so the callback still verifies it.
            session(['state' => $state]);
        }

        return $response;
    }

    public function callback($tenant)
    {
        $provider = "google_{$tenant}";

        if (! in_array($provider, ['google_staff', 'google_owner', 'google_player'])) {
            abort(404);
        }

        $config = config("services.{$provider}");

        if (! empty($config['redirect']) && ! Str::startsWith($config['redirect'], ['http://', 'https://'])) {
            $config['redirect'] = url($config['redirect']);
        }

        try {
            $googleUser = $this->retrieveGoogleUser($config);
        } catch (\Exception $e) {
            return $this->authenticationFailed($tenant, $e);
        }

        $facilitySlug = $tenant === 'player' ? $this->facilitySlugFor(request()) : null;

        request()->session()->forget('auth_facility_slug');

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
        if ($facilitySlug) {
            $facility = Facility::where('slug', $facilitySlug)->first();

            if ($facility) {
                $user->joinedFacilities()->syncWithoutDetaching([$facility->id]);
                session(['last_facility_slug' => $facility->slug]);

                // Honour the booking page the player was sent to login from (e.g. a
                // court card deep-link with ?court={id}); otherwise land on booking.
                return redirect()->intended('/'.$facility->slug.'/book')
                    ->withCookie(cookie('last_login_method', 'google', 60 * 24 * 365));
            }
        }

        return redirect('/dashboard')->withCookie(cookie('last_login_method', 'google', 60 * 24 * 365));
    }

    /**
     * The facility a player started signing in from. The OAuth state carries the
     * slug so it survives a dropped session (e.g. localhost vs 127.0.0.1); the
     * session is the fallback.
     */
    private function facilitySlugFor(Request $request): ?string
    {
        $state = (string) $request->input('state', '');

        if (str_contains($state, '.')) {
            $slug = Str::afterLast($state, '.');

            if (Facility::where('slug', $slug)->exists()) {
                return $slug;
            }
        }

        return $request->session()->get('auth_facility_slug');
    }

    /**
     * Fetch the Google profile while enforcing the OAuth state parameter.
     *
     * A missing or tampered state is only tolerated in local development, where a
     * restarted server or a host change can drop the session mid-flow. Ultimately
     * the state parameter is what protects this callback from CSRF and account
     * impersonation, so it must never be silently downgraded anywhere else.
     *
     * @param  array{client_id?: string|null, client_secret?: string|null, redirect?: string|null}  $config
     */
    private function retrieveGoogleUser(array $config): SocialiteUser
    {
        try {
            return $this->socialiteUser($config);
        } catch (InvalidStateException $e) {
            if (! app()->environment('local')) {
                throw $e;
            }

            return $this->socialiteUser($config, stateless: true);
        }
    }

    /**
     * @param  array{client_id?: string|null, client_secret?: string|null, redirect?: string|null}  $config
     */
    private function socialiteUser(array $config, bool $stateless = false): SocialiteUser
    {
        $socialiteProvider = Socialite::buildProvider(GoogleProvider::class, $config);

        if ($stateless) {
            $socialiteProvider->stateless();
        }

        if (app()->environment('local')) {
            $socialiteProvider->setHttpClient(new Client(['verify' => false]));
        }

        return $socialiteProvider->user();
    }

    /**
     * Return the visitor to the login screen they started from with a visible error.
     *
     * Players go back to their facility login; everyone else to the owner/staff login.
     */
    private function authenticationFailed(string $tenant, \Exception $e): RedirectResponse
    {
        report($e);

        $message = app()->environment('local')
            ? 'Google sign-in failed: '.$e->getMessage()
            : 'We could not sign you in with Google. Please try again.';

        if ($tenant === 'player' && $slug = $this->facilitySlugFor(request())) {
            request()->session()->forget('auth_facility_slug');

            $facility = Facility::where('slug', $slug)->first();

            if ($facility) {
                return redirect("/{$facility->slug}/login")->with('error', $message);
            }
        }

        return redirect('/login')->with('error', $message);
    }
}
