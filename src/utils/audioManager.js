// Centralized Audio Manager for Natal PD Gunadarma 2026
// Plays the <audio id="bg-music"> from index.html: autoplay on load, else on the first tap; shares play state

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

    // index.html sets the song, loop and preload
    this.audio = document.getElementById('bg-music');
    this.audio.volume = 0.85;

    // The only place play state changes: every way of starting or stopping the song fires these events
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.hasUnlocked = true;
      this.notify();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.notify();
    });

    this.isInitialized = true;
  }

  // Attempt instant autoplay on web load
  async attemptAutoplay() {
    this.init();
    if (!this.audio) return false;

    // Pre-arm interaction unlock listener immediately
    this.setupFirstInteractionUnlock();

    try {
      await this.audio.play();
      return true;
    } catch {
      // Browser blocked unmuted autoplay.
      // The interaction listeners are waiting and will fire automatically on the first screen tap/scroll!
      return false;
    }
  }

  setupFirstInteractionUnlock() {
    if (this.hasUnlocked || typeof window === 'undefined') return;

    const tryUnlock = async () => {
      if (this.hasUnlocked || !this.audio) return;

      try {
        await this.audio.play();
        cleanup();
      } catch {
        // If this specific event (e.g. pointerdown) was not accepted by browser policy,
        // DO NOT cleanup! Let the subsequent touchend or click in the tap sequence try.
      }
    };

    const cleanup = () => {
      const events = ['click', 'touchend', 'pointerup', 'pointerdown', 'touchstart', 'scroll', 'keydown'];
      events.forEach((evt) => {
        window.removeEventListener(evt, tryUnlock, true);
        document.removeEventListener(evt, tryUnlock, true);
      });
    };

    // Listen on both window and document to catch ANY screen touch or gesture
    const events = ['click', 'touchend', 'pointerup', 'pointerdown', 'touchstart', 'scroll', 'keydown'];
    events.forEach((evt) => {
      window.addEventListener(evt, tryUnlock, { capture: true, passive: true });
      document.addEventListener(evt, tryUnlock, { capture: true, passive: true });
    });
  }

  // Play audio directly
  async play() {
    this.init();
    if (!this.audio) return false;

    try {
      await this.audio.play();
      return true;
    } catch (e) {
      console.warn('Audio playback error:', e);
      return false;
    }
  }

  pause() {
    this.audio?.pause();
  }

  async toggle() {
    if (this.isPlaying) {
      this.pause();
      return false;
    } else {
      return await this.play();
    }
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
