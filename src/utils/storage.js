const AUTH_TOKEN_KEY = 'natal_pd_admin_token_2026';

const API_BASE = '/api';

// Older versions cached every participant (name, email, WhatsApp) in the browser; wipe what they left behind
try {
  localStorage.removeItem('natal_pd_registrations_2026');
  localStorage.removeItem('natal_pd_admin_auth_2026');
} catch {
  // storage blocked: nothing to clean
}

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
    const fallback =
      res.status === 429
        ? 'Terlalu banyak pendaftaran dari jaringan ini. Tunggu 1 menit lalu coba lagi.'
        : 'Terjadi kesalahan pada server. Silakan coba lagi.';
    const err = new Error(json?.message || fallback);
    err.status = res.status;
    throw err;
  }
  return json;
};

// All participants, straight from the server (admin only)
export const fetchRegistrations = async () => (await apiFetch('/registrations')).data;

// Register participant; throws if the server did not save it
export const addRegistration = async (registration) => {
  const result = await apiFetch('/register', { method: 'POST', body: registration });
  return { ...result.data, dispatch: result.dispatch, alreadyRegistered: result.alreadyRegistered };
};

// Set check-in to the wanted state and return the updated participant
export const setCheckIn = async (ticketId, checkedIn) =>
  (
    await apiFetch(`/registrations/${encodeURIComponent(ticketId)}/checkin`, {
      method: 'PATCH',
      body: { checkedIn },
    })
  ).data;

export const deleteRegistration = async (ticketId) => {
  await apiFetch(`/registrations/${encodeURIComponent(ticketId)}`, { method: 'DELETE' });
};

// Role from the token ('admin' | 'sekretariat'), only to pick the screen; the server checks it on every request
export const currentRole = () => {
  try {
    const payload = localStorage.getItem(AUTH_TOKEN_KEY).split('.')[0];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))).r || null;
  } catch {
    return null;
  }
};

// Tokens from before roles existed have no role: those users simply log in again
export const isAdminAuthenticated = () => Boolean(currentRole());

// Change your own password; the server ends other sessions and returns a fresh token for this one
export const changePassword = async (currentPassword, newPassword) => {
  const result = await apiFetch('/me/password', { method: 'POST', body: { currentPassword, newPassword } });
  localStorage.setItem(AUTH_TOKEN_KEY, result.token);
  return result.message;
};

// Panitia accounts (admin only)
export const fetchUsers = async () => (await apiFetch('/users')).data;

// Audit log, newest first (admin only)
export const fetchAuditLogs = async () => (await apiFetch('/audit-logs')).data;

// Creates when id is empty, otherwise updates; returns { data, message }
export const saveUser = async (id, user) =>
  apiFetch(id ? `/users/${id}` : '/users', { method: id ? 'PATCH' : 'POST', body: user });

export const deleteUser = async (id) => (await apiFetch(`/users/${id}`, { method: 'DELETE' })).message;

export const loginAdmin = async (username, password) => {
  try {
    const data = await apiFetch('/admin/login', {
      method: 'POST',
      body: { username: (username || '').trim().toLowerCase(), password: (password || '').trim() },
    });
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

// Records the logout on the server (audit log), then forgets the token; logging out works even if that call fails
export const logoutAdmin = () => {
  apiFetch('/logout', { method: 'POST' }).catch(() => {}); // reads the token before the line below removes it
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error(error);
  }
};
