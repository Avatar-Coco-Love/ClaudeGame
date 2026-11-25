// Tiny synthesized sound kit. No asset files; everything is oscillators (and one seeded noise burst, S-53c crunch, D-148).
import { DEFAULT_VOLUME, MASTER_GAIN_MAX, RING_PITCH_STEP, BEAM_HUM, DEPOSIT_TICK } from './config.js';

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
    if (this.beamOsc && this.ctx) this.beamOsc.o.frequency.setTargetAtTime(this.beamHz * 2, this.ctx.currentTime, 0.08);
  }
  // B-016: the hum was a constant sawtooth drone with a 13 Hz wobble (play-test: "very annoying"). Now a low-passed
  // triangle with a short soft onset that settles to a quiet bed; it lifts a little only while the beam touches something.
  beam(on) {
    if (!this.ctx) return;
    if (on && !this.beamOsc && !this.muted) {
      const H = BEAM_HUM, t = this.ctx.currentTime;
      const o = this.ctx.createOscillator(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      o.type = 'triangle'; o.frequency.value = this.beamHz * 2;
      f.type = 'lowpass'; f.frequency.value = H.lowpassHz; f.Q.value = 0.5;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(H.onsetGain, t + H.attackS);
      g.gain.setTargetAtTime(H.bedGain, t + H.attackS, H.settleS);
      o.connect(f); f.connect(g); g.connect(this.master);
      o.start(t);
      this.beamOsc = { o, g, contact: false, t0: t };
    } else if ((!on || this.muted) && this.beamOsc) {
      const { o, g } = this.beamOsc, t = this.ctx.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setTargetAtTime(0, t, 0.03);
      o.stop(t + 0.2);
      this.beamOsc = null;
    }
  }
  // Called every beam frame: true while the beam is cutting a cell or hitting a Glitch.
  beamContact(c) {
    const b = this.beamOsc;
    if (!b || !this.ctx || b.contact === !!c) return;
    b.contact = !!c;
    // Never cancel the onset: retarget only from the end of the attack (cancelling everything would jump to gain 1).
    const at = Math.max(this.ctx.currentTime, b.t0 + BEAM_HUM.attackS + 0.001);
    b.g.gain.cancelScheduledValues(at);
    b.g.gain.setTargetAtTime(c ? BEAM_HUM.contactGain : BEAM_HUM.bedGain, at, BEAM_HUM.settleS);
  }
  break(kind) {
    const base = kind === 'lumen' ? 1047 : kind === 'tide' ? 784 : kind === 'calx' ? 587 : kind === 'prism' ? 880 : kind === 'shard' ? 660 : 220;
    this.tone(base, 0.12, { type: 'triangle', vol: 0.18, slide: -base * 0.4, throttle: 0.04, key: 'break' });
  }
  pickup(kind) {
    this.tone(kind === 'lumen' ? 1568 : kind === 'tide' ? 1175 : kind === 'calx' ? 880 : kind === 'prism' ? 1320 : 990, 0.07, { type: 'sine', vol: 0.12, throttle: 0.03, key: 'pickup' });
  }
  // B-017: a full hold (up to 140 items, one every 35 ms) used to beep ~14 times a second for ~5 s. Now each tick of one
  // deposit run is quieter than the last and the run goes silent after ~10 ticks; the closing arpeggio still plays.
  deposit(i) {
    if (!this.ctx || this.muted) return;
    const D = DEPOSIT_TICK, now = this.ctx.currentTime, last = this.last.dep;
    if (last !== undefined && now - last < D.throttle) return;
    this.depRun = last !== undefined && now - last < D.resetS ? (this.depRun || 0) + 1 : 0;
    this.last.dep = now;
    const vol = D.vol * Math.pow(D.decay, this.depRun);
    if (vol < D.minVol) return;
    const notes = [523, 659, 784, 1047];
    this.tone(notes[i % 4], 0.14, { type: 'sine', vol });
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
  scan() { this.tone(1200, 0.3, { type: 'sine', vol: 0.14, slide: -600 }); } // S-11 Scanner sweep 1200 -> 600 Hz
  scanCache() { this.tone(784, 0.16, { type: 'sine', vol: 0.07 }); } // S-12: the cache chord's top note, short, when the ping finds one
  // S-27: a dormant Spire comes into view: one soft low tone (a sine fifth, G3 + D4, slow fade), quieter than a cache.
  spire() { this.tone(196, 0.45, { type: 'sine', vol: 0.05 }); this.tone(294, 0.4, { type: 'sine', vol: 0.025, delay: 0.05 }); }
  // S-28: a facet flips: one short soft sine, higher when it turns on. A relit Spire: a rising 3-note sine (G4 B4 D5).
  echoBlink() { this.tone(988, 0.14, { type: 'sine', vol: 0.035, slide: -240 }); } // S-42: the Echo blinks back, soft
  facet(on) { this.tone(on ? 740 : 494, 0.12, { type: 'sine', vol: 0.06 }); }
  spireRelit() { [392, 494, 587].forEach((f, i) => this.tone(f, 0.3, { type: 'sine', vol: 0.07, delay: i * 0.1 })); }
  anomaly() { [523, 659, 784].forEach((f, i) => this.tone(f, 0.16, { type: 'sine', vol: 0.06, slide: 120, delay: i * 0.06 })); } // S-35: a rising take tone
  anomalyEnd() { [784, 659, 523].forEach((f, i) => this.tone(f, 0.14, { type: 'sine', vol: 0.045, slide: -80, delay: 0.35 + i * 0.06 })); } // S-37: the take tone falling, after the deposit chime
  beacon() { this.tone(660, 0.22, { type: 'sine', vol: 0.07, slide: 220 }); } // S-16: a soft rising placement tone
  modeSwitch() { this.tone(520, 0.06, { type: 'sine', vol: 0.06 }); } // S-13: a short soft click when Q / ⟂ changes the beam
  // S-14: Pulse release, a soft low thump (sine, pitch drops) that grows with the charge; a fizzle is a faint short tick.
  pulse(charge) { this.tone(150, 0.2, { type: 'sine', vol: 0.04 + 0.06 * charge, slide: -80 }); }
  overheat() { this.tone(520, 0.4, { type: 'sine', vol: 0.05, slide: -340 }); this.tone(330, 0.35, { type: 'sine', vol: 0.03, slide: -200, delay: 0.05 }); } // S-48a: a soft falling hiss-sigh (sine only: no highs)
  ventTell() { this.tone(110, 0.45, { type: 'sine', vol: 0.06, slide: 110, throttle: 0.4, key: 'vent' }); } // audit 109: a Kiln vent's tell, a soft low rising swell
  pulseFizzle() { this.tone(360, 0.05, { type: 'sine', vol: 0.025 }); }
  // B-018: these two were square waves, the only buzzy (odd-harmonic-rich) sounds in the kit. Triangle keeps the pitch drop.
  hurt() { this.tone(160, 0.25, { type: 'triangle', vol: 0.16, slide: -90 }); }
  spit() { this.tone(520, 0.12, { type: 'triangle', vol: 0.07, slide: 260, throttle: 0.3, key: 'spit' }); } // S-32: a Spitter fires
  /** S-53c: a Burrower bites the hold: a short low noise burst (lowpassed noise, seeded so it renders the same each time). */
  crunch() {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, now = c.currentTime, n = Math.floor(c.sampleRate * 0.14), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    let r = 12345; for (let i = 0; i < n; i++) { r = (r * 1103515245 + 12345) & 0x7fffffff; d[i] = r / 0x3fffffff - 1; }
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'lowpass'; f.frequency.value = 260; f.Q.value = 0.7;
    g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.5, now + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    src.buffer = buf; src.connect(f); f.connect(g); g.connect(this.master); src.start(now); src.stop(now + 0.16);
  }
  enemyDie() { this.tone(420, 0.2, { type: 'triangle', vol: 0.11, slide: -300 }); }
  full() { this.tone(300, 0.18, { type: 'triangle', vol: 0.12, throttle: 1.2, key: 'full' }); }
}
