// B-016 beam-sound checks: render the beam hum offline (OfflineAudioContext, headless Chromium) through the real
// src/audio.js and measure it. Sessions can't listen, so the numbers are the judge (D-037). smoke.cjs calls browserChecks.
// Also usable alone: `node tests/audio.cjs` serves the repo, renders the beam and prints the measurements.

// Runs in the page. Renders `secs` of the beam held on (in contact with rock the whole time) at the default volume,
// then measures RMS/peak (dBFS), the RMS of the last second (the sustained level), and the spectrum (centroid, share of
// energy above 2 kHz) from Hann-windowed 4096-point FFT frames.
async function renderBeam([secs, vol]) {
  const { Audio } = await import('/src/audio.js');
  const sr = 44100, n = Math.floor(sr * secs);
  const ctx = new OfflineAudioContext(1, n, sr);
  const a = new Audio();
  a.ctx = ctx; a.master = ctx.createGain(); a.setVolume(vol); a.master.connect(ctx.destination);
  a.beam(true);
  if (a.beamContact) a.beamContact(true);
  const buf = (await ctx.startRendering()).getChannelData(0);
  const db = x => x > 0 ? 20 * Math.log10(x) : -999;
  const rms = (s, e) => { let q = 0; for (let i = s; i < e; i++) q += buf[i] * buf[i]; return Math.sqrt(q / Math.max(1, e - s)); };
  let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(buf[i]));
  // Spectrum: average power over frames of the last 2 s (the sustained part).
  const N = 4096, re = new Float64Array(N), im = new Float64Array(N), pow = new Float64Array(N / 2);
  const fft = () => {
    for (let i = 1, j = 0; i < N; i++) { let b = N >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= N; len <<= 1) {
      const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < N; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const ar = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, ai = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
          re[i + k + len / 2] = re[i + k] - ar; im[i + k + len / 2] = im[i + k] - ai; re[i + k] += ar; im[i + k] += ai;
          const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
        }
      }
    }
  };
  for (let s = n - 2 * sr; s + N <= n; s += N / 2) {
    for (let i = 0; i < N; i++) { re[i] = buf[s + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1))); im[i] = 0; }
    fft();
    for (let k = 0; k < N / 2; k++) pow[k] += re[k] * re[k] + im[k] * im[k];
  }
  let tot = 0, wsum = 0, hi = 0;
  for (let k = 1; k < N / 2; k++) { const f = k * sr / N; tot += pow[k]; wsum += f * pow[k]; if (f > 2000) hi += pow[k]; }
  // How long it stays loud: time after which every 50 ms window stays below -50 dBFS (secs = never drops).
  let quietFrom = 0;
  for (let s = 0; s + sr / 20 <= n; s += sr / 20) if (db(rms(s, s + sr / 20)) >= -50) quietFrom = (s + sr / 20) / sr;
  const r1 = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;
  return { rmsDb: r1(db(rms(0, n))), peakDb: r1(db(peak)), tailDb: r1(db(rms(n - sr, n))), centroidHz: Math.round(wsum / tot),
    above2k: r1(100 * hi / tot, 2), loudUntilS: r1(quietFrom, 2) };
}

// B-017/B-018 audit (session 24): render a script of one-shot sounds offline. `at(t, fn)` runs fn with the audio clock
// at t s, so throttles and per-run decay behave as in play. Returns peak, seconds above -45 dBFS (50 ms windows) and
// the share of energy above 4 kHz (square-wave buzz lives there).
async function renderSfx([script, secs]) {
  const { Audio } = await import('/src/audio.js');
  const sr = 44100, n = Math.floor(sr * secs), ctx = new OfflineAudioContext(1, n, sr);
  const a = new Audio(); a.ctx = ctx; a.master = ctx.createGain(); a.setVolume(0.7); a.master.connect(ctx.destination);
  let now = 0; Object.defineProperty(ctx, 'currentTime', { get: () => now });
  new Function('a', 'at', script)(a, (t, f) => { now = t; f(); });
  const buf = (await ctx.startRendering()).getChannelData(0), W = sr / 20, N = 1024;
  let peak = 0, loud = 0, tot = 0, hi = 0, hi2 = 0;
  for (const v of buf) peak = Math.max(peak, Math.abs(v));
  for (let s = 0; s + W <= n; s += W) { let e = 0; for (let i = s; i < s + W; i++) e += buf[i] * buf[i]; if (Math.sqrt(e / W) > 10 ** (-45 / 20)) loud++; }
  // Audit 119: a radix-2 FFT per 1024-sample frame (was a plain DFT: 74 s of the smoke for 28 sounds; same bins, same powers).
  const re = new Float64Array(N), im = new Float64Array(N);
  for (let s = 0; s + N <= n; s += N) {
    for (let i = 0; i < N; i++) { re[i] = buf[s + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1))); im[i] = 0; }
    for (let i = 1, j = 0; i < N; i++) { let b = N >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= N; len <<= 1) {
      const h = len / 2;
      for (let i = 0; i < N; i += len) for (let k = 0; k < h; k++) {
        const ang = -2 * Math.PI * k / len, cr = Math.cos(ang), ci = Math.sin(ang), u = i + k, v = u + h;
        const ar = re[v] * cr - im[v] * ci, ai = re[v] * ci + im[v] * cr;
        re[v] = re[u] - ar; im[v] = im[u] - ai; re[u] += ar; im[u] += ai;
      }
    }
    for (let k = 1; k < N / 2; k++) {
      const p = re[k] * re[k] + im[k] * im[k]; tot += p; if (k * sr / N > 4000) hi += p; if (k * sr / N > 2000) hi2 += p;
    }
  }
  const r1 = x => Math.round(x * 10) / 10;
  return { peakDb: r1(20 * Math.log10(peak || 1e-50)), loudS: loud / 20, above4k: r1(100 * hi / (tot || 1)), above2k: r1(100 * hi2 / (tot || 1)) };
}
const ONE_SHOTS = ["break('rock')", "break('lumen')", "pickup('prism')", 'deposit(0)', 'depositDone(3)', 'beamStart()', 'upgrade()',
  'cache()', 'scan()', 'scanCache()', 'beacon()', 'modeSwitch()', 'pulse(1)', 'pulseFizzle()', 'hurt()', 'enemyDie()', 'spit()', 'full()', 'spire()',
  'facet(true)', 'facet(false)', 'spireRelit()', 'anomaly()', 'anomalyEnd()', 'echoBlink()', 'overheat()', 'ventTell()', 'crunch()', 'riftOpen()', 'riftClose()', 'bossThump()', 'ember()', 'bossSting()'];

async function measure(page, secs = 4, vol = 0.7) { return page.evaluate(renderBeam, [secs, vol]); }

async function browserChecks(browser, url, check, errors) {
  const pg = await browser.newPage();
  pg.on('pageerror', e => errors.push('audio: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(150);
  const m = await measure(pg);
  // Old hum (sawtooth 92 Hz, gain 0.045, 13 Hz vibrato, never fades): rms -42.3, peak -36.1, tail -42.3, 2.47 % > 2 kHz, loud 4 s.
  // New (v0.1.25): rms -54.2, peak -39.9 (onset only), tail -56.7, 0 % > 2 kHz, loud 0.3 s.
  check('beam hum: sustained level ≤ -55 dBFS, drops below -50 within 1 s, < 0.5 % energy > 2 kHz (B-016)',
    m.tailDb <= -55 && m.loudUntilS <= 1 && m.above2k < 0.5 && m.peakDb <= -30, JSON.stringify(m));
  const v1 = await measure(pg, 4, 1), v0 = await measure(pg, 4, 0);
  check('beam hum follows the volume setting: 100 louder than 70, 0 silent (B-016, S-3)', v1.tailDb > m.tailDb && v0.peakDb === -999,
    `tail @100 ${v1.tailDb} dB, peak @0 ${v0.peakDb}`);
  // Old: enemyDie 2.8 %, hurt 1.1 % of energy above 4 kHz (square waves). New: every one-shot ≤ 0.5 %.
  const shots = {};
  for (const s of ONE_SHOTS) shots[s] = await pg.evaluate(renderSfx, [`a.${s}`, 1.5]);
  const bad = Object.entries(shots).filter(([, v]) => v.peakDb > -20 || v.above4k >= 1 || v.loudS > 0.5);
  check('every one-shot sound: peak ≤ -20 dBFS, < 1 % energy > 4 kHz, loud ≤ 0.5 s (B-018 audit)', bad.length === 0,
    bad.length ? JSON.stringify(bad) : `${ONE_SHOTS.length} sounds`);
  // S-14 Pulse: the release thump at full charge and the fizzle tick stay soft and low (spec: peak ≤ -28 dBFS, < 1 % > 2 kHz).
  const pul = shots['pulse(1)'], fiz = shots['pulseFizzle()'];
  check('Pulse release thump + fizzle: peak ≤ -28 dBFS, < 1 % energy > 2 kHz, loud ≤ 0.3 s (S-14)',
    [pul, fiz].every(v => v.peakDb <= -28 && v.above2k < 1 && v.loudS <= 0.3), JSON.stringify({ pul, fiz }));
  // S-27: a dormant Spire found: one soft low tone, held to S-14's ceilings (it plays once per Spire, in either mode).
  const sp = shots['spire()'];
  check('Spire found tone: peak ≤ -28 dBFS, < 1 % energy > 2 kHz, loud ≤ 0.5 s (S-27)', sp.peakDb <= -28 && sp.above2k < 1 && sp.loudS <= 0.5,
    JSON.stringify(sp));
  // S-28: a facet flip (one short sine) and the relit chime (rising 3-note sine): soft, low, short, like the found tone.
  const sf = [shots['facet(true)'], shots['facet(false)'], shots['spireRelit()']];
  check('facet flip + Spire relit tones: peak ≤ -24 dBFS, < 1 % energy > 2 kHz, loud ≤ 0.5 s (S-28)',
    sf.every(v => v.peakDb <= -24 && v.above2k < 1 && v.loudS <= 0.5), JSON.stringify(sf));
  // S-37: the Anomaly take (rising) and end (falling, after the deposit chime) tones: soft sines like the Spire set.
  const an = [shots['anomaly()'], shots['anomalyEnd()']];
  const oh = await pg.evaluate(renderSfx, ['a.overheat()', 1.5]); // S-48a: the Kiln overheat hiss
  check('Kiln overheat hiss: peak ≤ -24 dBFS, < 1 % energy > 2 kHz, loud ≤ 0.5 s (S-48a)', oh.peakDb <= -24 && oh.above2k < 1 && oh.loudS <= 0.5, JSON.stringify(oh));
  const vt = shots['ventTell()']; // audit 109: plays every 8 s per nearby vent, so held to the Spire tone's ceiling
  check('Kiln vent tell swell: peak ≤ -28 dBFS, < 1 % energy > 2 kHz, loud ≤ 0.5 s (audit 109)', vt && vt.peakDb <= -28 && vt.above2k < 1 && vt.loudS <= 0.5, JSON.stringify(vt));
  const cr = shots['crunch()']; // S-53c: the Burrower bite crunch, a short low noise burst
  check('Burrower bite crunch: peak ≤ -24 dBFS, < 1 % energy > 2 kHz, loud ≤ 0.3 s (S-53c)', cr && cr.peakDb <= -24 && cr.peakDb > -60 && cr.above2k < 1 && cr.loudS <= 0.3, JSON.stringify(cr));
  const ro = shots['riftOpen()'], rc = shots['riftClose()']; // S-57b: once per rift (every 4–6 min), soft sines like the Anomaly set
  check('Rift open + close chimes: peak ≤ -24 dBFS, close ≥ 3 dB softer, < 1 % energy > 2 kHz, loud ≤ 0.5 s (S-57b)',
    ro && rc && [ro, rc].every(v => v.peakDb <= -24 && v.peakDb > -60 && v.above2k < 1 && v.loudS <= 0.5) && rc.peakDb <= ro.peakDb - 3, JSON.stringify({ ro, rc }));
  const bt = shots['bossThump()'], em = shots['ember()']; // S-60b: an awake boss's flare thump (every 4 s close in) and ember lob (every 2 s)
  check('Boss flare thump + ember lob: peak ≤ -24 dBFS, < 1 % energy > 2 kHz, loud ≤ 0.3 s (S-60b)',
    bt && em && [bt, em].every(v => v.peakDb <= -24 && v.peakDb > -60 && v.above2k < 1 && v.loudS <= 0.3), JSON.stringify({ bt, em }));
  const bs = shots['bossSting()']; // S-62: once per wake / first plate, a low two-note sine sting
  check('Boss sting: peak ≤ -24 dBFS, < 1 % energy > 2 kHz, loud ≤ 0.9 s (S-62)', bs && bs.peakDb <= -24 && bs.peakDb > -60 && bs.above2k < 1 && bs.loudS <= 0.9, JSON.stringify(bs));
  check('Anomaly take + end tones: peak ≤ -24 dBFS, < 1 % energy > 2 kHz, loud ≤ 0.5 s (S-37)',
    an.every(v => v.peakDb <= -24 && v.above2k < 1 && v.loudS <= 0.5), JSON.stringify(an));
  // S-53b: the Burrower rumble (held while one is within 4 cells), alone on the music bus at the default Music 50: on at
  // full level 0–6 s (measured 3.5–6 s, after the bus fade-in), off at 6. A held sound: sustained ceiling, low only, and gone within 1 s of the Burrower leaving.
  const { renderMusic } = require('./music.cjs'), kiln = rumble => ({ ring: 4, mode: 'drift', wake: false, ending: false, rumble });
  const ru = await pg.evaluate(renderMusic, [[[0, kiln(1)], [6, kiln(0)]], 8, { only: 'rumble' }]);
  const ruOn = ru.win.slice(70, 120), ruTail = ru.win.slice(140);
  const rum = { onDb: Math.max(...ruOn), quietOnDb: Math.min(...ruOn), peakDb: ru.peakDb, above2k: ru.above2k, tailDb: Math.max(...ruTail) };
  check('Burrower rumble: held ≤ -45 dBFS per 50 ms (the bed is ~-47 RMS) and audible (≥ -60), peak ≤ -38, < 1 % energy > 2 kHz, silent 1 s after it leaves (S-53b)',
    rum.onDb <= -45 && rum.quietOnDb >= -60 && rum.peakDb <= -38 && rum.above2k < 1 && rum.tailDb < -80, JSON.stringify(rum));
  // A full hold (140 items, one every 35 ms as game.updateDeposit does). Old: loud 4.4 s. New: 0.35 s.
  const dep = await pg.evaluate(renderSfx, ['for (let i = 0; i < 140; i++) at(i * 0.035, () => a.deposit(i)); at(4.9, () => a.depositDone(2))', 6]);
  check('a 140-item deposit is not a 5 s beep chain: loud ≤ 1 s (B-017)', dep.loudS <= 1, JSON.stringify(dep));
  await pg.close();
  return m;
}

module.exports = { browserChecks, measure, renderSfx };

if (require.main === module) {
  (async () => {
    const { serve } = require('./serve.cjs'), { chromium } = require('playwright');
    const srv = await serve(), b = await chromium.launch(), pg = await b.newPage();
    await pg.goto(srv.url); await pg.waitForTimeout(150);
    console.log(JSON.stringify(await measure(pg)));
    await b.close(); await srv.close();
  })();
}
