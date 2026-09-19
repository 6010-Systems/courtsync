<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Facility IDs this user is allowed to view bookings for
        $facilityIds = collect();
        if ($user->role === 'FACILITY_OWNER') {
            $facilityIds = $user->facilities()->pluck('id');
        } elseif ($user->role === 'FACILITY_STAFF' && $user->facility_id) {
            $facilityIds = collect([$user->facility_id]);
        }

        $bookings = Booking::whereIn('facility_id', $facilityIds)
            ->with(['user:id,name,email', 'court:id,name', 'facility:id,name'])
            ->orderBy('date', 'desc')
            ->orderBy('start_time', 'desc')
            ->get();

        $facilities = \App\Models\Facility::whereIn('id', $facilityIds)
            ->with('courts')
            ->get();

        return inertia('Facility/Bookings', [
            'bookings' => $bookings,
            'facilities' => $facilities,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //  Validate the incoming data
        $validated = $request->validate([
            'facility_id' => 'required|exists:facilities,id',
            'court_id' => 'required|exists:courts,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'total_price' => 'required|numeric|min:0',
            'guest_name' => 'nullable|string|max:255',
        ]);

        $user = $request->user();

        //  Prevent Double Booking
        $conflict = Booking::where('court_id', $validated['court_id'])
            ->where('date', $validated['date'])
            ->where(function ($query) use ($validated) {
                // A requested time [A, B] overlaps with an existing time [C, D] if A < D and B > C.
                $query->where('start_time', '<', $validated['end_time'])
                      ->where('end_time', '>', $validated['start_time']);
            })
            ->where('status', '!=', 'cancelled')
            ->exists();

        if ($conflict) {
            return back()->withErrors(['conflict' => 'Sorry, this court is already booked for that time.']);
        }

        // Determine user_id based on whether a guest name is provided
        $userId = !empty($validated['guest_name']) ? null : $user->id;

        // Create the booking
        Booking::create([
            'facility_id' => $validated['facility_id'],
            'user_id' => $userId,
            'guest_name' => $validated['guest_name'] ?? null,
            'court_id' => $validated['court_id'],
            'date' => $validated['date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'total_price' => $validated['total_price'],
            'status' => 'pending', 
        ]);

        //  Register the player to the facility's player list
        $facility = \App\Models\Facility::findOrFail($validated['facility_id']);
        $facility->players()->syncWithoutDetaching([
            $user->id => ['status' => 'ACTIVE']
        ]);

        //  Return success
        return back()->with('success', 'Booking confirmed successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Booking $booking)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Booking $booking)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Booking $booking)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Booking $booking)
    {
        $user = $request->user();

        // Facility IDs this user is allowed to manage bookings for
        $facilityIds = collect();
        if ($user->role === 'FACILITY_OWNER') {
            $facilityIds = $user->facilities()->pluck('id');
        } elseif ($user->role === 'FACILITY_STAFF' && $user->facility_id) {
            $facilityIds = collect([$user->facility_id]);
        }

        if (!$facilityIds->contains($booking->facility_id)) {
            abort(403, 'Unauthorized action.');
        }

        $booking->delete();

        return redirect()->back()->with('success', 'Booking deleted successfully.');
    }
}
