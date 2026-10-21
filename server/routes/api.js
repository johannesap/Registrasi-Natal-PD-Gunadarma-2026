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
  listUsers,
  findUserById,
  userConflict,
  createUser,
  updateUser,
  deleteUser,
  countAdmins,
} from '../db.js';

const router = express.Router();

const str = (v) => (typeof v === 'string' ? v.trim() : '');

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
router.patch('/registrations/:ticketId/checkin', sekretariatOnly, async (req, res) => {
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
router.delete('/registrations/:ticketId', sekretariatOnly, async (req, res) => {
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

  if (user && (await passwordMatches(user, password))) {
    if (!ROLES.includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Akun ini belum punya peran. Hubungi admin.' });
    }
    return res.json({
      success: true,
      message: 'Login berhasil',
      token: issueToken(user),
      admin: { username: user.name, email: user.email, role: user.role },
    });
  }

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
  // Other sessions of this account end now; this one continues with a fresh token
  res.json({ success: true, message: 'Password berhasil diganti.', token: issueToken(req.user) });
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
  if (!ROLES.includes(role)) return { error: 'Peran harus admin atau sekretariat.' };
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
