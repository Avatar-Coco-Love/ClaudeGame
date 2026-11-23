// Tiny synthesized sound kit. No asset files; everything is oscillators.
import { DEFAULT_VOLUME, MASTER_GAIN_MAX, RING_PITCH_STEP } from './config.js';

export class Audio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = DEFAULT_VOLUME / 100; // 0-1 (settings volume / 100)
    this.beamOsc = null;
    this.beamHz = 92; // S-8: drops RING_PITCH_STEP semitones per depth ring
    this.last = {};
  }
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.applyGain();
      this.master.connect(this.ctx.destination);
    } catch { this.ctx = null; }
  }
  applyGain() { if (this.master) this.master.gain.value = this.muted ? 0 : this.volume * MASTER_GAIN_MAX; }
  setMuted(m) { this.muted = m; this.applyGain(); }
  setVolume(v) { this.volume = Math.max(0, Math.min(1, v)); this.applyGain(); }
  tone(freq, dur, { type = 'sine', vol = 0.3, slide = 0, delay = 0, throttle = 0, key = null } = {}) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    if (throttle && key) {
      if (this.last[key] && now - this.last[key] < throttle) return;
      this.last[key] = now;
    }
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, now + delay);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), now + delay + dur);
    g.gain.setValueAtTime(0.0001, now + delay);
    g.gain.exponentialRampToValueAtTime(vol, now + delay + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
    o.connect(g); g.connect(this.master);
    o.start(now + delay); o.stop(now + delay + dur + 0.02);
  }
  setRing(r) {
    this.beamHz = 92 * Math.pow(2, -RING_PITCH_STEP * r / 12);
    if (this.beamOsc && this.ctx) this.beamOsc.o.frequency.setTargetAtTime(this.beamHz, this.ctx.currentTime, 0.08);
  }
  beam(on) {
    if (!this.ctx) return;
    if (on && !this.beamOsc && !this.muted) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain(), lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = this.beamHz;
      lfo.frequency.value = 13; lg.gain.value = 14;
      lfo.connect(lg); lg.connect(o.frequency);
      g.gain.value = 0.045;
      o.connect(g); g.connect(this.master);
      o.start(); lfo.start();
      this.beamOsc = { o, lfo, g };
    } else if ((!on || this.muted) && this.beamOsc) {
      const { o, lfo, g } = this.beamOsc;
      g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
      o.stop(this.ctx.currentTime + 0.15); lfo.stop(this.ctx.currentTime + 0.15);
      this.beamOsc = null;
    }
  }
  break(kind) {
    const base = kind === 'lumen' ? 1047 : kind === 'prism' ? 880 : kind === 'shard' ? 660 : 220;
    this.tone(base, 0.12, { type: 'triangle', vol: 0.18, slide: -base * 0.4, throttle: 0.04, key: 'break' });
  }
  pickup(kind) {
    this.tone(kind === 'lumen' ? 1568 : kind === 'prism' ? 1320 : 990, 0.07, { type: 'sine', vol: 0.12, throttle: 0.03, key: 'pickup' });
  }
  deposit(i) {
    const notes = [523, 659, 784, 1047];
    this.tone(notes[i % 4], 0.14, { type: 'sine', vol: 0.12, throttle: 0.045, key: 'dep' });
  }
  // S-4: a rising 3-note arpeggio when the hold is empty: one note per resource kind deposited, then a top note (max 3).
  depositDone(kinds) {
    const notes = [784, 988, 1319], n = Math.min(3, Math.max(1, kinds) + 1);
    for (let i = 0; i < n; i++) this.tone(notes[i], 0.18, { type: 'triangle', vol: 0.13, delay: 0.06 + i * 0.09 });
  }
  // S-4: a short rising sine sweep when the beam switches on (not repeated while it stays on).
  beamStart() { this.tone(330, 0.12, { type: 'sine', vol: 0.1, slide: 330 }); }
  upgrade() {
    [523, 784, 1047, 1568].forEach((f, i) => this.tone(f, 0.25, { type: 'triangle', vol: 0.14, delay: i * 0.07 }));
  }
  // S-9: a vault cache opens with a bright major chord (all three notes together), then a high sparkle.
  cache() {
    [523, 659, 784].forEach(f => this.tone(f, 0.5, { type: 'triangle', vol: 0.1 }));
    this.tone(2093, 0.25, { type: 'sine', vol: 0.08, delay: 0.12 });
  }
  hurt() { this.tone(160, 0.25, { type: 'square', vol: 0.15, slide: -90 }); }
  enemyDie() { this.tone(420, 0.2, { type: 'square', vol: 0.1, slide: -300 }); }
  full() { this.tone(300, 0.18, { type: 'triangle', vol: 0.12, throttle: 1.2, key: 'full' }); }
}
