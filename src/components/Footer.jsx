import React from 'react';
import { Heart, Sparkles, MapPin } from 'lucide-react';


export default function Footer() {
  return (
    <footer className="relative w-full border-t border-amber-400/10 bg-[#02050c]/80 backdrop-blur-xl py-8 sm:py-12 px-4 sm:px-6 z-20">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 text-center md:text-left">
        {/* Brand & Verse */}
        <div className="space-y-2 max-w-md">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <h4 className="font-['Cinzel'] font-bold text-xs sm:text-sm tracking-wider text-gold-gradient uppercase">
              NATAL PERSEKUTUAN DOA UNIVERSITAS GUNADARMA 2026
            </h4>
          </div>
          <p className="text-xs text-amber-100/70 italic font-['Cormorant_Garamond']">
            &ldquo;Sebab seorang anak telah lahir untuk kita, seorang putera telah diberikan untuk kita; lambang pemerintahan ada di atas bahunya...&rdquo; — Yesaya 9:5
          </p>
          <p className="text-[11px] sm:text-xs text-gray-500 font-light">
            Merayakan Kasih, Menyalakan Harapan bersama seluruh mahasiswa dan alumni Universitas Gunadarma.
          </p>
        </div>

        {/* Quick Links / Campus Info */}
        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-gray-400 font-light">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-300/80 shrink-0" />
            <span>Depok • Kalimalang • Karawaci • Cengkareng • Salemba • Simatupang</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center md:text-right text-[11px] text-gray-500 space-y-1">
          <p>© 2026 Panitia Natal Persekutuan Doa Universitas Gunadarma.</p>
          <p className="flex items-center justify-center md:justify-end gap-1 text-gray-400">
            Dibuat dengan <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> dalam kasih Kristus
          </p>
        </div>
      </div>
    </footer>
  );
}
