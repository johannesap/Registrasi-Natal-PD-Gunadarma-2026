// Create or reset a panitia login (e.g. to recover the admin): npm run set-admin -- <username> <email> <admin|sekretariat>
// Uses MONGODB_URI / MONGODB_DATABASE from .env. Password: ADMIN_PASSWORD, or a new random one printed once.
import 'dotenv/config';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { upsertAdminUser, closeDb } from './db.js';

const [name, email, role] = process.argv.slice(2);
if (!name || !email || !['admin', 'sekretariat'].includes(role)) {
  console.error('Pakai: npm run set-admin -- <username> <email> <admin|sekretariat>');
  process.exit(1);
}

const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
await upsertAdminUser({ name: name.toLowerCase(), email, role, passwordHash: await bcrypt.hash(password, 12) });
await closeDb();

console.log(`Akun "${name}" (${role}) disimpan di database ${process.env.MONGODB_DATABASE}.`);
if (!process.env.ADMIN_PASSWORD) console.log(`Password baru: ${password}`);
