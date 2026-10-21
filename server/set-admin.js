// Create or reset an admin login: npm run set-admin -- <username> <email>
// Uses MONGODB_URI / MONGODB_DATABASE from .env. Password: ADMIN_PASSWORD, or a new random one printed once.
import 'dotenv/config';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { upsertAdminUser, closeDb } from './db.js';

const [name, email] = process.argv.slice(2);
if (!name || !email) {
  console.error('Pakai: npm run set-admin -- <username> <email>');
  process.exit(1);
}

const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
await upsertAdminUser({ name: name.toLowerCase(), email, passwordHash: await bcrypt.hash(password, 12) });
await closeDb();

console.log(`Admin "${name}" disimpan di database ${process.env.MONGODB_DATABASE}.`);
if (!process.env.ADMIN_PASSWORD) console.log(`Password baru: ${password}`);
