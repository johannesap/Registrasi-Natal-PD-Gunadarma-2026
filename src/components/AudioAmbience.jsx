import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, Sparkles } from 'lucide-react';

const BPM = 114;
const BEAT = 60 / BPM; // ~0.526s per beat

const NOTES = {
  REST: 0,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.00,
  A4: 440.00,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
};

// Complete Jingle Bells Chorus Melody
const JINGLE_BELLS = [
  // 1. Jin-gle bells, jin-gle bells, jin-gle all the way
  { note: NOTES.E4, beats: 1 },
  { note: NOTES.E4, beats: 1 },
  { note: NOTES.E4, beats: 2 },

  { note: NOTES.E4, beats: 1 },
  { note: NOTES.E4, beats: 1 },
  { note: NOTES.E4, beats: 2 },

  { note: NOTES.E4, beats: 1 },
  { note: NOTES.G4, beats: 1 },
  { note: NOTES.C4, beats: 1.5 },
  { note: NOTES.D4, beats: 0.5 },
  { note: NOTES.E4, beats: 3 },
  { note: NOTES.REST, beats: 1 },

  // 2. Oh what fun it is to ride in a one-horse open sleigh, hey!
  { note: NOTES.F4, beats: 1 },
  { note: NOTES.F4, beats: 1 },
  { note: NOTES.F4, beats: 1.5 },
  { note: NOTES.F4, beats: 0.5 },
  { note: NOTES.F4, beats: 1 },
  { note: NOTES.E4, beats: 1 },
  { note: NOTES.E4, beats: 1 },
  { note: NOTES.E4, beats: 0.5 },
  { note: NOTES.E4, beats: 0.5 },

  { note: NOTES.E4, beats: 1 },
  { note: NOTES.D4, beats: 1 },
  { note: NOTES.D4, beats: 1 },
  { note: NOTES.E4, beats: 1 },
  { note: NOTES.D4, beats: 2 },
  { note: NOTES.G4, beats: 2 },

  // 3. Jin-gle bells, jin-gle bells, jin-gle all the way
  { note: NOTES.E4, beats: 1 },
  { note: NOTES.E4, beats: 1 },
  { note: NOTES.E4, beats: 2 },

  { note: NOTES.E4, beats: 1 },
  { note: NOTES.E4, beats: 1 },
  { note: NOTES.E4, beats: 2 },

  { note: NOTES.E4, beats: 1 },
  { note: NOTES.G4, beats: 1 },
  { note: NOTES.C4, beats: 1.5 },
  { note: NOTES.D4, beats: 0.5 },
  { note: NOTES.E4, beats: 3 },
  { note: NOTES.REST, beats: 1 },

  // 4. Oh what fun it is to ride in a one-horse open sleigh!
  { note: NOTES.F4, beats: 1 },
  { note: NOTES.F4, beats: 1 },
  { note: NOTES.F4, beats: 1.5 },
  { note: NOTES.F4, beats: 0.5 },
  { note: NOTES.F4, beats: 1 },
  { note: NOTES.E4, beats: 1 },
  { note: NOTES.E4, beats: 1 },
  { note: NOTES.E4, beats: 0.5 },
  { note: NOTES.E4, beats: 0.5 },

  { note: NOTES.G4, beats: 1 },
  { note: NOTES.G4, beats: 1 },
  { note: NOTES.F4, beats: 1 },
  { note: NOTES.D4, beats: 1 },
  { note: NOTES.C4, beats: 3 },
  { note: NOTES.REST, beats: 2 },
];

export default function AudioAmbience() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef(null);
  const isPlayingRef = useRef(false);
  const loopTimeoutRef = useRef(null);
  const scheduledOscillatorsRef = useRef([]);

  // Synthesize a realistic Christmas Glockenspiel / Celesta Bell Strike
  const playBellNote = (ctx, masterGain, freq, startTime, duration) => {
    if (!freq || freq === 0) return;

    // 1. Fundamental Bell Tone (Pure, crystal clear)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    gain1.gain.setValueAtTime(0.0001, startTime);
    gain1.gain.exponentialRampToValueAtTime(0.18, startTime + 0.008);
    gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.max(duration * 1.5, 0.8));

    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(startTime);
    osc1.stop(startTime + Math.max(duration * 1.5, 0.8) + 0.1);
    scheduledOscillatorsRef.current.push(osc1);

    // 2. High Overtone (Metallic Christmas Chime Sparkle)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.76, startTime); // Bell acoustic partial

    gain2.gain.setValueAtTime(0.0001, startTime);
    gain2.gain.exponentialRampToValueAtTime(0.06, startTime + 0.005);
    gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);

    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(startTime);
    osc2.stop(startTime + 0.4);
    scheduledOscillatorsRef.current.push(osc2);

    // 3. Warm Octave Sub (Body of the bell)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(freq, startTime);

    gain3.gain.setValueAtTime(0.0001, startTime);
    gain3.gain.exponentialRampToValueAtTime(0.08, startTime + 0.015);
    gain3.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc3.connect(gain3);
    gain3.connect(masterGain);
    osc3.start(startTime);
    osc3.stop(startTime + duration + 0.1);
    scheduledOscillatorsRef.current.push(osc3);
  };

  // Schedule the entire Jingle Bells Song
  const scheduleJingleBells = (ctx, masterGain) => {
    if (!isPlayingRef.current) return;

    const startTime = ctx.currentTime + 0.1;
    let accumulatedTime = startTime;

    JINGLE_BELLS.forEach((item) => {
      const noteDuration = item.beats * BEAT;
      if (item.note > 0) {
        playBellNote(ctx, masterGain, item.note, accumulatedTime, noteDuration);
      }
      accumulatedTime += noteDuration;
    });

    const totalSongDuration = (accumulatedTime - startTime) * 1000;

    // Loop the melody seamlessly
    loopTimeoutRef.current = setTimeout(() => {
      if (isPlayingRef.current) {
        scheduleJingleBells(ctx, masterGain);
      }
    }, totalSongDuration);
  };

  const toggleSound = () => {
    if (!isPlaying) {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Master output volume (soft, pleasant, festive background level)
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.22, ctx.currentTime);
      masterGain.connect(ctx.destination);

      isPlayingRef.current = true;
      setIsPlaying(true);
      scheduleJingleBells(ctx, masterGain);
    } else {
      isPlayingRef.current = false;
      setIsPlaying(false);

      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
      }

      // Stop all active scheduled sounds
      scheduledOscillatorsRef.current.forEach((osc) => {
        try {
          osc.stop();
        } catch {
          // ignore already stopped
        }
      });
      scheduledOscillatorsRef.current = [];

      if (audioCtxRef.current) {
        audioCtxRef.current.suspend();
      }
    }
  };

  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return (
    <button
      onClick={toggleSound}
      type="button"
      className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wider transition-all duration-300 backdrop-blur-md border cursor-pointer group shadow-sm shrink-0"
      style={{
        background: isPlaying
          ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.25) 0%, rgba(220, 38, 38, 0.2) 100%)'
          : 'rgba(255, 255, 255, 0.05)',
        borderColor: isPlaying
          ? 'rgba(245, 208, 97, 0.5)'
          : 'rgba(255, 255, 255, 0.12)',
        color: isPlaying ? '#F5D061' : '#9ca3af',
      }}
      title={isPlaying ? 'Matikan Lagu Jingle Bells' : 'Putar Lagu Jingle Bells'}
    >
      {isPlaying ? (
        <>
          <Bell className="w-3.5 h-3.5 text-amber-300 animate-bounce shrink-0" />
          <span className="font-semibold text-amber-200 hidden sm:inline">Jingle Bells</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
        </>
      ) : (
        <>
          <BellOff className="w-3.5 h-3.5 group-hover:text-amber-300 transition-colors shrink-0" />
          <span className="group-hover:text-amber-200 transition-colors hidden sm:inline">Jingle Bells</span>
        </>
      )}
    </button>
  );
}
