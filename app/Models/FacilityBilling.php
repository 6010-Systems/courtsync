<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacilityBilling extends Model
{
    /**
     * Supported billing states for a facility's monthly collection.
     *
     * @var array<int, string>
     */
    public const STATUSES = ['UNBILLED', 'BILLED'];

    protected $fillable = [
        'facility_id',
        'period',
        'status',
        'billed_at',
        'billed_by',
    ];

    /**
     * @var array<string, string>
     */
    protected function casts(): array
    {
        return [
            'billed_at' => 'datetime',
        ];
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }

    public function billedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'billed_by');
    }
}
