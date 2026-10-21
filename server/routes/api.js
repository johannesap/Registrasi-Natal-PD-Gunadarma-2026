import crypto from 'node:crypto';
import express from 'express';
import bcrypt from 'bcryptjs';
import {
  listRegistrations,
  findRegistration,
  addRegistration,
  toggleCheckIn,
  deleteRegistration,
  countRegistrations,
  calculateStats,
  findAdminUser,
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

const str = (v) => (typeof v === 'string' ? v.trim() : '');

// ==========================================
// 0. ADMIN TOKEN (HMAC-signed, stateless for serverless)
// ==========================================
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

const sign = (payload) =>
  crypto.createHmac('sha256', process.env.ADMIN_TOKEN_SECRET).update(payload).digest('base64url');

function issueToken(username) {
  const payload = Buffer.from(JSON.stringify({ u: username, exp: Date.now() + TOKEN_TTL_MS })).toString(
    'base64url'
  );
  return `${payload}.${sign(payload)}`;
}

function requireAdmin(req, res, next) {
  const [payload, sig] = (req.get('authorization') || '').replace(/^Bearer\s+/i, '').split('.');
  let valid = false;
  if (process.env.ADMIN_TOKEN_SECRET && payload && sig) {
    const expected = Buffer.from(sign(payload));
    const given = Buffer.from(sig);
    valid =
      expected.length === given.length &&
      crypto.timingSafeEqual(expected, given) &&
      JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
  }
  if (!valid) {
    return res.status(401).json({
      success: false,
      message: 'Sesi admin tidak valid atau sudah berakhir. Silakan login ulang.',
    });
  }
  next();
}

// ==========================================
// 1. HEALTH & METRICS
// ==========================================
router.get('/health', async (req, res) => {
  res.json({
    status: 'ok',
    database: 'MongoDB Atlas',
    event: 'Natal Persekutuan Doa Universitas Gunadarma 2026',
    tagline: 'Merayakan Kasih, Menyalakan Harapan',
    serverTime: new Date().toISOString(),
    totalRegistrations: await countRegistrations(),
  });
});

router.get('/stats', requireAdmin, async (req, res) => {
  res.json({ success: true, data: await calculateStats() });
});

// ==========================================
// 2. REGISTRATIONS CRUD
// ==========================================

// GET /api/registrations (supports query params ?region=...&search=...&checkedIn=...)
router.get('/registrations', requireAdmin, async (req, res) => {
  const list = await listRegistrations(req.query);
  res.json({ success: true, total: list.length, data: list });
});

// GET /api/registrations/:ticketId (ticket code or NPM)
router.get('/registrations/:ticketId', requireAdmin, async (req, res) => {
  const found = await findRegistration(req.params.ticketId);
  if (!found) {
    return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan' });
  }
  res.json({ success: true, data: found });
});

// POST /api/register - Public user registration (NO LOGIN REQUIRED)
router.post('/register', async (req, res) => {
  const body = req.body || {};
  const fullName = str(body.fullName);
  const npm = str(body.npm);
  const email = str(body.email);
  const whatsapp = str(body.whatsapp);
  const region = (str(body.region) || 'depok').toLowerCase();
  const komselStatus = str(body.komselStatus) || 'Sudah memiliki Komsel';
  const faculty = str(body.faculty) || 'Universitas Gunadarma';
  const session = str(body.session) || 'Sesi Utama (16.30 WIB - Selesai)';

  const fail = (message) => res.status(422).json({ success: false, message });

  // Validation rules
  if (!fullName) return fail('Nama lengkap wajib diisi.');
  if (!npm) return fail('NPM wajib diisi.');
  if (!/^\d{1,8}$/.test(npm)) return fail('NPM harus berupa angka dan maksimal 8 digit.');
  if (!email) return fail('Email wajib diisi.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail('Format email tidak valid. Contoh: nama@gmail.com');
  }
  if (!whatsapp) return fail('Nomor WhatsApp wajib diisi.');

  const cleanWaDigits = whatsapp.replace(/\D/g, '');
  if (cleanWaDigits.length < 9 || cleanWaDigits.length > 13) {
    return fail('Nomor WhatsApp harus terdiri dari 9 hingga 13 digit angka.');
  }

  const textFields = [fullName, email, region, komselStatus, str(body.mentorName), faculty, session];
  if (textFields.some((v) => v.length > 150)) return fail('Isian terlalu panjang (maksimal 150 karakter).');

  // Auto hyphen logic for Komsel if belum memiliki
  const isBelumPunya = komselStatus.toLowerCase().includes('belum memiliki');
  const finalMentorName = isBelumPunya ? '-' : str(body.mentorName) || '-';

  // Generate unique official ticket code
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const npmSuffix = npm.length >= 4 ? npm.slice(-4) : '2026';
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
    `Shalom, *${fullName}*!\n` +
    `Pendaftaran Ibadah & Perayaan Natal Anda telah *BERHASIL TERKONFIRMASI*.\n\n` +
    `📌 *DETAIL E-TICKET ANDA:*\n` +
    `• Kode Tiket: *${ticketId}*\n` +
    `• NPM: *${npm}*\n` +
    `• Email: *${email}*\n` +
    `• Region Kampus: *${regionDisplayName}*\n` +
    `• Kakak Komsel: *${finalMentorName}*\n` +
    `• Jurusan: *${faculty}*\n\n` +
    `🗓️ *WAKTU & TEMPAT:*\n` +
    `• Tanggal: Jumat, 18 Desember 2026\n` +
    `• Pukul: 16.30 WIB - Selesai\n` +
    `• Lokasi: Auditorium Kampus Gunadarma\n\n` +
    `_Simpan pesan dan kode tiket ini untuk ditunjukkan saat registrasi ulang di pintu masuk auditorium._\n\n` +
    `Sampai berjumpa dalam sukacita Natal! Tuhan Yesus memberkati. 🙏✨`;

  const waDispatchUrl = `https://api.whatsapp.com/send?phone=${formattedWa}&text=${encodeURIComponent(
    waMessageText
  )}`;

  const newRecord = await addRegistration({
    ticketId,
    fullName,
    npm,
    email,
    whatsapp: cleanWaDigits,
    region,
    komselStatus,
    mentorName: finalMentorName,
    faculty,
    session,
  });

  console.log(`[Registration] New participant registered: ${ticketId}`);

  res.status(201).json({
    success: true,
    message: 'Registrasi berhasil! Tiket resmi telah diterbitkan di database MongoDB.',
    data: newRecord,
    dispatch: {
      whatsappUrl: waDispatchUrl,
      whatsappRecipient: formattedWa,
      emailRecipient: email,
      dispatchedAt: new Date().toISOString(),
      emailStatus: 'sent_simulated',
      whatsappStatus: 'ready',
    },
  });
});

// PATCH /api/registrations/:ticketId/checkin
router.patch('/registrations/:ticketId/checkin', requireAdmin, async (req, res) => {
  const item = await toggleCheckIn(req.params.ticketId);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan' });
  }

  res.json({
    success: true,
    message: `Status kehadiran berhasil diubah menjadi: ${item.isCheckedIn ? 'Hadir' : 'Belum Hadir'}`,
    data: item,
  });
});

// DELETE /api/registrations/:ticketId
router.delete('/registrations/:ticketId', requireAdmin, async (req, res) => {
  const { success, remaining } = await deleteRegistration(req.params.ticketId);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Data registrasi tidak ditemukan' });
  }

  res.json({ success: true, message: 'Data registrasi berhasil dihapus dari MongoDB.', remaining });
});

// ==========================================
// 3. ADMIN AUTHENTICATION
// ==========================================
router.post('/admin/login', async (req, res) => {
  if (!process.env.ADMIN_TOKEN_SECRET) {
    return res.status(500).json({ success: false, message: 'Server belum dikonfigurasi (ADMIN_TOKEN_SECRET).' });
  }

  const login = str(req.body?.username).toLowerCase();
  const password = str(req.body?.password);
  const user = login && password ? await findAdminUser(login) : null;

  // PHP writes bcrypt hashes as $2y$, which is the same algorithm as $2b$
  if (user && (await bcrypt.compare(password, String(user.password).replace(/^\$2y\$/, '$2b$')))) {
    return res.json({
      success: true,
      message: 'Login Admin Berhasil (Terverifikasi di Database MongoDB)',
      token: issueToken(user.name),
      admin: {
        id: String(user._id),
        username: user.name,
        email: user.email,
        role: 'Event Committee Administrator',
        source: 'MongoDB Database',
      },
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Username atau kata sandi admin salah. Silakan coba lagi.',
  });
});

// ==========================================
// 4. CSV EXPORT ENDPOINT
// ==========================================
router.get('/export', requireAdmin, async (req, res) => {
  const registrations = await listRegistrations({}, 1);

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
    '﻿' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=Data_Registrasi_Natal_PD_UG_2026_${new Date().toISOString().slice(0, 10)}.csv`
  );
  res.status(200).send(csvContent);
});

// Catch-all for undefined /api routes
router.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint API tidak ditemukan' });
});

// Express 5 forwards rejected async handlers here
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  console.error('[API Error]', err);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server. Silakan coba lagi.' });
});

export default router;
