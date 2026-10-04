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
    this.hasUnlocked = false;
  }

  init() {
    if (typeof window === 'undefined' || this.isInitialized) return;

    // Use pre-existing <audio id="bg-music"> from index.html if available
    const existing = document.getElementById('bg-music');
    if (existing) {
      this.audio = existing;
    } else {
      this.audio = new Audio();
      this.audio.src = AUDIO_SRC_MP3;
    }

    this.audio.loop = true;
    this.audio.volume = 0.85;
    this.audio.preload = 'auto';

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.hasUnlocked = true;
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

    this.audio.addEventListener('error', () => {
      if (this.audio && this.audio.src.endsWith('.mp3')) {
        this.audio.src = AUDIO_SRC_OGG;
        if (this.isPlaying) {
          this.audio.play().catch(() => {});
        }
      }
    });

    this.isInitialized = true;
  }

  // Attempt instant autoplay on web load
  async attemptAutoplay() {
    this.init();
    if (!this.audio) return false;

    try {
      await this.audio.play();
      this.isPlaying = true;
      this.hasUnlocked = true;
      this.notify();
      return true;
    } catch {
      // Browser blocked unmuted autoplay without user gesture.
      // Listen for the very first micro-interaction anywhere on the screen
      this.setupFirstInteractionUnlock();
      return false;
    }
  }

  setupFirstInteractionUnlock() {
    if (this.hasUnlocked || typeof window === 'undefined') return;

    const unlock = () => {
      if (this.audio && this.audio.paused) {
        this.audio
          .play()
          .then(() => {
            this.isPlaying = true;
            this.hasUnlocked = true;
            this.notify();
          })
          .catch(() => {});
      }
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('touchstart', unlock, true);
      window.removeEventListener('touchend', unlock, true);
      window.removeEventListener('click', unlock, true);
      window.removeEventListener('scroll', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };

    window.addEventListener('pointerdown', unlock, { capture: true, once: true });
    window.addEventListener('touchstart', unlock, { capture: true, once: true });
    window.addEventListener('touchend', unlock, { capture: true, once: true });
    window.addEventListener('click', unlock, { capture: true, once: true });
    window.addEventListener('scroll', unlock, { capture: true, once: true });
    window.addEventListener('keydown', unlock, { capture: true, once: true });
  }

  // Play audio directly
  async play() {
    this.init();
    if (!this.audio) return false;

    try {
      await this.audio.play();
      this.isPlaying = true;
      this.hasUnlocked = true;
      this.notify();
      return true;
    } catch {
      try {
        if (this.audio.src.endsWith('.mp3')) {
          this.audio.src = AUDIO_SRC_OGG;
          await this.audio.play();
          this.isPlaying = true;
          this.hasUnlocked = true;
          this.notify();
          return true;
        }
      } catch (e) {
        console.warn('Audio playback error:', e);
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
        // ignore
      }
    }
  }
}

export const audioManager = new ChristmasAudioManager();
export default audioManager;
