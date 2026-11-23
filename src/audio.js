// Tiny synthesized sound kit. No asset files; everything is oscillators.
export class Audio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.beamOsc = null;
    this.last = {};
  }
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    } catch { this.ctx = null; }
  }
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.35;
  }
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
  beam(on) {
    if (!this.ctx) return;
    if (on && !this.beamOsc && !this.muted) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain(), lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 92;
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
    const base = kind === 'prism' ? 880 : kind === 'shard' ? 660 : 220;
    this.tone(base, 0.12, { type: 'triangle', vol: 0.18, slide: -base * 0.4, throttle: 0.04, key: 'break' });
  }
  pickup(kind) {
    this.tone(kind === 'prism' ? 1320 : 990, 0.07, { type: 'sine', vol: 0.12, throttle: 0.03, key: 'pickup' });
  }
  deposit(i) {
    const notes = [523, 659, 784, 1047];
    this.tone(notes[i % 4], 0.14, { type: 'sine', vol: 0.12, throttle: 0.045, key: 'dep' });
  }
  upgrade() {
    [523, 784, 1047, 1568].forEach((f, i) => this.tone(f, 0.25, { type: 'triangle', vol: 0.14, delay: i * 0.07 }));
  }
  hurt() { this.tone(160, 0.25, { type: 'square', vol: 0.15, slide: -90 }); }
  enemyDie() { this.tone(420, 0.2, { type: 'square', vol: 0.1, slide: -300 }); }
  full() { this.tone(300, 0.18, { type: 'triangle', vol: 0.12, throttle: 1.2, key: 'full' }); }
}
