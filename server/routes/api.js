import express from 'express';
import {
  readRegistrations,
  findRegistrationByTicketId,
  findRegistrationByNpm,
  addRegistration,
  toggleCheckIn,
  deleteRegistration,
  calculateStats,
} from '../db.js';

const router = express.Router();

// Region labels helper
const REGION_NAMES = {
  depok: 'Depok',
  kalimalang: 'Kalimalang',
  karawaci: 'Karawaci',
  cengkareng: 'Cengkareng',
  simatupang: 'Simatupang',
  salemba: 'Salemba',
  alumni_tamu: 'Alumni / Tamu',
};

// ==========================================
// 1. HEALTH & METRICS
// ==========================================
router.get('/health', (req, res) => {
  const stats = calculateStats();
  res.json({
    status: 'ok',
    event: 'Natal Persekutuan Doa Universitas Gunadarma 2026',
    tagline: 'Merayakan Kasih, Menyalakan Harapan',
    serverTime: new Date().toISOString(),
    totalRegistrations: stats.total,
  });
});

router.get('/stats', (req, res) => {
  try {
    const stats = calculateStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 2. REGISTRATIONS CRUD
// ==========================================

// GET /api/registrations (supports query params ?region=...&search=...&checkedIn=...)
router.get('/registrations', (req, res) => {
  try {
    let list = readRegistrations();
    const { search, region, checkedIn } = req.query;

    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (r) =>
          (r.fullName && r.fullName.toLowerCase().includes(q)) ||
          (r.npm && r.npm.includes(q)) ||
          (r.ticketId && r.ticketId.toLowerCase().includes(q)) ||
          (r.email && r.email.toLowerCase().includes(q)) ||
          (r.whatsapp && r.whatsapp.includes(q)) ||
          (r.mentorName && r.mentorName.toLowerCase().includes(q))
      );
    }

    if (region && region !== 'all') {
      list = list.filter((r) => r.region.toLowerCase() === region.toLowerCase());
    }

    if (checkedIn !== undefined && checkedIn !== 'all') {
      const isCheck = checkedIn === 'true';
      list = list.filter((r) => r.isCheckedIn === isCheck);
    }

    res.json({ success: true, total: list.length, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/registrations/:ticketId
router.get('/registrations/:ticketId', (req, res) => {
  try {
    const found = findRegistrationByTicketId(req.params.ticketId);
    if (!found) {
      return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan' });
    }
    res.json({ success: true, data: found });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/register - Public user registration (NO LOGIN REQUIRED)
router.post('/register', (req, res) => {
  try {
    const {
      fullName,
      npm,
      email,
      whatsapp,
      region = 'depok',
      komselStatus,
      mentorName,
      faculty = 'Universitas Gunadarma',
      session = 'Sesi Utama (16.30 WIB - Selesai)',
    } = req.body;

    // Validation rules
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi.' });
    }

    if (!npm || !npm.trim()) {
      return res.status(400).json({ success: false, message: 'NPM wajib diisi.' });
    }

    const cleanNpm = npm.trim();
    if (!/^\d{1,8}$/.test(cleanNpm)) {
      return res.status(400).json({
        success: false,
        message: 'NPM harus berupa angka dan maksimal 8 digit.',
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email wajib diisi.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid. Contoh: nama@gmail.com',
      });
    }

    if (!whatsapp || !whatsapp.trim()) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp wajib diisi.' });
    }

    const cleanWaDigits = whatsapp.replace(/\D/g, '');
    if (cleanWaDigits.length < 9 || cleanWaDigits.length > 13) {
      return res.status(400).json({
        success: false,
        message: 'Nomor WhatsApp harus terdiri dari 9 hingga 13 digit angka.',
      });
    }

    // Auto hyphen logic for Komsel if belum memiliki
    const isBelumPunya =
      komselStatus && komselStatus.toLowerCase().includes('belum memiliki');
    const finalMentorName = isBelumPunya ? '-' : (mentorName ? mentorName.trim() : '-');

    // Generate unique official ticket code
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const npmSuffix = cleanNpm.length >= 4 ? cleanNpm.slice(-4) : '2026';
    const ticketId = `NATAL-UG-${randomSuffix}-${npmSuffix}`;

    // Clean WA for click-to-chat API URL
    let formattedWa = cleanWaDigits;
    if (formattedWa.startsWith('0')) {
      formattedWa = '62' + formattedWa.slice(1);
    } else if (!formattedWa.startsWith('62')) {
      formattedWa = '62' + formattedWa;
    }

    const regionDisplayName = REGION_NAMES[region] || region;

    // Compose official WhatsApp message
    const waMessageText =
      `✨ *TIKET RESMI — NATAL PERSEKUTUAN DOA UNIVERSITAS GUNADARMA 2026* ✨\n` +
      `_"Merayakan Kasih, Menyalakan Harapan"_\n\n` +
      `Shalom, *${fullName.trim()}*!\n` +
      `Pendaftaran Ibadah & Perayaan Natal Anda telah *BERHASIL TERKONFIRMASI*.\n\n` +
      `📌 *DETAIL E-TICKET ANDA:*\n` +
      `• Kode Tiket: *${ticketId}*\n` +
      `• NPM: *${cleanNpm}*\n` +
      `• Email: *${email.trim()}*\n` +
      `• Region Kampus: *${regionDisplayName}*\n` +
      `• Kakak Komsel: *${finalMentorName}*\n` +
      `• Jurusan: *${faculty.trim() || 'Universitas Gunadarma'}*\n\n` +
      `🗓️ *WAKTU & TEMPAT:*\n` +
      `• Tanggal: Jumat, 18 Desember 2026\n` +
      `• Pukul: 16.30 WIB - Selesai\n` +
      `• Lokasi: Auditorium Kampus Gunadarma\n\n` +
      `_Simpan pesan dan kode tiket ini untuk ditunjukkan saat registrasi ulang di pintu masuk auditorium._\n\n` +
      `Sampai berjumpa dalam sukacita Natal! Tuhan Yesus memberkati. 🙏✨`;

    const waDispatchUrl = `https://api.whatsapp.com/send?phone=${formattedWa}&text=${encodeURIComponent(
      waMessageText
    )}`;

    // Save registration
    const newRecord = addRegistration({
      ticketId,
      fullName: fullName.trim(),
      npm: cleanNpm,
      email: email.trim(),
      whatsapp: cleanWaDigits,
      region,
      komselStatus: komselStatus || 'Sudah memiliki Komsel',
      mentorName: finalMentorName,
      faculty: faculty.trim() || 'Universitas Gunadarma',
      session,
    });

    console.log(`[Registration] New participant registered: ${newRecord.fullName} (${ticketId})`);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Tiket resmi telah diterbitkan.',
      data: newRecord,
      dispatch: {
        whatsappUrl: waDispatchUrl,
        whatsappRecipient: formattedWa,
        emailRecipient: email.trim(),
        dispatchedAt: new Date().toISOString(),
        emailStatus: 'sent_simulated',
        whatsappStatus: 'ready',
      },
    });
  } catch (error) {
    console.error('[Registration Error]', error);
    res.status(500).json({ success: false, message: 'Gagal memproses pendaftaran: ' + error.message });
  }
});

// PATCH /api/registrations/:ticketId/checkin
router.patch('/registrations/:ticketId/checkin', (req, res) => {
  try {
    const { ticketId } = req.params;
    const { updatedList, item } = toggleCheckIn(ticketId);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan' });
    }

    console.log(
      `[CheckIn] Ticket ${ticketId} check-in status toggled to: ${item.isCheckedIn ? 'HADIR' : 'BELUM HADIR'}`
    );

    res.json({
      success: true,
      message: `Status kehadiran berhasil diubah menjadi: ${item.isCheckedIn ? 'Hadir' : 'Belum Hadir'}`,
      data: item,
      totalCount: updatedList.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/registrations/:ticketId
router.delete('/registrations/:ticketId', (req, res) => {
  try {
    const { ticketId } = req.params;
    const { success, updatedList } = deleteRegistration(ticketId);

    if (!success) {
      return res.status(404).json({ success: false, message: 'Data registrasi tidak ditemukan' });
    }

    console.log(`[Delete] Registration ${ticketId} removed by admin.`);
    res.json({
      success: true,
      message: 'Data registrasi berhasil dihapus.',
      remaining: updatedList.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 3. ADMIN AUTHENTICATION
// ==========================================
router.post('/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;

    const ADMIN_USER = process.env.ADMIN_USER || 'admin';
    const ADMIN_PASS = process.env.ADMIN_PASS || 'natal2026';

    if (
      username &&
      password &&
      username.trim().toLowerCase() === ADMIN_USER.toLowerCase() &&
      password.trim() === ADMIN_PASS
    ) {
      const token = `token_natal_ug_admin_${Date.now()}`;
      return res.json({
        success: true,
        message: 'Login Admin Berhasil',
        token,
        admin: {
          username: ADMIN_USER,
          role: 'Event Committee Administrator',
        },
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Username atau kata sandi admin salah. Silakan coba lagi.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 4. CSV EXPORT ENDPOINT
// ==========================================
router.get('/export', (req, res) => {
  try {
    const registrations = readRegistrations();

    const headers = [
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

    const rows = registrations.map((r, idx) => [
      idx + 1,
      `"${r.ticketId || ''}"`,
      `"${(r.fullName || '').replace(/"/g, '""')}"`,
      `'${r.npm || ''}`,
      `"${r.email || ''}"`,
      `'${r.whatsapp || ''}`,
      `"${REGION_NAMES[r.region] || r.region || ''}"`,
      `"${(r.komselStatus || '').replace(/"/g, '""')}"`,
      `"${(r.mentorName || '-').replace(/"/g, '""')}"`,
      `"${(r.faculty || '-').replace(/"/g, '""')}"`,
      r.isCheckedIn ? 'Hadir' : 'Belum Hadir',
      `"${r.checkedInAt || '-'}"`,
      `"${r.registeredAt || ''}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Data_Registrasi_Natal_PD_UG_2026_${new Date().toISOString().slice(0, 10)}.csv`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Catch-all for undefined /api routes
router.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint API tidak ditemukan' });
});

export default router;
