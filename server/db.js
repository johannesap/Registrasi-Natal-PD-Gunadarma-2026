import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'registrations.json');

// Initial seed data if file doesn't exist yet
const INITIAL_REGISTRATIONS = [
  {
    ticketId: 'NATAL-UG-4102-1890',
    fullName: 'Jonathan Kevin Situmorang',
    npm: '50421890',
    email: 'jonathan.kevin@gmail.com',
    whatsapp: '081298765432',
    region: 'depok',
    komselStatus: 'Sudah memiliki Komsel (Tuliskan nama Kakak Komsel di bawah)',
    mentorName: 'Kak Daniel Simanjuntak',
    faculty: 'Teknik Informatika / FTI',
    session: 'Sesi Utama (16.30 WIB - Selesai)',
    registeredAt: '2026-10-01 14:32',
    isCheckedIn: true,
    checkedInAt: '2026-10-01 16:15',
  },
  {
    ticketId: 'NATAL-UG-5289-4412',
    fullName: 'Maria Gabriella Samosir',
    npm: '20224412',
    email: 'gabriella.maria@gunadarma.ac.id',
    whatsapp: '081345678910',
    region: 'kalimalang',
    komselStatus: 'Sudah memiliki Komsel (Tuliskan nama Kakak Komsel di bawah)',
    mentorName: 'Kak Yohana Priskila',
    faculty: 'Sistem Informasi / FIKTI',
    session: 'Sesi Utama (16.30 WIB - Selesai)',
    registeredAt: '2026-10-01 16:45',
    isCheckedIn: false,
    checkedInAt: null,
  },
  {
    ticketId: 'NATAL-UG-6714-9021',
    fullName: 'Christian Timothy Siregar',
    npm: '10129021',
    email: 'christian.timothy@gmail.com',
    whatsapp: '085712349876',
    region: 'karawaci',
    komselStatus: 'Belum memiliki Komsel (Rindu bergabung dengan Komsel PD)',
    mentorName: '-',
    faculty: 'Manajemen / FE',
    session: 'Sesi Utama (16.30 WIB - Selesai)',
    registeredAt: '2026-10-02 09:15',
    isCheckedIn: true,
    checkedInAt: '2026-10-02 16:20',
  },
  {
    ticketId: 'NATAL-UG-7831-3310',
    fullName: 'Rachel Michelle Hutapea',
    npm: '30423310',
    email: 'rachel.hutapea@gmail.com',
    whatsapp: '081287654321',
    region: 'depok',
    komselStatus: 'Sudah memiliki Komsel (Tuliskan nama Kakak Komsel di bawah)',
    mentorName: 'Kak Samuel Pasaribu',
    faculty: 'Psikologi / FPSI',
    session: 'Sesi Utama (16.30 WIB - Selesai)',
    registeredAt: '2026-10-02 11:20',
    isCheckedIn: false,
    checkedInAt: null,
  },
  {
    ticketId: 'NATAL-UG-8920-7761',
    fullName: 'David Samuel Tampubolon',
    npm: '51427761',
    email: 'david.samuel@gunadarma.ac.id',
    whatsapp: '087812903456',
    region: 'cengkareng',
    komselStatus: 'Belum memiliki Komsel (Rindu bergabung dengan Komsel PD)',
    mentorName: '-',
    faculty: 'Teknik Elektro / FTI',
    session: 'Sesi Utama (16.30 WIB - Selesai)',
    registeredAt: '2026-10-03 13:05',
    isCheckedIn: false,
    checkedInAt: null,
  },
  {
    ticketId: 'NATAL-UG-9145-2026',
    fullName: 'Grace Stefanie Panjaitan',
    npm: '21225510',
    email: 'grace.stefanie@gmail.com',
    whatsapp: '082198761234',
    region: 'simatupang',
    komselStatus: 'Sudah memiliki Komsel (Tuliskan nama Kakak Komsel di bawah)',
    mentorName: 'Kak Grace Novita',
    faculty: 'Ilmu Komunikasi / FIKOM',
    session: 'Sesi Utama (16.30 WIB - Selesai)',
    registeredAt: '2026-10-03 15:50',
    isCheckedIn: false,
    checkedInAt: null,
  },
];

// Ensure data folder and storage file exist
export function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_REGISTRATIONS, null, 2), 'utf-8');
    console.log('[DB] Initialized database with seed registrations.');
  }
}

// Read all registrations from disk
export function readRegistrations() {
  try {
    initDB();
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('[DB Error] Failed to read database:', error);
    return INITIAL_REGISTRATIONS;
  }
}

// Write registrations safely to disk
export function writeRegistrations(data) {
  try {
    initDB();
    const tempFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
    return true;
  } catch (error) {
    console.error('[DB Error] Failed to write database:', error);
    return false;
  }
}

// Get single registration by ticketId
export function findRegistrationByTicketId(ticketId) {
  const all = readRegistrations();
  return all.find((item) => item.ticketId.toUpperCase() === ticketId.trim().toUpperCase()) || null;
}

// Get single registration by NPM
export function findRegistrationByNpm(npm) {
  const all = readRegistrations();
  return all.find((item) => item.npm === npm.trim()) || null;
}

// Add a new registration
export function addRegistration(regData) {
  const all = readRegistrations();
  const timestamp = new Date().toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const newEntry = {
    ticketId: regData.ticketId,
    fullName: regData.fullName,
    npm: regData.npm,
    email: regData.email,
    whatsapp: regData.whatsapp,
    region: regData.region,
    komselStatus: regData.komselStatus,
    mentorName: regData.mentorName || '-',
    faculty: regData.faculty || 'Universitas Gunadarma',
    session: regData.session || 'Sesi Utama (16.30 WIB - Selesai)',
    registeredAt: timestamp,
    isCheckedIn: false,
    checkedInAt: null,
  };

  const updated = [newEntry, ...all];
  writeRegistrations(updated);
  return newEntry;
}

// Toggle check-in status
export function toggleCheckIn(ticketId) {
  const all = readRegistrations();
  let found = null;
  const nowTime = new Date().toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updated = all.map((item) => {
    if (item.ticketId.toUpperCase() === ticketId.trim().toUpperCase()) {
      const nextStatus = !item.isCheckedIn;
      found = {
        ...item,
        isCheckedIn: nextStatus,
        checkedInAt: nextStatus ? nowTime : null,
      };
      return found;
    }
    return item;
  });

  if (found) {
    writeRegistrations(updated);
  }
  return { updatedList: updated, item: found };
}

// Delete registration by ticketId
export function deleteRegistration(ticketId) {
  const all = readRegistrations();
  const filtered = all.filter(
    (item) => item.ticketId.toUpperCase() !== ticketId.trim().toUpperCase()
  );
  const success = filtered.length !== all.length;
  if (success) {
    writeRegistrations(filtered);
  }
  return { success, updatedList: filtered };
}

// Get statistics overview
export function calculateStats() {
  const all = readRegistrations();
  const total = all.length;
  const checkedIn = all.filter((r) => r.isCheckedIn).length;
  const attendanceRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  // Breakdown by region
  const regionCounts = {};
  all.forEach((r) => {
    const reg = r.region || 'depok';
    regionCounts[reg] = (regionCounts[reg] || 0) + 1;
  });

  // Breakdown by Komsel status
  const withKomsel = all.filter(
    (r) => r.komselStatus && r.komselStatus.toLowerCase().includes('sudah')
  ).length;
  const withoutKomsel = all.filter(
    (r) => r.komselStatus && r.komselStatus.toLowerCase().includes('belum')
  ).length;
  const alumniTamu = total - (withKomsel + withoutKomsel);

  return {
    total,
    checkedIn,
    notCheckedIn: total - checkedIn,
    attendanceRate,
    regionCounts,
    komselStats: {
      withKomsel,
      withoutKomsel,
      alumniTamu,
    },
  };
}
