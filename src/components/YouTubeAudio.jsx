import React, { useState, useEffect } from 'react';
import { Music } from 'lucide-react';
import audioManager from '../utils/audioManager';

export default function YouTubeAudio() {
  const [isPlaying, setIsPlaying] = useState(audioManager.isPlaying);

  useEffect(() => {
    // Subscribe to global audio manager state
    const unsubscribe = audioManager.subscribe((playing) => {
      setIsPlaying(playing);
    });
    return unsubscribe;
  }, []);

  const handleTogglePlay = async () => {
    await audioManager.toggle();
  };

  return (
    <button
      onClick={handleTogglePlay}
      type="button"
      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 backdrop-blur-md border cursor-pointer group shadow-sm shrink-0 ${
        isPlaying
          ? 'bg-gradient-to-r from-amber-500/30 via-red-500/20 to-amber-600/30 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(245,208,97,0.45)]'
          : 'bg-white/10 hover:bg-white/15 border-amber-400/30 text-amber-100 hover:border-amber-400/60 shadow-[0_0_12px_rgba(245,208,97,0.15)] animate-pulse'
      }`}
      title={isPlaying ? 'Jeda Musik Natal (Jingle Bells)' : 'Putar Musik Natal (Jingle Bells)'}
      aria-label={isPlaying ? 'Jeda Musik Natal' : 'Putar Musik Natal'}
    >
      {isPlaying ? (
        <>
          {/* Animated Equalizer Waves */}
          <div className="flex items-end gap-0.5 h-3.5 w-3.5 shrink-0 py-0.5">
            <span className="w-0.5 bg-amber-300 rounded-full animate-[bounce_0.7s_infinite] h-full" />
            <span className="w-0.5 bg-amber-200 rounded-full animate-[bounce_1.0s_infinite_0.2s] h-2/3" />
            <span className="w-0.5 bg-amber-400 rounded-full animate-[bounce_0.8s_infinite_0.4s] h-4/5" />
          </div>
          <span className="font-bold text-amber-200 text-xs hidden sm:inline">Jingle Bells</span>
        </>
      ) : (
        <>
          <Music className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform shrink-0" />
          <span className="font-semibold text-amber-200 text-xs hidden sm:inline">Putar Musik Natal</span>
        </>
      )}
    </button>
  );
}