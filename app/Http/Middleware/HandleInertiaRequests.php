<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? $request->user()->load(['facilities', 'workFacility']) : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'status' => $request->session()->get('status'),
            ],
            'notifications' => function () use ($request): ?array {
                $user = $request->user();

                if (! $user) {
                    return null;
                }

                return [
                    'unread_count' => $user->unreadNotifications()->count(),
                    'has_push_subscription' => $user->pushSubscriptions()->exists(),
                ];
            },
            'vapidPublicKey' => config('webpush.vapid.public_key'),
        ];
    }
}
