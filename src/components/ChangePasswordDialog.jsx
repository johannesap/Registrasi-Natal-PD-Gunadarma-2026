import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { changePassword } from '../utils/storage';

const inputClass =
  'w-full px-4 py-3 bg-neutral-900/80 border border-white/10 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all';
const labelClass = 'block text-xs font-semibold tracking-wider text-amber-200/90 uppercase mb-1.5';

// "Ganti Password" for the logged-in account, so each pengurus uses a password only they know
export default function ChangePasswordDialog({ onClose, onAuthError }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.next !== form.confirm) return setError('Ulangi password baru: isinya belum sama.');
    setIsSaving(true);
    try {
      setDone(await changePassword(form.current, form.next));
    } catch (err) {
      if (err.status === 401) return onAuthError(err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 sm:backdrop-blur-md overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pw-title"
        className="glass-panel max-w-md w-full rounded-2xl p-5 sm:p-7 border border-amber-400/30 space-y-4 my-auto"
      >
        <h2 id="pw-title" className="text-lg font-bold font-['Cinzel'] text-gold-gradient uppercase tracking-wide flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-amber-300" />
          Ganti Password
        </h2>

        {done ? (
          <div role="status" className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{done} Login di perangkat lain dengan password lama sudah tidak berlaku.</span>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400">
              Pakai password yang hanya Anda ketahui. Setelah diganti, sesi login lain dengan password lama akan berakhir.
            </p>
            <div>
              <label htmlFor="pw-current" className={labelClass}>Password Lama</label>
              <input id="pw-current" name="current" type="password" required autoComplete="current-password" value={form.current} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="pw-next" className={labelClass}>Password Baru</label>
              <input id="pw-next" name="next" type="password" required minLength={8} maxLength={72} autoComplete="new-password" placeholder="Minimal 8 karakter" value={form.next} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="pw-confirm" className={labelClass}>Ulangi Password Baru</label>
              <input id="pw-confirm" name="confirm" type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={form.confirm} onChange={handleChange} className={inputClass} />
            </div>
            {error && (
              <div role="alert" className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          {!done && (
            <button type="submit" disabled={isSaving} className="gold-btn flex-1 py-3 rounded-xl font-semibold text-neutral-950 text-xs tracking-widest uppercase cursor-pointer">
              {isSaving ? 'Menyimpan...' : 'Simpan Password'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 text-xs tracking-wider uppercase transition-colors cursor-pointer"
          >
            {done ? 'Tutup' : 'Batal'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
