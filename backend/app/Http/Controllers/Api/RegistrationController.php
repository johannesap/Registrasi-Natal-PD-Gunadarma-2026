<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class RegistrationController extends Controller
{
    const REGION_NAMES = [
        'depok' => 'Depok',
        'kalimalang' => 'Kalimalang',
        'karawaci' => 'Karawaci',
        'cengkareng' => 'Cengkareng',
        'simatupang' => 'Simatupang',
        'salemba' => 'Salemba',
        'alumni_tamu' => 'Alumni / Tamu',
    ];

    /**
     * GET /api/health
     */
    public function health()
    {
        $total = Registration::count();
        return response()->json([
            'status' => 'ok',
            'framework' => 'Laravel 12 (PHP 8.2)',
            'database' => 'PostgreSQL 18',
            'event' => 'Natal Persekutuan Doa Universitas Gunadarma 2026',
            'tagline' => 'Merayakan Kasih, Menyalakan Harapan',
            'serverTime' => now()->toIso8601String(),
            'totalRegistrations' => $total,
        ]);
    }

    /**
     * GET /api/stats
     */
    public function stats()
    {
        $all = Registration::all();
        $total = $all->count();
        $checkedIn = $all->where('is_checked_in', true)->count();
        $attendanceRate = $total > 0 ? (int) round(($checkedIn / $total) * 100) : 0;

        $regionCounts = [];
        foreach ($all as $item) {
            $r = $item->region ?: 'depok';
            $regionCounts[$r] = ($regionCounts[$r] ?? 0) + 1;
        }

        $withKomsel = $all->filter(function ($item) {
            return str_contains(strtolower($item->komsel_status ?: ''), 'sudah');
        })->count();

        $withoutKomsel = $all->filter(function ($item) {
            return str_contains(strtolower($item->komsel_status ?: ''), 'belum');
        })->count();

        $alumniTamu = $total - ($withKomsel + $withoutKomsel);

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'checkedIn' => $checkedIn,
                'notCheckedIn' => $total - $checkedIn,
                'attendanceRate' => $attendanceRate,
                'regionCounts' => $regionCounts,
                'komselStats' => [
                    'withKomsel' => $withKomsel,
                    'withoutKomsel' => $withoutKomsel,
                    'alumniTamu' => max(0, $alumniTamu),
                ],
            ],
        ]);
    }

    /**
     * GET /api/registrations
     */
    public function index(Request $request)
    {
        $query = Registration::orderBy('id', 'desc');

        if ($request->filled('search')) {
            $q = trim(strtolower($request->search));
            $query->where(function ($w) use ($q) {
                $w->whereRaw('LOWER(full_name) LIKE ?', ["%{$q}%"])
                  ->orWhere('npm', 'LIKE', "%{$q}%")
                  ->orWhereRaw('LOWER(ticket_id) LIKE ?', ["%{$q}%"])
                  ->orWhereRaw('LOWER(email) LIKE ?', ["%{$q}%"])
                  ->orWhere('whatsapp', 'LIKE', "%{$q}%")
                  ->orWhereRaw('LOWER(mentor_name) LIKE ?', ["%{$q}%"]);
            });
        }

        if ($request->filled('region') && $request->region !== 'all' && $request->region !== 'Semua Region') {
            $query->where('region', strtolower($request->region));
        }

        if ($request->filled('checkedIn') && $request->checkedIn !== 'all') {
            $isCheck = filter_var($request->checkedIn, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_checked_in', $isCheck);
        }

        $registrations = $query->get()->map(function ($item) {
            return $item->toFrontendArray();
        });

        return response()->json([
            'success' => true,
            'total' => $registrations->count(),
            'data' => $registrations,
        ]);
    }

    /**
     * GET /api/registrations/{ticketId}
     */
    public function show($ticketId)
    {
        $found = Registration::where('ticket_id', strtoupper(trim($ticketId)))
            ->orWhere('npm', trim($ticketId))
            ->first();

        if (!$found) {
            return response()->json(['success' => false, 'message' => 'Tiket tidak ditemukan'], 404);
        }

        return response()->json(['success' => true, 'data' => $found->toFrontendArray()]);
    }

    /**
     * POST /api/register
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fullName' => 'required|string|max:150',
            'npm' => 'required|digits_between:1,8',
            'email' => 'required|email|max:150',
            'whatsapp' => 'required|string|min:9|max:15',
            'region' => 'nullable|string',
            'komselStatus' => 'nullable|string',
            'mentorName' => 'nullable|string',
            'faculty' => 'nullable|string',
            'session' => 'nullable|string',
        ], [
            'fullName.required' => 'Nama lengkap wajib diisi.',
            'npm.required' => 'NPM wajib diisi.',
            'npm.digits_between' => 'NPM harus berupa angka dan maksimal 8 digit.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'whatsapp.required' => 'Nomor WhatsApp wajib diisi.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $fullName = trim($request->fullName);
        $npm = trim($request->npm);
        $email = trim($request->email);
        $cleanWa = preg_replace('/\D/', '', $request->whatsapp);
        $region = strtolower($request->input('region', 'depok'));
        $komselStatus = $request->input('komselStatus', 'Sudah memiliki Komsel');

        // Auto hyphen rule if belum punya komsel
        $isBelumPunya = str_contains(strtolower($komselStatus), 'belum memiliki');
        $mentorName = $isBelumPunya ? '-' : (trim($request->mentorName) ?: '-');
        $faculty = trim($request->input('faculty', 'Universitas Gunadarma')) ?: 'Universitas Gunadarma';
        $session = $request->input('session', 'Sesi Utama (16.30 WIB - Selesai)');

        // Generate unique official ticket code
        $randomSuffix = rand(1000, 9999);
        $npmSuffix = strlen($npm) >= 4 ? substr($npm, -4) : '2026';
        $ticketId = "NATAL-UG-{$randomSuffix}-{$npmSuffix}";

        // Format WA number for click-to-chat
        $formattedWa = $cleanWa;
        if (str_starts_with($formattedWa, '0')) {
            $formattedWa = '62' . substr($formattedWa, 1);
        } elseif (!str_starts_with($formattedWa, '62')) {
            $formattedWa = '62' . $formattedWa;
        }

        $regionDisplayName = self::REGION_NAMES[$region] ?? ucfirst($region);

        // Compose official WhatsApp message
        $waMessageText =
            "✨ *TIKET RESMI — NATAL PERSEKUTUAN DOA UNIVERSITAS GUNADARMA 2026* ✨\n" .
            "_\"Merayakan Kasih, Menyalakan Harapan\"_\n\n" .
            "Shalom, *{$fullName}*!\n" .
            "Pendaftaran Ibadah & Perayaan Natal Anda telah *BERHASIL TERKONFIRMASI*.\n\n" .
            "📌 *DETAIL E-TICKET ANDA:*\n" .
            "• Kode Tiket: *{$ticketId}*\n" .
            "• NPM: *{$npm}*\n" .
            "• Email: *{$email}*\n" .
            "• Region Kampus: *{$regionDisplayName}*\n" .
            "• Kakak Komsel: *{$mentorName}*\n" .
            "• Jurusan: *{$faculty}*\n\n" .
            "🗓️ *WAKTU & TEMPAT:*\n" .
            "• Tanggal: Jumat, 18 Desember 2026\n" .
            "• Pukul: 16.30 WIB - Selesai\n" .
            "• Lokasi: Auditorium Kampus Gunadarma\n\n" .
            "_Simpan pesan dan kode tiket ini untuk ditunjukkan saat registrasi ulang di pintu masuk auditorium._\n\n" .
            "Sampai berjumpa dalam sukacita Natal! Tuhan Yesus memberkati. 🙏✨";

        $waDispatchUrl = "https://api.whatsapp.com/send?phone={$formattedWa}&text=" . urlencode($waMessageText);

        $nowStr = Carbon::now()->format('d/m/Y, H.i');

        // Persist to PostgreSQL database
        $record = Registration::create([
            'ticket_id' => $ticketId,
            'full_name' => $fullName,
            'npm' => $npm,
            'email' => $email,
            'whatsapp' => $cleanWa,
            'region' => $region,
            'komsel_status' => $komselStatus,
            'mentor_name' => $mentorName,
            'faculty' => $faculty,
            'session' => $session,
            'registered_at' => $nowStr,
            'is_checked_in' => false,
            'checked_in_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Registrasi berhasil! Tiket resmi telah diterbitkan di database PostgreSQL.',
            'data' => $record->toFrontendArray(),
            'dispatch' => [
                'whatsappUrl' => $waDispatchUrl,
                'whatsappRecipient' => $formattedWa,
                'emailRecipient' => $email,
                'dispatchedAt' => now()->toIso8601String(),
                'emailStatus' => 'sent_simulated',
                'whatsappStatus' => 'ready',
            ],
        ], 201);
    }

    /**
     * PATCH /api/registrations/{ticketId}/checkin
     */
    public function toggleCheckIn($ticketId)
    {
        $record = Registration::where('ticket_id', strtoupper(trim($ticketId)))->first();

        if (!$record) {
            return response()->json(['success' => false, 'message' => 'Tiket tidak ditemukan'], 404);
        }

        $newStatus = !$record->is_checked_in;
        $record->is_checked_in = $newStatus;
        $record->checked_in_at = $newStatus ? now() : null;
        $record->save();

        return response()->json([
            'success' => true,
            'message' => 'Status kehadiran berhasil diubah menjadi: ' . ($newStatus ? 'Hadir' : 'Belum Hadir'),
            'data' => $record->toFrontendArray(),
        ]);
    }

    /**
     * DELETE /api/registrations/{ticketId}
     */
    public function destroy($ticketId)
    {
        $record = Registration::where('ticket_id', strtoupper(trim($ticketId)))->first();

        if (!$record) {
            return response()->json(['success' => false, 'message' => 'Data registrasi tidak ditemukan'], 404);
        }

        $record->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data registrasi berhasil dihapus dari PostgreSQL.',
            'remaining' => Registration::count(),
        ]);
    }

    /**
     * POST /api/admin/login
     */
    public function adminLogin(Request $request)
    {
        $user = trim(strtolower($request->input('username', '')));
        $pass = trim($request->input('password', ''));

        // 1. Verifikasi langsung ke database PostgreSQL (Tabel users)
        $dbUser = \App\Models\User::whereRaw('LOWER(email) = ?', [$user])
            ->orWhereRaw('LOWER(name) = ?', [$user])
            ->first();

        if ($dbUser && \Illuminate\Support\Facades\Hash::check($pass, $dbUser->password)) {
            return response()->json([
                'success' => true,
                'message' => 'Login Admin Berhasil (Terverifikasi di Database PostgreSQL)',
                'token' => 'token_pg_' . time() . '_' . $dbUser->id,
                'admin' => [
                    'id' => $dbUser->id,
                    'username' => $dbUser->name,
                    'email' => $dbUser->email,
                    'role' => 'Event Committee Administrator',
                    'source' => 'PostgreSQL Database',
                ],
            ]);
        }

        // 2. Fallback Master Credentials jika database users belum dikonfigurasi
        $validUser = env('ADMIN_USER', 'admin');
        $validPass = env('ADMIN_PASS', 'natal2026');

        if ($user === strtolower($validUser) && $pass === $validPass) {
            return response()->json([
                'success' => true,
                'message' => 'Login Admin Berhasil (Master Credentials)',
                'token' => 'token_laravel_pg_' . time(),
                'admin' => [
                    'username' => $validUser,
                    'role' => 'Event Committee Administrator',
                    'source' => 'Master Credentials',
                ],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Username atau kata sandi admin salah. Silakan coba lagi.',
        ], 401);
    }

    /**
     * GET /api/export
     */
    public function exportCsv()
    {
        $registrations = Registration::orderBy('id', 'asc')->get();

        $headers = [
            'No',
            'Kode Tiket',
            'Nama Lengkap',
            'NPM',
            'Email',
            'Nomor WhatsApp',
            'Region Kampus',
            'Status Komsel',
            'Nama Kakak Komsel',
            'Jurusan/Fakultas',
            'Status Check-In',
            'Waktu Check-In',
            'Waktu Registrasi',
        ];

        $rows = [];
        foreach ($registrations as $idx => $r) {
            $regionDisplay = self::REGION_NAMES[$r->region] ?? ucfirst($r->region);
            $rows[] = [
                $idx + 1,
                '"' . ($r->ticket_id ?? '') . '"',
                '"' . str_replace('"', '""', $r->full_name ?? '') . '"',
                "'" . ($r->npm ?? ''),
                '"' . ($r->email ?? '') . '"',
                "'" . ($r->whatsapp ?? ''),
                '"' . $regionDisplay . '"',
                '"' . str_replace('"', '""', $r->komsel_status ?? '') . '"',
                '"' . str_replace('"', '""', $r->mentor_name ?? '-') . '"',
                '"' . str_replace('"', '""', $r->faculty ?? '-') . '"',
                $r->is_checked_in ? 'Hadir' : 'Belum Hadir',
                '"' . ($r->checked_in_at ? $r->checked_in_at->format('Y-m-d H:i') : '-') . '"',
                '"' . ($r->registered_at ?? '') . '"',
            ];
        }

        $csvContent = "\xEF\xBB\xBF" . implode(',', $headers) . "\r\n";
        foreach ($rows as $row) {
            $csvContent .= implode(',', $row) . "\r\n";
        }

        return response($csvContent, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="Data_Registrasi_Natal_PD_UG_2026_' . date('Y-m-d') . '.csv"',
        ]);
    }
}
