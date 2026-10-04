import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Music, Star } from 'lucide-react';

export default function OpeningWelcomeGate({ onOpen }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      onClick={onOpen}
      onTouchStart={onOpen}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02040a]/95 backdrop-blur-md cursor-pointer select-none overflow-hidden"
    >
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[600px] h-[340px] sm:h-[600px] rounded-full pointer-events-none transform-gpu"
          style={{
            background:
              'radial-gradient(circle, rgba(245, 208, 97, 0.22) 0%, rgba(220, 38, 38, 0.08) 35%, rgba(6, 61, 46, 0.08) 60%, transparent 75%)',
          }}
        />
      </div>

      {/* Main Glass Invitation Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-md w-full glass-panel-subtle border border-amber-400/40 rounded-3xl p-6 sm:p-9 text-center shadow-[0_0_50px_rgba(245,208,97,0.25)] flex flex-col items-center"
      >
        {/* Glowing Star Icon */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 p-0.5 shadow-[0_0_30px_rgba(245,208,97,0.6)] flex items-center justify-center animate-gold-breath">
            <div className="w-full h-full rounded-full bg-[#030914] flex items-center justify-center">
              <Star className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300 fill-amber-300/40" />
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-amber-200 absolute -top-1 -right-1 animate-ping" />
        </div>

        {/* Institution & Event Label */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] tracking-[0.25em] uppercase font-semibold text-amber-200/90 border border-amber-400/30 bg-amber-950/40 mb-3">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>PERAYAAN NATAL 2026</span>
          <Sparkles className="w-3 h-3 text-amber-300" />
        </div>

        {/* Title */}
        <h1 className="font-['Cinzel'] font-bold text-xl sm:text-2xl text-gold-gradient tracking-wider uppercase mb-1">
          PERSEKUTUAN DOA
        </h1>
        <h2 className="font-sans font-light text-xs sm:text-sm text-gray-300 tracking-[0.2em] uppercase mb-4">
          UNIVERSITAS GUNADARMA
        </h2>

        {/* Theme Tagline */}
        <p className="font-['Cormorant_Garamond'] italic text-base sm:text-lg text-amber-200/90 mb-6">
          &ldquo;Merayakan Kasih, Menyalakan Harapan&rdquo;
        </p>

        {/* Interactive Open Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="gold-btn group w-full py-3.5 sm:py-4 px-6 rounded-full font-sans font-bold text-neutral-950 text-xs sm:text-sm tracking-widest uppercase cursor-pointer flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(245,208,97,0.5)] hover:shadow-[0_0_40px_rgba(245,208,97,0.8)] transition-all"
        >
          <Music className="w-4 h-4 text-amber-950 animate-bounce shrink-0" />
          <span>BUKA & PUTAR MUSIK NATAL</span>
          <Sparkles className="w-4 h-4 text-amber-950 group-hover:rotate-45 transition-transform shrink-0" />
        </button>

        <p className="mt-4 text-[11px] text-gray-400 font-light flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
          <span>Sentuh di mana saja untuk membuka & memulai animasi</span>
        </p>
      </motion.div>
    </motion.div>
  );
}
