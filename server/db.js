import { MongoClient } from 'mongodb';

// Documents use the same snake_case fields as the Laravel models, so both backends share one database.
let clientPromise = null;

async function getDb() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI belum diatur');
  clientPromise ??= new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
    .connect()
    .catch((err) => {
    clientPromise = null; // retry on the next request instead of caching the failure
    throw err;
  });
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DATABASE || 'natal_pd_2026');
}

const registrations = async () => (await getDb()).collection('registrations');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Date parts in WIB, matching Laravel's Asia/Jakarta timezone
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

// Same shape as Registration::toFrontendArray() in Laravel
export function toFrontend(doc) {
  return {
    id: String(doc._id),
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

export async function listRegistrations({ search, region, checkedIn } = {}, sort = -1) {
  const filter = {};

  if (search && search.trim()) {
    const q = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = ['full_name', 'npm', 'ticket_id', 'email', 'whatsapp', 'mentor_name'].map((f) => ({
      [f]: q,
    }));
  }

  if (region && region !== 'all' && region !== 'Semua Region') {
    filter.region = region.toLowerCase();
  }

  if (checkedIn !== undefined && checkedIn !== '' && checkedIn !== 'all') {
    filter.is_checked_in = checkedIn === 'true' || checkedIn === '1';
  }

  const docs = await (await registrations()).find(filter).sort({ _id: sort }).toArray();
  return docs.map(toFrontend);
}

// Lookup by ticket code or NPM
export async function findRegistration(ticketIdOrNpm) {
  const key = ticketIdOrNpm.trim();
  const doc = await (await registrations()).findOne({
    $or: [{ ticket_id: key.toUpperCase() }, { npm: key }],
  });
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

export async function toggleCheckIn(ticketId) {
  const col = await registrations();
  const current = await col.findOne({ ticket_id: ticketId.trim().toUpperCase() });
  if (!current) return null;

  const next = !current.is_checked_in;
  const now = new Date();
  const updated = await col.findOneAndUpdate(
    { _id: current._id },
    { $set: { is_checked_in: next, checked_in_at: next ? now : null, updated_at: now } },
    { returnDocument: 'after' }
  );
  return toFrontend(updated);
}

export async function deleteRegistration(ticketId) {
  const col = await registrations();
  const { deletedCount } = await col.deleteOne({ ticket_id: ticketId.trim().toUpperCase() });
  return { success: deletedCount > 0, remaining: await col.countDocuments() };
}

export async function countRegistrations() {
  return (await registrations()).countDocuments();
}

export async function calculateStats() {
  const all = await listRegistrations();
  const total = all.length;
  const checkedIn = all.filter((r) => r.isCheckedIn).length;

  const regionCounts = {};
  for (const r of all) {
    const reg = r.region || 'depok';
    regionCounts[reg] = (regionCounts[reg] || 0) + 1;
  }

  const komsel = (word) => all.filter((r) => (r.komselStatus || '').toLowerCase().includes(word)).length;
  const withKomsel = komsel('sudah');
  const withoutKomsel = komsel('belum');

  return {
    total,
    checkedIn,
    notCheckedIn: total - checkedIn,
    attendanceRate: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
    regionCounts,
    komselStats: {
      withKomsel,
      withoutKomsel,
      alumniTamu: Math.max(0, total - (withKomsel + withoutKomsel)),
    },
  };
}

// Admin accounts live in the Laravel `users` collection (bcrypt hashes)
export async function findAdminUser(login) {
  const exact = new RegExp(`^${escapeRegex(login)}$`, 'i');
  return (await getDb()).collection('users').findOne({ $or: [{ email: exact }, { name: exact }] });
}
