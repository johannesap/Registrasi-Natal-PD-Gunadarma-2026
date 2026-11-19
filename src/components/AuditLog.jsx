import React, { useState, useEffect, useRef } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { fetchAuditLogs } from '../utils/storage';

const WIB = 'Asia/Jakarta';
// YYYY-MM-DD in WIB, the same form an <input type="date"> gives, so they compare as text
const wibDate = (iso) => new Date(iso).toLocaleDateString('sv-SE', { timeZone: WIB });
const wibTime = (iso) => new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: WIB });

const fieldClass =
  'w-full px-3.5 py-2.5 bg-neutral-900/80 border border-white/10 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 [color-scheme:dark]';
const labelClass = 'block text-xs font-semibold tracking-wider text-amber-200/90 uppercase mb-1.5';

// A native date input labels its empty segments in the browser's language (dd/mm/tttt in Indonesian), so this shows
// a plain field with dd/mm/yyyy and opens the browser's own calendar. value is YYYY-MM-DD, like <input type="date">.
function DateField({ name, label, value, onChange }) {
  const picker = useRef(null);
  // ponytail: showPicker needs Chrome 99 / Safari 16 / Firefox 101; older browsers get no calendar here
  const open = () => picker.current.showPicker?.();
  return (
    <div>
      <label htmlFor={`audit-${name}`} className={labelClass}>{label}</label>
      <div className="relative">
        <input
          id={`audit-${name}`}
          type="text"
          readOnly
          value={value ? value.split('-').reverse().join('/') : ''}
          placeholder="dd/mm/yyyy"
          onClick={open}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              open();
            }
          }}
          className={`${fieldClass} pr-10 cursor-pointer placeholder-gray-500`}
        />
        {/* Invisible, under the field: only there to open the calendar where the field is */}
        <input
          ref={picker}
          type="date"
          name={name}
          value={value}
          onChange={onChange}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 opacity-0 pointer-events-none"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange({ target: { name, value: '' } })}
            aria-label={`Kosongkan ${label.toLowerCase()}`}
            className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-300/70 pointer-events-none" />
        )}
      </div>
    </div>
  );
}

// Who did what and when (admin only): logins, password changes, account changes, check-ins and deletions
export default function AuditLog({ onAuthError }) {
  const [logs, setLogs] = useState(null); // null while loading
  const [filter, setFilter] = useState({ action: '', entity: '', from: '', to: '' });

  useEffect(() => {
    fetchAuditLogs().then(setLogs, (err) => {
      setLogs([]);
      onAuthError(err);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- load once when the menu opens

  const all = logs || [];
  const options = (key) => [...new Set(all.map((l) => l[key]))].sort();
  const shown = all.filter(
    (l) =>
      (!filter.action || l.action === filter.action) &&
      (!filter.entity || l.entity === filter.entity) &&
      (!filter.from || wibDate(l.at) >= filter.from) &&
      (!filter.to || wibDate(l.at) <= filter.to)
  );
  const change = (e) => setFilter((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <>
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-amber-400/25">
        <span className="text-[11px] font-semibold tracking-widest uppercase text-amber-300">PANEL ADMIN NATAL 2026</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-['Cinzel'] text-gold-gradient tracking-wide uppercase">
          AUDIT LOG
        </h1>
        <p className="text-xs text-gray-400 font-light">Catatan aktivitas akun panitia, terbaru di atas.</p>
      </div>

      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['action', 'Aksi'],
          ['entity', 'Entitas'],
        ].map(([key, label]) => (
          <div key={key}>
            <label htmlFor={`audit-${key}`} className={labelClass}>{label}</label>
            <select id={`audit-${key}`} name={key} value={filter[key]} onChange={change} className={`${fieldClass} cursor-pointer`}>
              <option value="" className="bg-neutral-900">Semua</option>
              {options(key).map((o) => (
                <option key={o} value={o} className="bg-neutral-900">{o}</option>
              ))}
            </select>
          </div>
        ))}
        <DateField name="from" label="Dari tanggal" value={filter.from} onChange={change} />
        <DateField name="to" label="Sampai tanggal" value={filter.to} onChange={change} />
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        {logs === null ? (
          <p className="p-10 text-center text-sm text-gray-400">Memuat audit log...</p>
        ) : shown.length === 0 ? (
          <p className="p-10 text-center text-sm text-gray-400">Belum ada aktivitas yang cocok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/60 text-amber-200 border-b border-white/10 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Waktu</th>
                  <th className="py-3.5 px-4 font-semibold">Pengguna</th>
                  <th className="py-3.5 px-4 font-semibold">Aksi</th>
                  <th className="hidden sm:table-cell py-3.5 px-4 font-semibold">Entitas</th>
                  <th className="hidden md:table-cell py-3.5 px-4 font-semibold">Detail</th>
                  <th className="hidden lg:table-cell py-3.5 px-4 font-semibold">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-200">
                {shown.map((l) => (
                  <tr key={l.id} className="hover:bg-white/[0.03]">
                    <td className="py-3 px-4 whitespace-nowrap text-gray-300">{wibTime(l.at)}</td>
                    <td className="py-3 px-4 text-white">{l.user}</td>
                    <td
                      className={`py-3 px-4 font-semibold whitespace-nowrap ${
                        l.action === 'LOGIN GAGAL' || l.action === 'HAPUS' ? 'text-rose-300' : 'text-amber-200'
                      }`}
                    >
                      {l.action}
                    </td>
                    <td className="hidden sm:table-cell py-3 px-4 text-gray-300">{l.entity}</td>
                    <td className="hidden md:table-cell py-3 px-4 text-gray-300">{l.detail || '-'}</td>
                    <td className="hidden lg:table-cell py-3 px-4 font-mono text-emerald-300">{l.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
