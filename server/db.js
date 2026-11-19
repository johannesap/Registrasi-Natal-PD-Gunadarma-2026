import { MongoClient, ObjectId } from 'mongodb';
import { intlPhone } from '../src/utils/phone.js';

// Documents keep the snake_case fields the database already has (first written by the old Laravel backend)
let dbPromise = null;
let client = null;

async function connect() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI belum diatur');
  client = await new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 }).connect();
  const db = client.db(process.env.MONGODB_DATABASE || 'natal_pd_2026');
  // No-op when it exists; keeps a fresh database (e.g. dev) from accepting duplicate ticket codes
  await db.collection('registrations').createIndex({ ticket_id: 1 }, { unique: true });
  // Attempt counters (login, register) delete themselves once their window is over
  await db.collection('limits').createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
  await db.collection('audit_logs').createIndex({ at: -1 });
  return db;
}

function getDb() {
  dbPromise ??= connect().catch((err) => {
    dbPromise = null; // retry on the next request instead of caching the failure
    throw err;
  });
  return dbPromise;
}

const registrations = async () => (await getDb()).collection('registrations');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactIgnoreCase = (s) => new RegExp(`^${escapeRegex(s)}$`, 'i');

// Date parts in WIB (Asia/Jakarta)
function wib(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

const formatCheckedIn = (date) => {
  const p = wib(date);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
};

const formatRegistered = (date) => {
  const p = wib(date);
  return `${p.day}/${p.month}/${p.year}, ${p.hour}.${p.minute}`;
};

// Shape the frontend expects (camelCase)
export function toFrontend(doc) {
  return {
    ticketId: doc.ticket_id,
    fullName: doc.full_name,
    // Registrations from before the gender field (they have an NPM instead) show '-'
    gender: doc.gender || '-',
    // Registrations from before the status field (they have an email instead) show '-'
    status: doc.status || '-',
    whatsapp: doc.whatsapp,
    region: doc.region,
    komselStatus: doc.komsel_status,
    mentorName: doc.mentor_name || '-',
    faculty: doc.faculty || '-',
    departure: doc.departure || '-',
    departureArea: doc.departure_area || '-',
    isCheckedIn: Boolean(doc.is_checked_in),
    checkedInAt: doc.checked_in_at ? formatCheckedIn(doc.checked_in_at) : null,
    registeredAt: doc.registered_at || (doc.created_at ? formatRegistered(doc.created_at) : null),
  };
}

export async function listRegistrations() {
  // Newest registration first
  const docs = await (await registrations()).find().sort({ created_at: -1, _id: -1 }).toArray();
  return docs.map(toFrontend);
}

// Same WhatsApp number means the same person submitting again, however the number was typed (08…, 8…, 628…)
export async function findExistingRegistration(whatsapp) {
  const local = intlPhone(whatsapp).slice(2);
  const doc = await (await registrations()).findOne({ whatsapp: { $in: [`0${local}`, local, `62${local}`] } });
  return doc ? toFrontend(doc) : null;
}

export async function addRegistration(reg) {
  const now = new Date();
  const doc = {
    ticket_id: reg.ticketId,
    full_name: reg.fullName,
    gender: reg.gender,
    status: reg.status,
    whatsapp: reg.whatsapp,
    region: reg.region,
    komsel_status: reg.komselStatus,
    mentor_name: reg.mentorName || '-',
    faculty: reg.faculty || '-',
    departure: reg.departure,
    departure_area: reg.departureArea,
    registered_at: formatRegistered(now),
    is_checked_in: false,
    checked_in_at: null,
    created_at: now,
    updated_at: now,
  };
  const { insertedId } = await (await registrations()).insertOne(doc);
  return toFrontend({ ...doc, _id: insertedId });
}

// Sets (not flips) the check-in, so a repeated request changes nothing; keeps the first check-in time
export async function setCheckIn(ticketId, checkedIn) {
  const now = new Date();
  const doc = await (await registrations()).findOneAndUpdate(
    { ticket_id: ticketId.trim().toUpperCase() },
    [
      {
        $set: {
          is_checked_in: checkedIn,
          checked_in_at: checkedIn ? { $ifNull: ['$checked_in_at', now] } : null,
          updated_at: now,
        },
      },
    ],
    { returnDocument: 'after' }
  );
  return doc ? toFrontend(doc) : null;
}

// The deleted registration (so the audit log can name it), or null when there was none
export async function deleteRegistration(ticketId) {
  const doc = await (await registrations()).findOneAndDelete({ ticket_id: ticketId.trim().toUpperCase() });
  return doc ? toFrontend(doc) : null;
}

// Audit log: who did what, when, from where: { at, user, action, entity: 'pengguna' | 'peserta', detail, ip }
const auditLogs = async () => (await getDb()).collection('audit_logs');

// Never fails the action it records: a lost log line beats a door check-in that errors
export async function addAuditLog(entry) {
  try {
    await (await auditLogs()).insertOne({ ...entry, at: new Date() });
  } catch (err) {
    console.error('[Audit] not saved:', err);
  }
}

// ponytail: newest 2000 only, filtered in the browser; page through the database if one event ever logs more
export async function listAuditLogs() {
  const docs = await (await auditLogs()).find().sort({ at: -1 }).limit(2000).toArray();
  return docs.map((d) => ({
    id: String(d._id),
    at: d.at.toISOString(),
    user: d.user,
    action: d.action,
    entity: d.entity,
    detail: d.detail || '',
    ip: d.ip || '',
  }));
}

export async function countRegistrations() {
  return (await registrations()).countDocuments();
}

// Panitia accounts: { name, email, role: 'admin' | 'sekretariat', password: bcrypt hash } in `users`
const users = async () => (await getDb()).collection('users');

// Account as sent to the browser: never the password hash
const toUser = (d) => ({ id: String(d._id), name: d.name, email: d.email, role: d.role || null });

export async function findAdminUser(login) {
  const exact = exactIgnoreCase(login);
  return (await users()).findOne({ $or: [{ email: exact }, { name: exact }] });
}

export async function listUsers() {
  return (await (await users()).find().sort({ name: 1 }).toArray()).map(toUser);
}

export async function findUserById(id) {
  if (!ObjectId.isValid(id)) return null;
  const doc = await (await users()).findOne({ _id: new ObjectId(id) });
  return doc ? toUser(doc) : null;
}

// true when another account (not excludeId) already uses this username or email
export async function userConflict({ name, email }, excludeId) {
  const filter = { $or: [{ name: exactIgnoreCase(name) }, { email: exactIgnoreCase(email) }] };
  if (excludeId) filter._id = { $ne: new ObjectId(excludeId) };
  return Boolean(await (await users()).findOne(filter));
}

export async function createUser({ name, email, role, passwordHash }) {
  const now = new Date();
  const doc = { name, email, role, password: passwordHash, created_at: now, updated_at: now };
  const { insertedId } = await (await users()).insertOne(doc);
  return toUser({ ...doc, _id: insertedId });
}

// fields: name, email, role and optionally password (already hashed)
export async function updateUser(id, fields) {
  const doc = await (await users()).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...fields, updated_at: new Date() } },
    { returnDocument: 'after' }
  );
  return doc ? toUser(doc) : null;
}

export async function deleteUser(id) {
  const { deletedCount } = await (await users()).deleteOne({ _id: new ObjectId(id) });
  return deletedCount > 0;
}

export async function countAdmins() {
  return (await users()).countDocuments({ role: 'admin' });
}

export async function upsertAdminUser({ name, email, role, passwordHash }) {
  const now = new Date();
  await (await users()).updateOne(
    // match by name too, so a new email updates the same account instead of creating a second one
    { $or: [{ email: exactIgnoreCase(email) }, { name: exactIgnoreCase(name) }] },
    {
      $set: { name, email, role, password: passwordHash, password_changed_at: now, updated_at: now },
      $setOnInsert: { created_at: now },
    },
    { upsert: true }
  );
}

// Attempt counters shared by every serverless instance: { _id: key, n, expires_at }
const limits = async () => (await getDb()).collection('limits');

// Counts one attempt for key and returns the count. A window starts at the first attempt; the attempt
// that reaches max starts a fresh full window, so whoever hits the limit waits the whole windowMs.
export async function countAttempt(key, max, windowMs) {
  const now = Date.now();
  const live = { $gt: ['$expires_at', new Date(now)] }; // the TTL sweep runs once a minute, so check expiry here too
  const doc = await (await limits()).findOneAndUpdate(
    { _id: key },
    [
      {
        $set: {
          n: { $cond: [live, { $add: ['$n', 1] }, 1] },
          expires_at: { $cond: [live, '$expires_at', new Date(now + windowMs)] },
        },
      },
      { $set: { expires_at: { $cond: [{ $eq: ['$n', max] }, new Date(now + windowMs), '$expires_at'] } } },
    ],
    { upsert: true, returnDocument: 'after' }
  );
  return doc.n;
}

// Attempts counted for key in its current window (0 when none)
export async function attempts(key) {
  const doc = await (await limits()).findOne({ _id: key, expires_at: { $gt: new Date() } });
  return doc?.n ?? 0;
}

export async function clearAttempts(key) {
  await (await limits()).deleteOne({ _id: key });
}

// For one-off scripts, so the process can exit
export async function closeDb() {
  await client?.close();
  client = null;
  dbPromise = null;
}
