import crypto from 'node:crypto';
import express from 'express';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { CAMPUS_REGIONS, regionName } from '../../src/utils/regions.js';
import {
  EVENT,
  GENDERS,
  STATUSES,
  STUDENT_STATUS,
  DEPARTURES,
  MEETING_POINTS,
  KOMSEL_OPTIONS,
  WHATSAPP_GROUP_URL,
} from '../../src/utils/event.js';
import { intlPhone } from '../../src/utils/phone.js';
import {
  listRegistrations,
  findExistingRegistration,
  addRegistration,
  setCheckIn,
  deleteRegistration,
  countRegistrations,
  findAdminUser,
  listUsers,
  findUserById,
  userConflict,
  createUser,
  updateUser,
  deleteUser,
  countAdmins,
  countAttempt,
  attempts,
  clearAttempts,
  addAuditLog,
  listAuditLogs,
} from '../db.js';

const router = express.Router();

const str = (v) => (typeof v === 'string' ? v.trim() : '');

// The visitor's address, for the attempt limits and the audit log. Vercel puts it in x-real-ip (overwriting anything the
// visitor sends; the tests send it too). Behind another proxy server/start.js sets TRUST_PROXY and Express reads it from
// that proxy's X-Forwarded-For instead.
const clientIp = (req) => (process.env.TRUST_PROXY ? req.ip : req.get('x-real-ip')) || req.socket.remoteAddress;

// One audit log line for an action a panitia account took (or tried, for a failed login)
const audit = (req, user, action, entity, detail = '') =>
  addAuditLog({ user, action, entity, detail, ip: clientIp(req) });

// ==========================================
// 0. ADMIN TOKEN (HMAC-signed, stateless for serverless)
// ==========================================
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

const sign = (payload) =>
  crypto.createHmac('sha256', process.env.ADMIN_TOKEN_SECRET).update(payload).digest('base64url');

// admin: manages accounts only. sekretariat: manages registrations only.
const ROLES = ['admin', 'sekretariat'];

function issueToken(user) {
  // r only tells the browser which screen to show; the server re-reads the role from the database
  const now = Date.now();
  const payload = Buffer.from(
    JSON.stringify({ u: user.name, r: user.role, iat: now, exp: now + TOKEN_TTL_MS })
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

// Hashes written by PHP start with $2y$, which is the same algorithm as $2b$
const passwordMatches = (user, password) =>
  bcrypt.compare(password, String(user.password).replace(/^\$2y\$/, '$2b$'));

// Valid token AND the account still exists with one of these roles, so deleting or demoting an account takes effect at once
const requireRole = (...roles) => async (req, res, next) => {
  const [payload, sig] = (req.get('authorization') || '').replace(/^Bearer\s+/i, '').split('.');
  let claims = null;
  if (process.env.ADMIN_TOKEN_SECRET && payload && sig) {
    const expected = Buffer.from(sign(payload));
    const given = Buffer.from(sig);
    if (expected.length === given.length && crypto.timingSafeEqual(expected, given)) {
      claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    }
  }
  let user = claims && claims.exp > Date.now() ? await findAdminUser(claims.u) : null;
  // A password change ends every session that started before it
  if (user?.password_changed_at && (claims.iat || 0) < user.password_changed_at.getTime()) user = null;
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Sesi tidak valid atau sudah berakhir. Silakan login ulang.',
    });
  }
  if (!roles.includes(user.role)) {
    return res.status(403).json({ success: false, message: 'Akun ini tidak punya akses ke fitur ini.' });
  }
  req.user = user;
  next();
};

const sekretariatOnly = requireRole('sekretariat');
const adminOnly = requireRole('admin');
const anyRole = requireRole(...ROLES);

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
    // The address the limits see for you: after deploying, two different networks must show two different addresses
    yourIp: clientIp(req),
  });
});

// ==========================================
// 2. REGISTRATIONS
// ==========================================

// GET /api/registrations - all participants (admin)
router.get('/registrations', sekretariatOnly, async (req, res) => {
  const list = await listRegistrations();
  res.json({ success: true, total: list.length, data: list });
});

// Only real ticket codes, so this cannot be used to put arbitrary QR codes (e.g. phishing links) on our domain
const TICKET_CODE = /^NATAL-UG-\d{4}-\d{4}$/;

// GET /api/tickets/:ticketId/qr.png - the check-in QR as an image, linked from the WhatsApp message
router.get('/tickets/:ticketId/qr.png', async (req, res) => {
  const code = req.params.ticketId.trim().toUpperCase();
  if (!TICKET_CODE.test(code)) return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan' });
  res.type('png').set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(await QRCode.toBuffer(code, { margin: 2, width: 480 }));
});

// Click-to-chat link that opens WhatsApp with the ticket message for the participant's own number
function whatsappLink(r, siteUrl) {
  const phone = intlPhone(r.whatsapp);

  const text =
    `✨ *TIKET RESMI — NATAL PERSEKUTUAN DOA UNIVERSITAS GUNADARMA 2026* ✨\n` +
    `_"${EVENT.theme}" — ${EVENT.verseRef}_\n\n` +
    `Shalom, *${r.fullName}*!\n` +
    `Pendaftaran Ibadah & Perayaan Natal Anda telah *BERHASIL TERKONFIRMASI*.\n\n` +
    `📌 *DETAIL E-TICKET ANDA:*\n` +
    `• Kode Tiket: *${r.ticketId}*\n` +
    `• Jenis Kelamin: *${r.gender}*\n` +
    `• Status: *${r.status}*\n` +
    `• Region Kampus: *${regionName(r.region)}*\n` +
    `• Kakak Komsel: *${r.mentorName}*\n` +
    `• Jurusan: *${r.faculty}*\n` +
    `• Keberangkatan: *${r.departure}${r.departureArea !== '-' ? ` (${r.departureArea})` : ''}*\n\n` +
    (MEETING_POINTS[r.departureArea]
      ? `🚌 *TITIK KUMPUL KEBERANGKATAN ${r.departureArea.toUpperCase()}:*\n${MEETING_POINTS[r.departureArea]}\n\n`
      : '') +
    (WHATSAPP_GROUP_URL ? `👥 *GABUNG GRUP WHATSAPP PESERTA:*\n${WHATSAPP_GROUP_URL}\n\n` : '') +
    `🔳 *QR CHECK-IN* (buka & tunjukkan di pintu masuk):\n` +
    `${siteUrl}/api/tickets/${encodeURIComponent(r.ticketId)}/qr.png\n\n` +
    `🗓️ *WAKTU & TEMPAT:*\n` +
    `• Tanggal: ${EVENT.date}\n` +
    `• Pukul: ${EVENT.time}\n` +
    `• Lokasi: ${EVENT.venue}\n` +
    `• Peta: ${EVENT.mapUrl}\n\n` +
    `_Simpan pesan ini dan tunjukkan QR check-in di atas saat registrasi ulang di pintu masuk._\n\n` +
    `Sampai berjumpa dalam sukacita Natal! Tuhan Yesus memberkati. 🙏✨`;

  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
}

// POST /api/register - Public user registration (NO LOGIN REQUIRED)
// Every attempt counts (also rejected ones), per network. Loose, because a room of students can share one Wi-Fi.
const REGISTER_MAX = 20;
const REGISTER_WINDOW_MS = 60 * 1000;

router.post('/register', async (req, res) => {
  if ((await countAttempt(`register:${clientIp(req)}`, REGISTER_MAX, REGISTER_WINDOW_MS)) > REGISTER_MAX) {
    return res.status(429).json({
      success: false,
      message: 'Terlalu banyak pendaftaran dari jaringan ini. Tunggu 1 menit lalu coba lagi.',
    });
  }

  const body = req.body || {};
  const fullName = str(body.fullName);
  const gender = str(body.gender);
  const departure = str(body.departure);
  // Only "Bersama" picks a meeting point; "Pribadi" is always '-'
  const departureArea = departure === 'Bersama' ? str(body.departureArea) : '-';
  const status = str(body.status);
  const whatsapp = str(body.whatsapp).replace(/\D/g, '');
  // Only Gunadarma students pick a campus region; everyone else is '-'
  const region = status === STUDENT_STATUS ? str(body.region).toLowerCase() : '-';
  const komselStatus = str(body.komselStatus);
  const faculty = str(body.faculty) || '-';

  const fail = (message) => res.status(422).json({ success: false, message });

  // The site the browser registered on (sent as Origin with the POST); the QR image link in WhatsApp points there
  const origin = req.get('origin');
  const siteUrl = /^https?:\/\//.test(origin) ? origin : `https://${req.get('host')}`;

  // Validation rules
  if (!fullName) return fail('Nama lengkap wajib diisi.');
  if (!GENDERS.includes(gender)) return fail('Pilih jenis kelamin.');
  if (!KOMSEL_OPTIONS.includes(komselStatus)) return fail('Pilih status Komsel.');
  if (!DEPARTURES.includes(departure)) return fail('Pilih opsi keberangkatan (Pribadi / Bersama).');
  if (departure === 'Bersama' && !MEETING_POINTS[departureArea]) return fail('Pilih area keberangkatan.');
  if (!STATUSES.includes(status)) return fail('Pilih status.');
  if (status === STUDENT_STATUS && !CAMPUS_REGIONS.some((r) => r.id === region)) return fail('Pilih region kampus.');
  if (!whatsapp) return fail('Nomor WhatsApp wajib diisi.');
  if (whatsapp.length < 9 || whatsapp.length > 13) {
    return fail('Nomor WhatsApp harus terdiri dari 9 hingga 13 digit angka.');
  }

  const textFields = [fullName, str(body.mentorName), faculty];
  if (textFields.some((v) => v.length > 150)) return fail('Isian terlalu panjang (maksimal 150 karakter).');

  // ponytail: check-then-insert; two submits in the same instant can still both insert. Fine with the
  // submit button disabled while sending; add a unique whatsapp index if duplicates still show up.
  const existing = await findExistingRegistration(whatsapp);
  if (existing) {
    // A phone number is not secret: only hand back the ticket to someone who also types the same name
    const sameName = (a, b) => a.toLowerCase().replace(/\s+/g, ' ') === b.toLowerCase().replace(/\s+/g, ' ');
    if (!sameName(existing.fullName, fullName)) {
      return res.status(409).json({
        success: false,
        message: 'Nomor WhatsApp ini sudah terdaftar atas nama lain. Hubungi panitia.',
      });
    }
    return res.json({
      success: true,
      alreadyRegistered: true,
      message: 'Anda sudah terdaftar sebelumnya. Ini tiket Anda.',
      data: existing,
      dispatch: { whatsappUrl: whatsappLink(existing, siteUrl) },
    });
  }

  // Auto hyphen logic for Komsel if belum memiliki
  const isBelumPunya = komselStatus.toLowerCase().includes('belum memiliki');
  const mentorName = isBelumPunya ? '-' : str(body.mentorName) || '-';

  // Ticket code; the unique index rejects the rare collision, and the user simply submits again
  const randomSuffix = crypto.randomInt(1000, 10000);
  const ticketId = `NATAL-UG-${randomSuffix}-${whatsapp.slice(-4)}`;

  const record = await addRegistration({
    ticketId,
    fullName,
    gender,
    status,
    whatsapp,
    region,
    komselStatus,
    mentorName,
    faculty,
    departure,
    departureArea,
  });

  console.log(`[Registration] New participant registered: ${ticketId}`);

  res.status(201).json({
    success: true,
    message: 'Registrasi berhasil! Tiket resmi telah diterbitkan.',
    data: record,
    dispatch: { whatsappUrl: whatsappLink(record, siteUrl) },
  });
});

// PATCH /api/registrations/:ticketId/checkin  body: { checkedIn: true|false }
router.patch('/registrations/:ticketId/checkin', sekretariatOnly, async (req, res) => {
  const checkedIn = req.body?.checkedIn;
  if (typeof checkedIn !== 'boolean') {
    return res.status(422).json({ success: false, message: 'checkedIn harus true atau false.' });
  }

  const item = await setCheckIn(req.params.ticketId, checkedIn);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan' });
  }
  await audit(req, req.user.name, checkedIn ? 'CHECK-IN' : 'BATAL CHECK-IN', 'peserta', `${item.ticketId} — ${item.fullName}`);

  res.json({
    success: true,
    message: `Status kehadiran berhasil diubah menjadi: ${item.isCheckedIn ? 'Hadir' : 'Belum Hadir'}`,
    data: item,
  });
});

// DELETE /api/registrations/:ticketId
router.delete('/registrations/:ticketId', sekretariatOnly, async (req, res) => {
  const gone = await deleteRegistration(req.params.ticketId);
  if (!gone) {
    return res.status(404).json({ success: false, message: 'Data registrasi tidak ditemukan' });
  }
  await audit(req, req.user.name, 'HAPUS', 'peserta', `${gone.ticketId} — ${gone.fullName}`);

  res.json({ success: true, message: 'Data registrasi berhasil dihapus.' });
});

// ==========================================
// 3. ADMIN AUTHENTICATION
// ==========================================

// 5 wrong passwords in a row, then this network is refused for that username for 5 minutes
const LOGIN_MAX_FAILS = 5;
const LOGIN_BLOCK_MS = 5 * 60 * 1000;

router.post('/admin/login', async (req, res) => {
  if (!process.env.ADMIN_TOKEN_SECRET) {
    return res.status(500).json({ success: false, message: 'Server belum dikonfigurasi (ADMIN_TOKEN_SECRET).' });
  }

  const login = str(req.body?.username).toLowerCase();
  const password = str(req.body?.password);
  // Usernames are at most 40 characters and emails 150; longer is refused before it becomes a stored counter key,
  // so nobody can fill the database with huge made-up usernames
  if (login.length > 150) {
    return res.status(401).json({ success: false, message: 'Username atau kata sandi salah. Silakan coba lagi.' });
  }

  // Per network AND username: guessing is slowed down, but nobody elsewhere can lock out the real panitia
  const attemptKey = `login:${clientIp(req)}:${login}`;
  const blocked = () =>
    res.status(429).json({
      success: false,
      message: `Terlalu banyak percobaan login yang salah. Coba lagi dalam ${LOGIN_BLOCK_MS / 60000} menit.`,
    });
  if ((await attempts(attemptKey)) >= LOGIN_MAX_FAILS) return blocked();

  const user = login && password ? await findAdminUser(login) : null;

  if (user && (await passwordMatches(user, password))) {
    if (!ROLES.includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Akun ini belum punya peran. Hubungi admin.' });
    }
    await clearAttempts(attemptKey);
    await audit(req, user.name, 'LOGIN', 'pengguna');
    return res.json({
      success: true,
      message: 'Login berhasil',
      token: issueToken(user),
      admin: { username: user.name, email: user.email, role: user.role },
    });
  }

  // Only for real accounts: guesses at made-up names would just flood the log
  if (user) await audit(req, user.name, 'LOGIN GAGAL', 'pengguna');
  if ((await countAttempt(attemptKey, LOGIN_MAX_FAILS, LOGIN_BLOCK_MS)) >= LOGIN_MAX_FAILS) return blocked();
  return res.status(401).json({
    success: false,
    message: 'Username atau kata sandi salah. Silakan coba lagi.',
  });
});

// POST /api/me/password  body: { currentPassword, newPassword } - change your own password
router.post('/me/password', anyRole, async (req, res) => {
  const current = str(req.body?.currentPassword);
  const next = str(req.body?.newPassword);
  // 422, not 401: a wrong old password must not log the user out
  if (!(await passwordMatches(req.user, current))) {
    return res.status(422).json({ success: false, message: 'Password lama salah.' });
  }
  if (next.length < 8 || next.length > 72) {
    return res.status(422).json({ success: false, message: 'Password baru harus 8–72 karakter.' });
  }
  if (next === current) {
    return res.status(422).json({ success: false, message: 'Password baru harus berbeda dari password lama.' });
  }

  await updateUser(String(req.user._id), {
    password: await bcrypt.hash(next, 12),
    password_changed_at: new Date(),
  });
  await audit(req, req.user.name, 'GANTI PASSWORD', 'pengguna');
  // Other sessions of this account end now; this one continues with a fresh token
  res.json({ success: true, message: 'Password berhasil diganti.', token: issueToken(req.user) });
});

// POST /api/logout - only records the logout: tokens are stateless, the browser forgets its own
router.post('/logout', anyRole, async (req, res) => {
  await audit(req, req.user.name, 'LOGOUT', 'pengguna');
  res.json({ success: true });
});

// GET /api/audit-logs - newest first (admin)
router.get('/audit-logs', adminOnly, async (req, res) => {
  res.json({ success: true, data: await listAuditLogs() });
});

// ==========================================
// 4. ACCOUNTS (admin only)
// ==========================================

// Validated account fields from a form; the password is required only when creating
function readUser(body, creating) {
  const name = str(body?.name).toLowerCase();
  const email = str(body?.email);
  const role = str(body?.role);
  const password = str(body?.password);

  if (!/^[a-z0-9._-]{3,40}$/.test(name)) {
    return { error: 'Username 3–40 karakter: huruf kecil, angka, titik, minus, atau garis bawah.' };
  }
  if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Format email tidak valid.' };
  if (!ROLES.includes(role)) return { error: 'Peran harus admin atau pendataan.' };
  // bcrypt only uses the first 72 bytes
  if ((creating || password) && (password.length < 8 || password.length > 72)) {
    return { error: 'Password harus 8–72 karakter.' };
  }
  return { fields: { name, email, role }, password };
}

const conflictMessage = 'Username atau email sudah dipakai akun lain.';

router.get('/users', adminOnly, async (req, res) => {
  res.json({ success: true, data: await listUsers() });
});

// ponytail: username/email uniqueness is check-then-write; fine for a few admins, add a unique index if that changes
router.post('/users', adminOnly, async (req, res) => {
  const input = readUser(req.body, true);
  if (input.error) return res.status(422).json({ success: false, message: input.error });
  if (await userConflict(input.fields)) return res.status(409).json({ success: false, message: conflictMessage });

  const user = await createUser({ ...input.fields, passwordHash: await bcrypt.hash(input.password, 12) });
  await audit(req, req.user.name, 'TAMBAH', 'pengguna', `${user.name} (${user.role})`);
  res.status(201).json({ success: true, message: `Akun ${user.name} dibuat.`, data: user });
});

router.patch('/users/:id', adminOnly, async (req, res) => {
  const target = await findUserById(req.params.id);
  if (!target) return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' });

  const input = readUser(req.body, false);
  if (input.error) return res.status(422).json({ success: false, message: input.error });
  if (await userConflict(input.fields, target.id)) {
    return res.status(409).json({ success: false, message: conflictMessage });
  }
  // Someone must always be able to log in and manage accounts
  if (target.role === 'admin' && input.fields.role !== 'admin' && (await countAdmins()) <= 1) {
    return res.status(409).json({ success: false, message: 'Harus ada minimal satu akun admin.' });
  }

  const fields = { ...input.fields };
  if (input.password) {
    fields.password = await bcrypt.hash(input.password, 12);
    // A reset ends that account's open sessions; not your own, or you would be logged out mid-edit
    if (target.id !== String(req.user._id)) fields.password_changed_at = new Date();
  }
  const user = await updateUser(target.id, fields);
  await audit(req, req.user.name, 'UBAH', 'pengguna', `${user.name} (${user.role})${input.password ? ', password direset' : ''}`);
  res.json({ success: true, message: `Akun ${user.name} diperbarui.`, data: user });
});

router.delete('/users/:id', adminOnly, async (req, res) => {
  const target = await findUserById(req.params.id);
  if (!target) return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' });
  // The caller is an admin, so deleting any other account always leaves at least one admin
  if (target.id === String(req.user._id)) {
    return res.status(409).json({ success: false, message: 'Tidak bisa menghapus akun yang sedang dipakai.' });
  }

  await deleteUser(target.id);
  await audit(req, req.user.name, 'HAPUS', 'pengguna', target.name);
  res.json({ success: true, message: `Akun ${target.name} dihapus.` });
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
