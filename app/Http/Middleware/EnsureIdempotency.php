<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\IdempotencyRequest;

class EnsureIdempotency
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $idempotencyKey = $request->header('Idempotency-Key');

        if (!$idempotencyKey) {
            return $next($request);
        }

        $idempotencyRecord = IdempotencyRequest::where('idempotency_key', $idempotencyKey)->first();

        if ($idempotencyRecord) {
            // Duplicate request detected
            // For Inertia, we must return a redirect with errors to trigger the onError callback
            return back()->withErrors(['idempotency' => 'This request has already been processed or is currently in progress.']);
        }

        // Determine user ID
        $userId = $request->user() ? $request->user()->id : null;

        // Create the record to lock this key
        $idempotencyRecord = IdempotencyRequest::create([
            'idempotency_key' => $idempotencyKey,
            'user_id' => $userId,
            'path' => $request->path(),
            'response_code' => null, // null means in progress
            'response_body' => null,
        ]);

        // Process the request
        $response = $next($request);

        // Update the record with the actual response status and body for auditing
        $idempotencyRecord->update([
            'response_code' => $response->getStatusCode(),
            'response_body' => $response->getContent() ?: json_encode($response->headers->all()),
        ]);

        return $response;
    }
}
