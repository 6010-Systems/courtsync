<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['name', 'email', 'password', 'role', 'staff_role', 'status', 'mobile_number', 'google_id', 'avatar', 'facility_id', 'permissions'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Permissions a facility owner can grant to their facility staff.
     * Owners implicitly have every permission; these keys only gate staff.
     *
     * @var array<string, string>
     */
    public const STAFF_PERMISSIONS = [
        'view_players' => 'View Players',
        'manage_players' => 'Manage Players (Ban/Unban)',
        'view_courts' => 'View Courts',
        'create_courts' => 'Create Courts',
        'edit_courts' => 'Edit Courts',
        'delete_courts' => 'Delete Courts',
    ];

    /**
     * Shapes the flat STAFF_PERMISSIONS list above into a View/Create/Edit/Delete
     * matrix for the staff permissions editor. A null cell means that action
     * doesn't apply to the module (e.g. players self-register, so there's no
     * "create player" permission to grant).
     *
     * @var array<string, array<string, string|null>>
     */
    public const PERMISSION_MATRIX = [
        'Players' => ['view' => 'view_players', 'create' => null, 'edit' => 'manage_players', 'delete' => null],
        'Courts' => ['view' => 'view_courts', 'create' => 'create_courts', 'edit' => 'edit_courts', 'delete' => 'delete_courts'],
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'permissions' => 'array',
        ];
    }

    /**
     * Whether this user is allowed to perform a staff-gated action.
     * Facility owners always pass; facility staff need the permission granted
     * by their owner; every other role is denied.
     */
    public function hasPermission(string $key): bool
    {
        if ($this->role === 'FACILITY_OWNER') {
            return true;
        }

        if ($this->role !== 'FACILITY_STAFF') {
            return false;
        }

        return in_array($key, $this->permissions ?? [], true);
    }

    public function facilities()
    {
        return $this->hasMany(Facility::class, 'user_id');
    }

    public function workFacility()
    {
        return $this->belongsTo(Facility::class, 'facility_id');
    }

    /**
     * The facilities this user has joined as a player.
     */
    public function joinedFacilities(): BelongsToMany
    {
        return $this->belongsToMany(Facility::class, 'facility_player')
                    ->withPivot('status')
                    ->withTimestamps();
    }
}
