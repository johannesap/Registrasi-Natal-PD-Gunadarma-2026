import { MongoClient, ObjectId } from 'mongodb';

// Documents keep the snake_case fields the database already has (first written by the old Laravel backend)
let dbPromise = null;
let client = null;

async function connect() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI belum diatur');
  client = await new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 }).connect();
  const db = client.db(process.env.MONGODB_DATABASE || 'natal_pd_2026');
  // No-op when it exists; keeps a fresh database (e.g. dev) from accepting duplicate ticket codes
  await db.collection('registrations').createIndex({ ticket_id: 1 }, { unique: true });
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
    npm: doc.npm,
    email: doc.email,
    whatsapp: doc.whatsapp,
    region: doc.region,
    komselStatus: doc.komsel_status,
    mentorName: doc.mentor_name || '-',
    faculty: doc.faculty || 'Universitas Gunadarma',
    session: doc.session || 'Sesi Utama (16.30 WIB - Selesai)',
    isCheckedIn: Boolean(doc.is_checked_in),
    checkedInAt: doc.checked_in_at ? formatCheckedIn(doc.checked_in_at) : null,
    registeredAt: doc.registered_at || (doc.created_at ? formatRegistered(doc.created_at) : null),
  };
}

export async function listRegistrations() {
  const docs = await (await registrations()).find().sort({ _id: -1 }).toArray();
  return docs.map(toFrontend);
}

// Same NPM + email means the same person submitting again (guests type any NPM, so NPM alone is not enough)
export async function findExistingRegistration(npm, email) {
  const doc = await (await registrations()).findOne({ npm, email: exactIgnoreCase(email) });
  return doc ? toFrontend(doc) : null;
}

export async function addRegistration(reg) {
  const now = new Date();
  const doc = {
    ticket_id: reg.ticketId,
    full_name: reg.fullName,
    npm: reg.npm,
    email: reg.email,
    whatsapp: reg.whatsapp,
    region: reg.region,
    komsel_status: reg.komselStatus,
    mentor_name: reg.mentorName || '-',
    faculty: reg.faculty || 'Universitas Gunadarma',
    session: reg.session || 'Sesi Utama (16.30 WIB - Selesai)',
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

// true when a registration was deleted
export async function deleteRegistration(ticketId) {
  const { deletedCount } = await (await registrations()).deleteOne({ ticket_id: ticketId.trim().toUpperCase() });
  return deletedCount > 0;
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

// For one-off scripts, so the process can exit
export async function closeDb() {
  await client?.close();
  client = null;
  dbPromise = null;
}
