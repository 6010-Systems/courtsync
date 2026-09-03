<?php

namespace App\Http\Controllers\FacilityOwner;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Facility;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlayerController extends Controller
{
    private function allowedFacilityIds(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'FACILITY_OWNER') {
            return $user->facilities()->pluck('id');
        }

        if ($user->role === 'FACILITY_STAFF' && $user->facility_id) {
            return collect([$user->facility_id]);
        }

        return collect();
    }

    public function index(Request $request)
    {
        if (!$request->user()->hasPermission('view_players')) {
            abort(403, 'You do not have permission to view players.');
        }

        $facilityIds = $this->allowedFacilityIds($request);

        $facilities = $facilityIds->isEmpty()
            ? collect()
            : Facility::whereIn('id', $facilityIds)
                ->where('verification_status', 'APPROVED')
                ->with(['players' => function ($query) {
                    $query->select('users.id', 'users.name', 'users.email', 'users.avatar', 'users.created_at');
                }])
                ->get();

        $players = [];
        foreach ($facilities as $facility) {
            foreach ($facility->players as $player) {
                $players[] = [
                    'id' => $player->id,
                    'name' => $player->name,
                    'email' => $player->email,
                    'avatar' => $player->avatar,
                    'created_at' => $player->created_at,
                    'facility_id' => $facility->id,
                    'facility_name' => $facility->name,
                    'status' => $player->pivot->status,
                ];
            }
        }

        return Inertia::render('FacilityOwner/Players', [
            'auth' => [
                'user' => $request->user()->load('facilities')
            ],
            'players' => $players,
            'canManage' => $request->user()->hasPermission('manage_players'),
        ]);
    }

    public function toggleBan(Request $request, User $user)
    {
        if (!$request->user()->hasPermission('manage_players')) {
            abort(403, 'You do not have permission to manage players.');
        }

        $facilityId = $request->input('facility_id');
        $facilityIds = $this->allowedFacilityIds($request);

        if (!$facilityIds->contains((int) $facilityId)) {
            abort(403, 'Unauthorized action.');
        }

        $pivot = $user->joinedFacilities()->where('facility_id', $facilityId)->first();

        if (!$pivot) {
            abort(404, 'Player not found in this facility.');
        }

        $newStatus = $pivot->pivot->status === 'BANNED' ? 'ACTIVE' : 'BANNED';
        $user->joinedFacilities()->updateExistingPivot($facilityId, ['status' => $newStatus]);

        return redirect()->back()->with('success', 'Player status updated successfully.');
    }
}
