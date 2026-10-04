<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Registration extends Model
{
    use HasFactory;

    protected $table = 'registrations';

    protected $fillable = [
        'ticket_id',
        'full_name',
        'npm',
        'email',
        'whatsapp',
        'region',
        'komsel_status',
        'mentor_name',
        'faculty',
        'session',
        'is_checked_in',
        'checked_in_at',
        'registered_at',
    ];

    protected $casts = [
        'is_checked_in' => 'boolean',
        'checked_in_at' => 'datetime',
    ];

    /**
     * Format response to match frontend camelCase convention
     */
    public function toFrontendArray(): array
    {
        return [
            'id' => $this->id,
            'ticketId' => $this->ticket_id,
            'fullName' => $this->full_name,
            'npm' => $this->npm,
            'email' => $this->email,
            'whatsapp' => $this->whatsapp,
            'region' => $this->region,
            'komselStatus' => $this->komsel_status,
            'mentorName' => $this->mentor_name ?: '-',
            'faculty' => $this->faculty ?: 'Universitas Gunadarma',
            'session' => $this->session ?: 'Sesi Utama (16.30 WIB - Selesai)',
            'isCheckedIn' => (bool) $this->is_checked_in,
            'checkedInAt' => $this->checked_in_at ? $this->checked_in_at->format('Y-m-d H:i') : null,
            'registeredAt' => $this->registered_at ?: ($this->created_at ? $this->created_at->format('d/m/Y, H.i') : null),
        ];
    }
}
