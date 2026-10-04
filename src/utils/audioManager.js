// Centralized Audio Manager for Natal PD Gunadarma 2026
// Handles HTML5 Audio playback, autoplay detection, synchronization, and fallbacks

const AUDIO_SRC_MP3 = '/audio/jingle-bells.mp3';
const AUDIO_SRC_OGG = '/audio/jingle-bells.ogg';

class ChristmasAudioManager {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.listeners = new Set();
    this.isInitialized = false;
    this.autoplayAttempted = false;
    this.autoplayAllowed = false;
  }

  init() {
    if (typeof window === 'undefined' || this.isInitialized) return;

    this.audio = new Audio();
    this.audio.src = AUDIO_SRC_MP3;
    this.audio.loop = true;
    this.audio.volume = 0.85;
    this.audio.preload = 'auto';

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.notify();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.notify();
    });

    this.audio.addEventListener('ended', () => {
      if (this.audio) {
        this.audio.currentTime = 0;
        this.audio.play().catch(() => {});
      }
    });

    this.audio.addEventListener('error', (e) => {
      // If MP3 fails, attempt fallback to OGG
      if (this.audio && this.audio.src.endsWith('.mp3')) {
        this.audio.src = AUDIO_SRC_OGG;
        if (this.isPlaying) {
          this.audio.play().catch(() => {});
        }
      }
    });

    this.isInitialized = true;
  }

  // Attempt immediate autoplay on initial page load
  async attemptAutoplay() {
    this.init();
    if (!this.audio) return false;

    this.autoplayAttempted = true;

    try {
      // Try playing unmuted
      await this.audio.play();
      this.isPlaying = true;
      this.autoplayAllowed = true;
      this.notify();
      return true;
    } catch (err) {
      // Browser blocked unmuted autoplay without user gesture
      this.isPlaying = false;
      this.autoplayAllowed = false;
      this.notify();
      return false;
    }
  }

  // Play audio (e.g. on user gesture or toggle)
  async play() {
    this.init();
    if (!this.audio) return false;

    try {
      await this.audio.play();
      this.isPlaying = true;
      this.notify();
      return true;
    } catch (err) {
      // Try OGG fallback
      try {
        if (this.audio.src.endsWith('.mp3')) {
          this.audio.src = AUDIO_SRC_OGG;
          await this.audio.play();
          this.isPlaying = true;
          this.notify();
          return true;
        }
      } catch (e) {
        console.warn('Audio playback failed:', e);
      }
      return false;
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
      this.isPlaying = false;
      this.notify();
    }
  }

  async toggle() {
    if (this.isPlaying) {
      this.pause();
      return false;
    } else {
      return await this.play();
    }
  }

  async restart() {
    this.init();
    if (this.audio) {
      this.audio.currentTime = 0;
    }
    return await this.play();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.isPlaying);
    return () => {
      this.listeners.delete(callback);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.isPlaying);
      } catch {
        // ignore listener errors
      }
    }
  }
}

export const audioManager = new ChristmasAudioManager();
export default audioManager;
