import React from 'react';
import YouTubeAudio from './YouTubeAudio';

export default function Navbar({ onNavigate }) {
  return (
    <header className="fixed top-0 inset-x-0 z-40 px-3 sm:px-6 py-3 sm:py-4 pointer-events-none">
      <div className="max-w-6xl mx-auto flex items-center justify-between pointer-events-auto">
        {/* Brand / Emblem */}
        <button
          onClick={() => onNavigate('hero')}
          type="button"
          className="flex items-center gap-2 sm:gap-3 glass-panel-subtle px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-amber-400/20 backdrop-blur-md cursor-pointer hover:border-amber-400/40 transition-all text-left shrink-0"
        >
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
          {/* Background music */}
          <YouTubeAudio />
        </div>
      </div>
    </header>
  );
}
