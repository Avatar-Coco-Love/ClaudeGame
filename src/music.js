// S-44 (D-114): a quiet generative music bed, synthesized (no files). Pad chords by depth ring, plus one mode layer of
// equal level (pillar 3): Drift a soft sine bell, Surge a low sine pulse. Its own gain node under audio.master, so Volume
// and Mute apply; its own PRNG (seed + 'music'), never game.rng (D-025). Clock: the audio context's currentTime, with
// notes scheduled MUSIC_LOOKAHEAD_S ahead, so timing doesn't depend on the frame rate and a hidden page schedules nothing.
import { seededStream } from './world.js';
import {
  RING_PITCH_STEP, MUSIC_RING_MAX, MUSIC_GAIN, MUSIC_ROOT_HZ, MUSIC_SCALES, MUSIC_PROGRESSIONS, MUSIC_CHORD_S, MUSIC_ATTACK_S,
  MUSIC_RELEASE_S, MUSIC_PAD, MUSIC_BELL, MUSIC_PULSE, MUSIC_XFADE_S, MUSIC_END_FADE_S, MUSIC_LOOKAHEAD_S,
} from './config.js';

const LOG_MAX = 64;

export class Music {
  constructor(audio) {
    this.audio = audio;
    this.level = 0.5; // settings.music / 100
    this.bus = null; this.layers = null;
    this.live = new Set(); // notes whose oscillators haven't ended yet (each disconnects itself on 'ended')
    this.notes = []; // every scheduled note { t, stop, kind } (tests count voices from it); trimmed as notes end
    this.log = []; // first LOG_MAX notes { t, kind, hz } for the determinism check
    this.setSeed(0);
  }
  setSeed(seed) {
    this.rand = seededStream(seed, 'music');
    this.log = []; this.playing = false; this.chord = null; this.step = 0;
  }
  setLevel(v) {
    this.level = Math.max(0, Math.min(1, v));
    if (this.bus && this.playing) this.ramp(this.bus.gain, this.level * MUSIC_GAIN, 0.3);
  }
  between([a, b]) { return a + this.rand() * (b - a); }
  // A linear ramp from wherever the last ramp has the param at time `at` (tracked here: param.value can't be trusted
  // ahead of time, e.g. in an OfflineAudioContext before it renders, and cancelAndHoldAtTime isn't everywhere).
  ramp(param, to, secs, at = this.audio.ctx.currentTime) {
    const r = param._ramp || { from: 0, to: 0, t0: 0, t1: 0 };
    const from = at >= r.t1 ? r.to : at <= r.t0 ? r.from : r.from + (r.to - r.from) * (at - r.t0) / (r.t1 - r.t0);
    param.cancelScheduledValues(at);
    param.setValueAtTime(from, at);
    param.linearRampToValueAtTime(to, at + secs);
    param._ramp = { from, to, t0: at, t1: at + secs };
  }
  build() {
    const ctx = this.audio.ctx;
    this.bus = ctx.createGain(); this.bus.gain.setValueAtTime(0, ctx.currentTime); this.bus.connect(this.audio.master);
    this.layers = {};
    for (const k of ['bell', 'pulse']) {
      const g = ctx.createGain(); g.gain.setValueAtTime(0, ctx.currentTime); g.connect(this.bus); this.layers[k] = g;
    }
  }

  // state = { ring, mode, wake, ending } or null (title screen): null / ending / Music 0 / muted fade to silence.
  update(dt, state) {
    const a = this.audio, ctx = a.ctx;
    if (!ctx || !a.master) return;
    const on = !!state && !state.ending && this.level > 0 && !a.muted;
    if (!on) {
      if (this.playing) { this.playing = false; this.ramp(this.bus.gain, 0, MUSIC_END_FADE_S); }
      return; // nothing new is built or scheduled; ringing notes end on their own
    }
    const now = ctx.currentTime;
    if (!this.bus) this.build();
    if (!this.playing) { // start, or back from the ending card: fade in, first chord now
      this.playing = true;
      this.ramp(this.bus.gain, this.level * MUSIC_GAIN, MUSIC_END_FADE_S);
      // B-076 (audit 84): a chord still ringing (mute → unmute, Music 0 → back) keeps its schedule, so no second chord
      // stacks on it; the layers are kept too, so a mode changed meanwhile crossfades at the next chord.
      if (!this.chord || now >= this.chord.t + this.chord.len) { this.nextChord = now; this.nextBell = now + this.between(MUSIC_BELL.gapS); this.nextPulse = now; }
    }
    const want = state.wake || state.mode === 'surge' ? 'pulse' : 'bell';
    if (state.wake !== this.wake && this.layer) this.setLayer(want, now); // a Wake starts/ends now, not at the next chord
    this.wake = !!state.wake; this.ring = Math.max(0, Math.min(MUSIC_RING_MAX, state.ring | 0)); this.want = want;
    const until = now + MUSIC_LOOKAHEAD_S;
    // After a hidden page the clock jumped: start again from now instead of catching up a burst of notes.
    if (this.nextChord < now - 1) this.nextChord = now;
    if (this.nextBell < now - 1) this.nextBell = now;
    if (this.nextPulse < now - 1) this.nextPulse = now;
    while (this.nextChord < until) this.playChord(this.nextChord);
    if (this.chord) {
      while (this.nextBell < until) {
        if (this.layerOn('bell', this.nextBell)) this.bell(this.nextBell);
        this.nextBell += this.between(MUSIC_BELL.gapS);
      }
      const gap = 60 / MUSIC_PULSE.bpm / (this.wake ? MUSIC_PULSE.wakeRate : 1);
      while (this.nextPulse < until) {
        if (this.layerOn('pulse', this.nextPulse)) this.pulse(this.nextPulse);
        this.nextPulse += gap;
      }
    }
  }
  // A layer sounds while it is the current one or still fading out from it.
  layerOn(k, t) { return this.layer === k || (this.fadeFrom === k && t < this.fadeUntil); }
  setLayer(k, t) {
    if (this.layer === k) return;
    if (this.layer) { this.fadeFrom = this.layer; this.fadeUntil = t + MUSIC_XFADE_S; this.ramp(this.layers[this.layer].gain, 0, MUSIC_XFADE_S, t); }
    this.layer = k;
    this.ramp(this.layers[k].gain, 1, MUSIC_XFADE_S, t);
  }

  playChord(t) {
    const ring = this.ring, scale = MUSIC_SCALES[ring], prog = MUSIC_PROGRESSIONS[ring];
    const deg = this.wake ? 0 : prog[this.step++ % prog.length]; // a Wake holds the root chord
    const root = MUSIC_ROOT_HZ * Math.pow(2, -RING_PITCH_STEP * ring / 12);
    const semi = i => scale[i % scale.length] + 12 * Math.floor(i / scale.length);
    const len = this.between(MUSIC_CHORD_S);
    this.chord = { ring, scale, root, rootSemi: semi(deg), t, len };
    this.setLayer(this.want, t); // ring / mode changes land here, at the chord
    for (const i of [deg, deg + 2, deg + 4]) this.pad(root * Math.pow(2, semi(i) / 12), t, len);
    this.nextChord = t + len;
  }
  // One note: oscillators -> (lowpass) -> envelope gain -> dest. Every node disconnects when the oscillators end.
  voice(kind, hz, t, stop, oscs, dest, env, lowpass = 0) {
    const ctx = this.audio.ctx, g = ctx.createGain(), nodes = [g];
    let into = g;
    if (lowpass) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lowpass; f.Q.value = 0.5; f.connect(g); nodes.push(f); into = f; }
    env(g.gain);
    g.connect(dest);
    const note = { t, stop, kind };
    let left = oscs.length;
    for (const [type, mul, gain] of oscs) {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(hz * mul, t); og.gain.setValueAtTime(gain, t);
      o.connect(og); og.connect(into); nodes.push(o, og);
      o.onended = () => { if (--left === 0) { for (const n of nodes) n.disconnect(); this.live.delete(note); } };
      o.start(t); o.stop(stop);
    }
    this.live.add(note);
    this.notes.push(note);
    if (this.notes.length > 256) this.notes = this.notes.filter(n => n.stop > t - 1);
    if (this.log.length < LOG_MAX) this.log.push({ t: Math.round(t * 1000) / 1000, kind, hz: Math.round(hz * 100) / 100 });
  }
  pad(hz, t, len) {
    const P = MUSIC_PAD, rel = Math.min(MUSIC_RELEASE_S, len - MUSIC_ATTACK_S);
    this.voice('pad', hz, t, t + len, [['sine', 1, 1 - P.triMix], ['triangle', 1, P.triMix]], this.bus, g => {
      g.setValueAtTime(0, t);
      g.linearRampToValueAtTime(P.gain, t + MUSIC_ATTACK_S);
      g.setValueAtTime(P.gain, t + len - rel);
      g.linearRampToValueAtTime(0, t + len);
    }, P.lowpassHz);
  }
  bell(t) {
    const B = MUSIC_BELL, c = this.chord, i = Math.floor(this.rand() * c.scale.length);
    const hz = c.root * Math.pow(2, B.octave + c.scale[i] / 12);
    this.voice('bell', hz, t, t + B.decayS + 0.02, [['sine', 1, 1]], this.layers.bell, g => {
      g.setValueAtTime(0, t);
      g.linearRampToValueAtTime(B.gain, t + B.attackS);
      g.exponentialRampToValueAtTime(0.0001, t + B.decayS);
    });
  }
  pulse(t) {
    const P = MUSIC_PULSE, c = this.chord, hz = c.root * Math.pow(2, P.octave + c.rootSemi / 12);
    this.voice('pulse', hz, t, t + P.noteS + 0.02, [['sine', 1, 1]], this.layers.pulse, g => {
      g.setValueAtTime(0, t);
      g.linearRampToValueAtTime(P.gain, t + P.attackS);
      g.exponentialRampToValueAtTime(0.0001, t + P.noteS);
    });
  }
  // Notes sounding at audio time t (start ≤ t < stop): the voice budget (≤ MUSIC_MAX_VOICES).
  voicesAt(t) { return this.notes.filter(n => n.t <= t && t < n.stop).length; }
}
