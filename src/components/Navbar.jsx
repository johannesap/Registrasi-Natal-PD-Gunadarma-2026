import React from 'react';
import { Sparkles, RotateCcw, Ticket, Home, ArrowLeft } from 'lucide-react';
import YouTubeAudio from './YouTubeAudio';

export default function Navbar({
  currentPage,
  onNavigate,
  onReplayOpening,
}) {
  return (
    <header className="fixed top-0 inset-x-0 z-40 px-3 sm:px-6 py-3 sm:py-4 pointer-events-none">
      <div className="max-w-6xl mx-auto flex items-center justify-between pointer-events-auto">
        {/* Brand / Emblem */}
        <button
          onClick={() => onNavigate('hero')}
          type="button"
          className="flex items-center gap-2 sm:gap-3 glass-panel-subtle px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-amber-400/20 backdrop-blur-md cursor-pointer hover:border-amber-400/40 transition-all text-left shrink-0"
        >
          {/* Gold Cross / Star Emblem */}
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 flex items-center justify-center shadow-[0_0_15px_rgba(245,208,97,0.4)] shrink-0">
            <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-neutral-950" />
          </div>
          <div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-['Cinzel'] font-bold text-xs sm:text-sm text-gold-gradient tracking-wider whitespace-nowrap">
                NATAL PD UG
              </span>
              <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 font-mono">
                2026
              </span>
            </div>
            <span className="hidden lg:block text-[9px] uppercase tracking-[0.2em] text-gray-400 font-light">
              Universitas Gunadarma
            </span>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Replay Opening Button (shows when on hero) */}
          <button
            onClick={onReplayOpening}
            type="button"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium text-gray-300 hover:text-amber-200 glass-panel-subtle hover:border-amber-400/30 transition-all duration-300 cursor-pointer"
            title="Putar Ulang Animasi Opening"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden md:inline">Ulang Opening</span>
          </button>

          {/* YouTube background music */}
          <YouTubeAudio />

          {/* Return to Home button when on registration or admin page */}
          {(currentPage === 'registration' || currentPage === 'admin') && (
            <button
              onClick={() => onNavigate('hero')}
              type="button"
              className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold text-amber-200 bg-white/5 border border-amber-400/30 hover:bg-white/10 hover:border-amber-400/60 transition-all duration-300 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="whitespace-nowrap">Halaman Utama</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
