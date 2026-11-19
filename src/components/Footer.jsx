import React from 'react';
import { Heart, MapPin, Phone } from 'lucide-react';
import { intlPhone } from '../utils/phone';
import { CAMPUS_REGIONS } from '../utils/regions';

const CONTACTS = [
  { name: 'Ester', areas: 'Depok', phone: '0895810021400' },
  { name: 'Inggrid', areas: 'Kalimalang dan Salemba', phone: '0895610453877' },
  { name: 'Helena', areas: 'Karawaci dan Cengkareng', phone: '0881011140682' },
];

export default function Footer() {
  return (
    <footer className="relative w-full border-t border-amber-400/10 bg-[#06140f]/85 backdrop-blur-xl py-8 sm:py-12 px-4 sm:px-6 z-20">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-6 sm:gap-8 text-center md:text-left">
        {/* Contact persons (WhatsApp) */}
        <div className="space-y-2">
          <h4 className="font-['Cinzel'] font-bold text-xs sm:text-sm tracking-wider text-gold-gradient uppercase">
            Kontak Person
          </h4>
          <ul className="space-y-1.5 text-[11px] sm:text-xs text-gray-300">
            {CONTACTS.map((c) => (
              <li key={c.name}>
                <a
                  href={`https://wa.me/${intlPhone(c.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-amber-200 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    <strong className="text-white font-semibold">{c.name}</strong> ({c.areas}) —{' '}
                    <span className="font-mono">{c.phone}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Campus Info + Copyright */}
        <div className="text-center md:text-right text-[11px] text-gray-500 space-y-1">
          <p className="flex items-center justify-center md:justify-end gap-1.5 text-[11px] sm:text-xs text-gray-400 font-light pb-1">
            <MapPin className="w-3.5 h-3.5 text-amber-300/80 shrink-0" />
            <span>{CAMPUS_REGIONS.map((r) => r.name).join(' • ')}</span>
          </p>
          <p>© 2026 Panitia Natal Persekutuan Doa Universitas Gunadarma.</p>
          <p className="flex items-center justify-center md:justify-end gap-1 text-gray-400">
            Dibuat dengan <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> dalam kasih Kristus
          </p>
        </div>
      </div>
    </footer>
  );
}
