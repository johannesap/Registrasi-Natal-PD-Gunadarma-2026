import React, { useState, useEffect, useRef } from 'react';
import { Music, Volume2, VolumeX } from 'lucide-react';

const AUDIO_SRC_MP3 = '/audio/jingle-bells.mp3';
const AUDIO_SRC_OGG = '/audio/jingle-bells.ogg';

export default function YouTubeAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Initialize native HTML5 Audio element for pure, crisp audio playback
  useEffect(() => {
    const audio = new Audio();
    audio.src = AUDIO_SRC_MP3;
    audio.loop = true;
    audio.volume = 0.8;
    audio.preload = 'auto';

    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('ended', () => {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    });

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Listen for auto-trigger event (e.g. when user clicks "MULAI REGISTRASI")
  useEffect(() => {
    const handleTriggerAudio = () => {
      const audio = audioRef.current;
      if (audio && !isPlaying) {
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    };

    window.addEventListener('start-christmas-audio', handleTriggerAudio);
    return () => {
      window.removeEventListener('start-christmas-audio', handleTriggerAudio);
    };
  }, [isPlaying]);

  // Toggle Play / Pause
  const handleTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        // Fallback to ogg format if browser prefers it
        try {
          audio.src = AUDIO_SRC_OGG;
          await audio.play();
          setIsPlaying(true);
        } catch (err) {
          console.error('Audio playback error:', err);
        }
      }
    }
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
      title={isPlaying ? 'Jeda Musik Natal' : 'Putar Musik Natal (Jingle Bells)'}
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