import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, History, UserPlus, Pencil, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { fetchUsers, saveUser, deleteUser } from '../utils/storage';
import PasswordInput from './PasswordInput';
import PanelSidebar from './PanelSidebar';
import AuditLog from './AuditLog';

const ADMIN_VIEWS = [
  { id: 'users', label: 'Pengguna', icon: Users },
  { id: 'audit', label: 'Audit Log', icon: History },
];

const ROLE_LABELS = {
  admin: 'Admin (kelola akun)',
  sekretariat: 'Sekretariat (kelola pendaftar)',
};

const EMPTY_FORM = { id: '', name: '', email: '', role: 'sekretariat', password: '' };

const inputClass =
  'w-full px-4 py-3 bg-neutral-900/80 border border-white/10 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all';
const labelClass = 'block text-xs font-semibold tracking-wider text-amber-200/90 uppercase mb-1.5';

// Account management for the admin role: list, create, edit and delete panitia logins
export default function AccountManager({ onChangePassword, onLogout, onAuthError }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState('users'); // 'users' | 'audit'

  const load = async () => {
    try {
      setUsers(await fetchUsers());
    } catch (err) {
      onAuthError(err);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const startEdit = (u) => {
    setForm({ id: u.id, name: u.name, email: u.email, role: u.role || 'sekretariat', password: '' });
    setError('');
    setNotice('');
  };

  const resetForm = () => setForm(EMPTY_FORM);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      const { id, ...body } = form;
      const result = await saveUser(id, body);
      setNotice(result.message);
      resetForm();
      await load();
    } catch (err) {
      if (err.status === 401) return onAuthError(err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Hapus akun "${u.name}"? Akun ini tidak bisa login lagi.`)) return;
    setError('');
    setNotice('');
    try {
      setNotice(await deleteUser(u.id));
      if (form.id === u.id) resetForm();
      await load();
    } catch (err) {
      if (err.status === 401) return onAuthError(err);
      setError(err.message);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative min-h-screen w-full md:flex z-20"
    >
      <PanelSidebar
        items={ADMIN_VIEWS}
        current={view}
        onSelect={setView}
        onChangePassword={onChangePassword}
        onLogout={onLogout}
      />

      <div className="flex-1 min-w-0 px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className={`${view === 'audit' ? 'max-w-6xl' : 'max-w-4xl'} mx-auto space-y-6`}>
        {view === 'audit' ? (
          <AuditLog onAuthError={onAuthError} />
        ) : (
          <>
        {/* Header */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-amber-400/25">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-amber-300">
              PANEL ADMIN NATAL 2026
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-['Cinzel'] text-gold-gradient tracking-wide uppercase">
              KELOLA AKUN PANITIA
            </h1>
            <p className="text-xs text-gray-400 font-light">
              Admin mengatur akun. Data pendaftar dikelola oleh akun sekretariat.
            </p>
          </div>
        </div>

        {/* Create / edit form */}
        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/10 space-y-4">
          <h2 className="text-sm font-semibold tracking-wider uppercase text-amber-300 flex items-center gap-2">
            {form.id ? <Pencil className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {form.id ? `Ubah Akun: ${form.name}` : 'Tambah Akun'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="acc-name" className={labelClass}>Username</label>
              <input id="acc-name" name="name" required value={form.name} onChange={handleChange} placeholder="contoh: sekretariat2" autoComplete="off" className={inputClass} />
            </div>
            <div>
              <label htmlFor="acc-email" className={labelClass}>Email</label>
              <input id="acc-email" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="nama@gmail.com" autoComplete="off" className={inputClass} />
            </div>
            <div>
              <label htmlFor="acc-role" className={labelClass}>Peran</label>
              <select id="acc-role" name="role" value={form.role} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
                {Object.entries(ROLE_LABELS).map(([value, text]) => (
                  <option key={value} value={value} className="bg-neutral-900 text-white">
                    {text}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="acc-password" className={labelClass}>Password</label>
              <PasswordInput
                id="acc-password"
                name="password"
                required={!form.id}
                minLength={8}
                maxLength={72}
                value={form.password}
                onChange={handleChange}
                placeholder={form.id ? 'Kosongkan jika tidak diubah' : 'Minimal 8 karakter'}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <div role="alert" className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {notice && (
            <div role="status" className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="submit"
              disabled={isSaving}
              className="gold-btn flex-1 py-3 rounded-xl font-semibold text-neutral-950 text-xs tracking-widest uppercase cursor-pointer"
            >
              {isSaving ? 'Menyimpan...' : form.id ? 'Simpan Perubahan' : 'Tambah Akun'}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-3 rounded-xl font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 text-xs tracking-wider uppercase transition-colors cursor-pointer"
              >
                Batal
              </button>
            )}
          </div>
        </form>

        {/* Account list */}
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/60 text-amber-200 border-b border-white/10 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Akun</th>
                <th className="hidden sm:table-cell py-3.5 px-4 font-semibold">Peran</th>
                <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{u.name}</div>
                    <div className="text-[11px] text-gray-400 break-all">{u.email}</div>
                    <div className="sm:hidden text-[11px] text-amber-300">{ROLE_LABELS[u.role] || 'Belum punya peran'}</div>
                  </td>
                  <td className="hidden sm:table-cell py-3.5 px-4 text-amber-200">{ROLE_LABELS[u.role] || 'Belum punya peran'}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEdit(u)}
                        title={`Ubah akun ${u.name}`}
                        aria-label={`Ubah akun ${u.name}`}
                        className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-amber-300 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        title={`Hapus akun ${u.name}`}
                        aria-label={`Hapus akun ${u.name}`}
                        className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          </>
        )}
      </div>
      </div>
    </motion.section>
  );
}
