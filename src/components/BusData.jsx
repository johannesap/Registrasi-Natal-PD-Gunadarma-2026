import React, { useState } from 'react';
import { Bus, MapPin, Phone, CheckCircle2, Clock } from 'lucide-react';
import { MEETING_POINTS } from '../utils/event';
import { intlPhone } from '../utils/phone';

const AREAS = Object.keys(MEETING_POINTS);

// Participants who depart together ("Bersama"), one list per meeting point
export default function BusData({ registrations }) {
  const [area, setArea] = useState(AREAS[0]);
  const riders = registrations.filter((r) => r.departure === 'Bersama');
  const inArea = riders.filter((r) => r.departureArea === area);

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-amber-400/25">
        <span className="text-[11px] font-semibold tracking-widest uppercase text-amber-300">
          Keberangkatan Bersama
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-['Cinzel'] text-gold-gradient tracking-wide uppercase">
          DATA BUS
        </h1>
        <p className="text-xs text-gray-400 font-light">{riders.length} peserta naik bus dari semua titik kumpul</p>
      </div>

      {/* Area labels with their rider count */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {AREAS.map((a) => {
          const count = riders.filter((r) => r.departureArea === a).length;
          const on = a === area;
          return (
            <button
              key={a}
              type="button"
              onClick={() => setArea(a)}
              aria-pressed={on}
              className={`glass-panel rounded-2xl p-4 sm:p-5 text-left border transition-all cursor-pointer ${
                on ? 'border-amber-400 shadow-[0_0_18px_rgba(243,196,48,0.25)]' : 'border-amber-400/20 hover:border-amber-400/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-200">{a}</span>
                <Bus className={`w-4 h-4 ${on ? 'text-amber-300' : 'text-emerald-400'}`} />
              </div>
              <div className="text-2xl sm:text-4xl font-extrabold font-mono text-white">{count}</div>
              <span className="text-[10px] text-gray-400 mt-1 block">Peserta</span>
            </button>
          );
        })}
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-amber-400/20">
        <div className="p-4 sm:p-5 border-b border-white/10">
          <h2 className="font-['Cinzel'] font-bold text-lg text-white">Titik Kumpul {area}</h2>
          <p className="text-[11px] text-gray-400 flex items-start gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
            <span>{MEETING_POINTS[area]}</span>
          </p>
        </div>

        {inArea.length === 0 ? (
          <p className="p-10 text-center text-sm text-gray-400">Belum ada peserta yang naik bus dari {area}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/60 text-amber-200 border-b border-white/10 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">No</th>
                  <th className="py-3.5 px-4 font-semibold">Nama</th>
                  <th className="py-3.5 px-4 font-semibold">WhatsApp</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Presensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-200">
                {inArea.map((r, idx) => (
                  <tr key={r.ticketId} className="hover:bg-white/[0.03]">
                    <td className="py-3.5 px-4 text-gray-400 font-mono">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{r.fullName}</div>
                      <div className="text-[11px] text-gray-400">{r.gender}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <a
                        href={`https://wa.me/${intlPhone(r.whatsapp)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-gray-300 hover:underline hover:text-emerald-300"
                      >
                        <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                        {r.whatsapp}
                      </a>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {r.isCheckedIn ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Hadir
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                          <Clock className="w-3.5 h-3.5 text-gray-500" /> Belum Hadir
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
