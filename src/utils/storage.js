const STORAGE_KEY = 'natal_pd_registrations_2026';
const AUTH_KEY = 'natal_pd_admin_auth_2026';
const AUTH_TOKEN_KEY = 'natal_pd_admin_token_2026';

const API_BASE = '/api';

// Calls the API with the admin token and throws the server's message on any failure
const apiFetch = async (path, { method = 'GET', body } = {}) => {
  let token = null;
  try {
    token = localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    // storage blocked: continue without token
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Server tidak dapat dihubungi. Periksa koneksi internet lalu coba lagi.');
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const err = new Error(json?.message || 'Terjadi kesalahan pada server. Silakan coba lagi.');
    err.status = res.status;
    throw err;
  }
  return json;
};

// Initial seed data for fallback if offline
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
  },
];

// Helper: Read from LocalStorage Cache
export const getLocalRegistrations = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REGISTRATIONS));
      return INITIAL_REGISTRATIONS;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read registrations from storage', error);
    return INITIAL_REGISTRATIONS;
  }
};

// Helper: Write to LocalStorage Cache
export const saveLocalRegistrations = (registrations) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
  } catch (error) {
    console.error('Failed to save registrations to storage', error);
  }
};

// Synchronous getter for instant render (falls back to cache)
export const getRegistrations = () => {
  return getLocalRegistrations();
};

// Async fetcher from backend API with local cache synchronization (throws on failure)
export const fetchRegistrations = async (filterParams = {}) => {
  const query = new URLSearchParams(filterParams).toString();
  const json = await apiFetch(query ? `/registrations?${query}` : '/registrations');
  saveLocalRegistrations(json.data);
  return json.data;
};

// Register participant (Calls backend API POST /api/register; throws if not saved on the server)
export const addRegistration = async (registration) => {
  const result = await apiFetch('/register', { method: 'POST', body: registration });

  const current = getLocalRegistrations();
  const updated = [result.data, ...current.filter((r) => r.ticketId !== result.data.ticketId)];
  saveLocalRegistrations(updated);
  return {
    ...result.data,
    dispatch: result.dispatch,
    serverSynced: true,
  };
};

// Toggle Check-in status (Calls backend API PATCH /api/registrations/:ticketId/checkin)
export const toggleCheckIn = async (ticketId) => {
  const json = await apiFetch(`/registrations/${encodeURIComponent(ticketId)}/checkin`, {
    method: 'PATCH',
  });

  const current = getLocalRegistrations();
  const updated = current.map((item) =>
    item.ticketId === ticketId
      ? { ...item, isCheckedIn: json.data.isCheckedIn, checkedInAt: json.data.checkedInAt }
      : item
  );
  saveLocalRegistrations(updated);
  return updated;
};

// Delete participant registration (Calls backend API DELETE /api/registrations/:ticketId)
export const deleteRegistration = async (ticketId) => {
  await apiFetch(`/registrations/${encodeURIComponent(ticketId)}`, { method: 'DELETE' });

  const current = getLocalRegistrations();
  const updated = current.filter((item) => item.ticketId !== ticketId);
  saveLocalRegistrations(updated);
  return updated;
};

// Admin Authentication State
export const isAdminAuthenticated = () => {
  try {
    return localStorage.getItem(AUTH_KEY) === 'true';
  } catch {
    return false;
  }
};

export const loginAdmin = async (username, password) => {
  const cleanUser = (username || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  try {
    const data = await apiFetch('/admin/login', {
      method: 'POST',
      body: { username: cleanUser, password: cleanPass },
    });
    localStorage.setItem(AUTH_KEY, 'true');
    if (data.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    }
    return { success: true, source: data.admin?.source || 'MongoDB' };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

export const logoutAdmin = () => {
  try {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error(error);
  }
};

// Export to CSV Function
export const exportRegistrationsToCSV = (registrations) => {
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
    'Waktu Registrasi',
  ];

  const rows = registrations.map((r, idx) => [
    idx + 1,
    `"${r.ticketId || ''}"`,
    `"${(r.fullName || '').replace(/"/g, '""')}"`,
    `'${r.npm || ''}`,
    `"${r.email || ''}"`,
    `'${r.whatsapp || ''}`,
    `"${r.region || ''}"`,
    `"${(r.komselStatus || '').replace(/"/g, '""')}"`,
    `"${(r.mentorName || '-').replace(/"/g, '""')}"`,
    `"${(r.faculty || '-').replace(/"/g, '""')}"`,
    r.isCheckedIn ? 'Hadir' : 'Belum Hadir',
    `"${r.registeredAt || ''}"`,
  ]);

  const csvContent =
    '\uFEFF' +
    [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Data_Registrasi_Natal_PD_Gunadarma_2026_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
