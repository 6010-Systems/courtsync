<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Facility;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Guests heading to a facility booking page must land on that facility's
        // player login, not the facility owner / staff portal login.
        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->routeIs('facility.book') && ($facility = $request->route('facility'))) {
                $slug = $facility instanceof Facility ? $facility->slug : $facility;

                return route('player.login', ['facility' => $slug]);
            }

            return route('login');
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Not Found.'], 404);
            }

            return Inertia::render('NotFound')
                ->toResponse($request)
                ->setStatusCode(404);
        });
    })->create();
