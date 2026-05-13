'use client';

// Lightweight audio manager. Loads on demand, handles mobile autoplay restrictions,
// and exposes a single mute toggle stored in localStorage.

export type SoundId =
  | 'wheel_spin'
  | 'wheel_stop'
  | 'reveal'
  | 'correct'
  | 'wrong'
  | 'confetti'
  | 'mission'
  | 'tick'
  | 'background';

const FILES: Record<SoundId, string> = {
  wheel_spin: '/sounds/wheel-spin.mp3',
  wheel_stop: '/sounds/wheel-stop.mp3',
  reveal: '/sounds/reveal.mp3',
  correct: '/sounds/correct.mp3',
  wrong: '/sounds/wrong.mp3',
  confetti: '/sounds/confetti.mp3',
  mission: '/sounds/mission.mp3',
  tick: '/sounds/tick.mp3',
  background: '/sounds/background-loop.mp3',
};

const VOLUME: Record<SoundId, number> = {
  wheel_spin: 0.65,
  wheel_stop: 0.85,
  reveal: 0.85,
  correct: 0.8,
  wrong: 0.6,
  confetti: 0.7,
  mission: 0.8,
  tick: 0.4,
  background: 0.15,
};

const MUTE_KEY = 'orelplay.muted';

class AudioManager {
  private cache = new Map<SoundId, HTMLAudioElement>();
  private muted = false;
  private unlocked = false;
  private listeners = new Set<(muted: boolean) => void>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.muted = window.localStorage.getItem(MUTE_KEY) === '1';
      const unlock = () => {
        this.unlocked = true;
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('pointerdown', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
    }
  }

  private get(id: SoundId): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    let el = this.cache.get(id);
    if (!el) {
      el = new Audio(FILES[id]);
      el.preload = 'auto';
      el.volume = VOLUME[id];
      this.cache.set(id, el);
    }
    return el;
  }

  play(id: SoundId) {
    if (this.muted) return;
    const el = this.get(id);
    if (!el) return;
    if (!this.unlocked && id !== 'background') {
      // Pre-unlock, browsers throw on play(). Swallow silently.
      void el.play().catch(() => {});
      return;
    }
    try {
      el.currentTime = 0;
      void el.play().catch(() => {});
    } catch {
      /* ignore */
    }
  }

  loop(id: SoundId) {
    if (this.muted) return;
    const el = this.get(id);
    if (!el) return;
    el.loop = true;
    void el.play().catch(() => {});
  }

  stop(id: SoundId) {
    const el = this.cache.get(id);
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }

  setMuted(value: boolean) {
    this.muted = value;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MUTE_KEY, value ? '1' : '0');
    }
    if (value) {
      this.cache.forEach((el) => el.pause());
    }
    this.listeners.forEach((cb) => cb(value));
  }

  toggleMuted() {
    this.setMuted(!this.muted);
  }

  isMuted() {
    return this.muted;
  }

  subscribe(cb: (muted: boolean) => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }
}

let instance: AudioManager | null = null;

export function getAudio(): AudioManager {
  if (!instance) instance = new AudioManager();
  return instance;
}
