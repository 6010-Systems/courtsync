<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PlayerBookingController extends Controller
{
    public function dashboard(Request $request): Response
    {
        abort_unless($request->user()->role === 'PLAYER', 403);

        $at = now();
        $bookings = $this->bookingsFor($request->user());

        return Inertia::render('Players/Dashboard', [
            'stats' => [
                'upcoming' => (clone $bookings)->upcoming($at)->count(),
                'awaitingConfirmation' => (clone $bookings)->upcoming($at)->where('status', 'pending')->count(),
                'past' => (clone $bookings)->past($at)->count(),
            ],
            'nextBooking' => (clone $bookings)->upcoming($at)->orderBy('date')->orderBy('start_time')->orderBy('id')->first(),
            'recentBookings' => $bookings->latest('id')->limit(5)->get(),
            'timezone' => config('app.timezone'),
        ]);
    }

    public function index(Request $request): Response
    {
        abort_unless($request->user()->role === 'PLAYER', 403);

        $validated = $request->validate([
            'filter' => ['sometimes', 'required', Rule::in(['upcoming', 'past', 'cancelled', 'all'])],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);
        $filter = $validated['filter'] ?? 'upcoming';
        $bookings = $this->bookingsFor($request->user());
        $at = now();

        if ($filter === 'upcoming') {
            $bookings->upcoming($at);
        } elseif ($filter === 'past') {
            $bookings->past($at);
        } elseif ($filter === 'cancelled') {
            $bookings->where('status', 'cancelled');
        }

        $direction = $filter === 'upcoming' ? 'asc' : 'desc';

        return Inertia::render('Players/Bookings', [
            'bookings' => $bookings->orderBy('date', $direction)->orderBy('start_time', $direction)->orderBy('id', $direction)
                ->paginate(10)->withQueryString(),
            'filter' => $filter,
            'timezone' => config('app.timezone'),
        ]);
    }

    private function bookingsFor(User $user): Builder
    {
        return $user->bookings()->getQuery()
            ->select(['id', 'facility_id', 'court_id', 'date', 'start_time', 'end_time', 'total_price', 'status'])
            ->with([
                'facility:id,name,slug,city,province',
                'court:id,name',
                'payment:id,booking_id,status,payment_method',
            ]);
    }
}
