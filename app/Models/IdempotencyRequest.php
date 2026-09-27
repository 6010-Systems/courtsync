<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IdempotencyRequest extends Model
{
    protected $fillable = [
        'user_id',
        'idempotency_key',
        'path',
        'response_code',
        'response_body',
    ];

    protected $casts = [
        'response_body' => 'array',
    ];
}
