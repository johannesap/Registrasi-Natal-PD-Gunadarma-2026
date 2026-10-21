import crypto from 'node:crypto';
import express from 'express';
import bcrypt from 'bcryptjs';
import { regionName } from '../../src/utils/regions.js';
import { EVENT } from '../../src/utils/event.js';
import { intlPhone } from '../../src/utils/phone.js';
import {
  listRegistrations,
  findExistingRegistration,
  addRegistration,
  setCheckIn,
  deleteRegistration,
  countRegistrations,
  findAdminUser,
} from '../db.js';

const router = express.Router();

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
// 1. HEALTH
// ==========================================
router.get('/health', async (req, res) => {
  res.json({
    status: 'ok',
    database: 'MongoDB Atlas',
    event: 'Natal Persekutuan Doa Universitas Gunadarma 2026',
    serverTime: new Date().toISOString(),
    totalRegistrations: await countRegistrations(),
  });
});

// ==========================================
// 2. REGISTRATIONS
// ==========================================

// GET /api/registrations - all participants (admin)
router.get('/registrations', requireAdmin, async (req, res) => {
  const list = await listRegistrations();
  res.json({ success: true, total: list.length, data: list });
});

// Click-to-chat link that opens WhatsApp with the ticket message for the participant's own number
function whatsappLink(r) {
  const phone = intlPhone(r.whatsapp);

  const text =
    `✨ *TIKET RESMI — NATAL PERSEKUTUAN DOA UNIVERSITAS GUNADARMA 2026* ✨\n` +
    `_"Merayakan Kasih, Menyalakan Harapan"_\n\n` +
    `Shalom, *${r.fullName}*!\n` +
    `Pendaftaran Ibadah & Perayaan Natal Anda telah *BERHASIL TERKONFIRMASI*.\n\n` +
    `📌 *DETAIL E-TICKET ANDA:*\n` +
    `• Kode Tiket: *${r.ticketId}*\n` +
    `• NPM: *${r.npm}*\n` +
    `• Email: *${r.email}*\n` +
    `• Region Kampus: *${regionName(r.region)}*\n` +
    `• Kakak Komsel: *${r.mentorName}*\n` +
    `• Jurusan: *${r.faculty}*\n\n` +
    `🗓️ *WAKTU & TEMPAT:*\n` +
    `• Tanggal: ${EVENT.date}\n` +
    `• Pukul: ${EVENT.time}\n` +
    `• Lokasi: ${EVENT.venue}\n\n` +
    `_Simpan pesan dan kode tiket ini untuk ditunjukkan saat registrasi ulang di pintu masuk auditorium._\n\n` +
    `Sampai berjumpa dalam sukacita Natal! Tuhan Yesus memberkati. 🙏✨`;

  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
}

// POST /api/register - Public user registration (NO LOGIN REQUIRED)
router.post('/register', async (req, res) => {
  const body = req.body || {};
  const fullName = str(body.fullName);
  const npm = str(body.npm);
  const email = str(body.email);
  const whatsapp = str(body.whatsapp).replace(/\D/g, '');
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
  if (whatsapp.length < 9 || whatsapp.length > 13) {
    return fail('Nomor WhatsApp harus terdiri dari 9 hingga 13 digit angka.');
  }

  const textFields = [fullName, email, region, komselStatus, str(body.mentorName), faculty, session];
  if (textFields.some((v) => v.length > 150)) return fail('Isian terlalu panjang (maksimal 150 karakter).');

  // ponytail: check-then-insert; two submits in the same instant can still both insert. Fine with the
  // submit button disabled while sending; add a unique {npm, email} index if duplicates still show up.
  const existing = await findExistingRegistration(npm, email);
  if (existing) {
    // NPM and email are not secret: only hand back the ticket (and phone number) to someone who also knows the phone
    if (intlPhone(existing.whatsapp) !== intlPhone(whatsapp)) {
      return res.status(409).json({
        success: false,
        message: 'NPM dan email ini sudah terdaftar dengan nomor WhatsApp lain. Hubungi panitia.',
      });
    }
    return res.json({
      success: true,
      alreadyRegistered: true,
      message: 'Anda sudah terdaftar sebelumnya. Ini tiket Anda.',
      data: existing,
      dispatch: { whatsappUrl: whatsappLink(existing) },
    });
  }

  // Auto hyphen logic for Komsel if belum memiliki
  const isBelumPunya = komselStatus.toLowerCase().includes('belum memiliki');
  const mentorName = isBelumPunya ? '-' : str(body.mentorName) || '-';

  // Ticket code; the unique index rejects the rare collision, and the user simply submits again
  const randomSuffix = crypto.randomInt(1000, 10000);
  const npmSuffix = npm.length >= 4 ? npm.slice(-4) : '2026';
  const ticketId = `NATAL-UG-${randomSuffix}-${npmSuffix}`;

  const record = await addRegistration({
    ticketId,
    fullName,
    npm,
    email,
    whatsapp,
    region,
    komselStatus,
    mentorName,
    faculty,
    session,
  });

  console.log(`[Registration] New participant registered: ${ticketId}`);

  res.status(201).json({
    success: true,
    message: 'Registrasi berhasil! Tiket resmi telah diterbitkan.',
    data: record,
    dispatch: { whatsappUrl: whatsappLink(record) },
  });
});

// PATCH /api/registrations/:ticketId/checkin  body: { checkedIn: true|false }
router.patch('/registrations/:ticketId/checkin', requireAdmin, async (req, res) => {
  const checkedIn = req.body?.checkedIn;
  if (typeof checkedIn !== 'boolean') {
    return res.status(422).json({ success: false, message: 'checkedIn harus true atau false.' });
  }

  const item = await setCheckIn(req.params.ticketId, checkedIn);
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
  if (!(await deleteRegistration(req.params.ticketId))) {
    return res.status(404).json({ success: false, message: 'Data registrasi tidak ditemukan' });
  }

  res.json({ success: true, message: 'Data registrasi berhasil dihapus.' });
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

  // Hashes written by PHP start with $2y$, which is the same algorithm as $2b$
  if (user && (await bcrypt.compare(password, String(user.password).replace(/^\$2y\$/, '$2b$')))) {
    return res.json({
      success: true,
      message: 'Login Admin Berhasil',
      token: issueToken(user.name),
      admin: { username: user.name, email: user.email },
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Username atau kata sandi admin salah. Silakan coba lagi.',
  });
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
