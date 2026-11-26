// S-44 (D-114) ambient music checks: render src/music.js offline (OfflineAudioContext, headless Chromium) at the default
// Volume and Music settings and measure it (D-037: measured, not heard). smoke.cjs calls browserChecks.
// Alone: `node tests/music.cjs` serves the repo and prints the measurements for every scenario.
const { newWorld } = require('./pinworld.cjs');

// Runs in the page. `states` is a list of [fromSecond, state] (state null = title screen); the music is stepped at 60 Hz
// with the audio clock faked to the step time (as audio.cjs renderSfx does), then rendered and measured.
async function renderMusic([states, secs, { music = 50, volume = 70, seed = 4242, only = null } = {}]) {
  const { Audio } = await import('/src/audio.js');
  const { Music } = await import('/src/music.js');
  const sr = 22050, n = Math.floor(sr * secs), ctx = new OfflineAudioContext(1, n, sr);
  const a = new Audio(); a.ctx = ctx; a.master = ctx.createGain(); a.setVolume(volume / 100); a.master.connect(ctx.destination);
  let now = 0; Object.defineProperty(ctx, 'currentTime', { get: () => now });
  const m = new Music(a); m.setSeed(seed); m.setLevel(music / 100);
  const C = await import('/src/config.js'), padGain = C.MUSIC_PAD.gain, bellGain = C.MUSIC_BELL.gain, pulseGain = C.MUSIC_PULSE.gain;
  if (only === 'layer' || only === 'rumble') C.MUSIC_PAD.gain = 0; // measure a mode layer alone (restored below)
  if (only === 'rumble') C.MUSIC_BELL.gain = C.MUSIC_PULSE.gain = 0; // S-53b: the Burrower rumble alone
  let maxVoices = 0, built = 0;
  const orig = ctx.createOscillator.bind(ctx); ctx.createOscillator = () => { built++; return orig(); };
  const stateAt = t => { let s = null; for (const [from, st] of states) if (t >= from) s = st; return s; };
  for (let i = 0; i * (1 / 60) < secs; i++) {
    now = i / 60; m.update(1 / 60, stateAt(now));
    maxVoices = Math.max(maxVoices, m.voicesAt(now), m.voicesAt(now + 0.05));
  }
  const scheduled = m.notes.length, endedBy = m.notes.filter(x => x.stop < secs - 0.05).length;
  C.MUSIC_PAD.gain = padGain; C.MUSIC_BELL.gain = bellGain; C.MUSIC_PULSE.gain = pulseGain;
  const buf = (await ctx.startRendering()).getChannelData(0);
  await new Promise(r => setTimeout(r, 50)); // 'ended' events are dispatched after rendering
  const db = x => x > 0 ? 20 * Math.log10(x) : -999, r1 = x => Math.round(x * 10) / 10;
  const rms = (s, e) => { let q = 0; for (let i = s; i < e; i++) q += buf[i] * buf[i]; return Math.sqrt(q / Math.max(1, e - s)); };
  let peak = 0; for (const v of buf) peak = Math.max(peak, Math.abs(v));
  const W = Math.round(sr / 20), win = []; // B-091: 22050 / 20 is fractional; odd windows read NaN (-999) before
  for (let s = 0; s + W <= n; s += W) win.push(db(rms(s, s + W)));
  // Spectrum share above 2 kHz: Hann-windowed 2048-point FFT frames over the whole render.
  const N = 2048, re = new Float64Array(N), im = new Float64Array(N);
  let tot = 0, hi = 0;
  for (let s = 0; s + N <= n; s += N) {
    for (let i = 0; i < N; i++) { re[i] = buf[s + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1))); im[i] = 0; }
    for (let i = 1, j = 0; i < N; i++) { let b = N >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= N; len <<= 1) {
      const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < N; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const p = i + k + len / 2, ar = re[p] * cr - im[p] * ci, ai = re[p] * ci + im[p] * cr;
          re[p] = re[i + k] - ar; im[p] = im[i + k] - ai; re[i + k] += ar; im[i + k] += ai;
          const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
        }
      }
    }
    for (let k = 1; k < N / 2; k++) { const p = re[k] * re[k] + im[k] * im[k]; tot += p; if (k * sr / N > 2000) hi += p; }
  }
  // Sustained level: the RMS after the 3 s fade-in. Last loud moment: end of the last 50 ms window above -80 dBFS.
  let lastSound = 0; win.forEach((d, i) => { if (d > -80) lastSound = (i + 1) / 20; });
  return { rmsDb: r1(db(rms(3 * sr, n))), peakDb: r1(db(peak)), maxWinDb: r1(Math.max(...win)), above2k: Math.round(10000 * hi / (tot || 1)) / 100,
    layerTo: m.layers ? { bell: m.layers.bell.gain._ramp?.to, pulse: m.layers.pulse.gain._ramp?.to } : null,
    maxVoices, built, scheduled, endedBy, live: m.live.size, ended: scheduled - m.live.size, lastSound,
    log: m.log.slice(0, 20), win: win.map(r1) };
}

const RINGS = ['Hearth', 'Veil', 'Deep', 'Shoal', 'Kiln']; // S-47b: Shoal (ring 3); S-48a: Kiln (ring 4) phrygian
const st = (ring, mode, wake = false, ending = false) => ({ ring, mode, wake, ending });

async function scenarios(page) {
  const out = {};
  for (let r = 0; r < RINGS.length; r++) for (const mode of ['drift', 'surge']) out[`${RINGS[r]} ${mode}`] = await page.evaluate(renderMusic, [[[0, st(r, mode)]], 30]);
  out['Wake (Deep, surge)'] = await page.evaluate(renderMusic, [[[0, st(2, 'surge', true)]], 30]);
  return out;
}

async function browserChecks(browser, url, check, errors) {
  const pg = await browser.newPage();
  pg.on('pageerror', e => errors.push('music: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(150);
  const sc = await scenarios(pg), brief = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { rms: v.rmsDb, peak: v.peakDb, win: v.maxWinDb, hi: v.above2k, voices: v.maxVoices }]));
  const all = Object.values(sc);
  check('music bed: sustained RMS -58…-44 dBFS, peak ≤ -30, no 50 ms window > -36, < 1 % energy > 2 kHz, every ring × mode + Wake (S-44)',
    all.every(v => v.rmsDb >= -58 && v.rmsDb <= -44 && v.peakDb <= -30 && v.maxWinDb <= -36 && v.above2k < 1), JSON.stringify(brief(sc)));
  const gaps = RINGS.map(r => Math.abs(sc[`${r} drift`].rmsDb - sc[`${r} surge`].rmsDb));
  check('music: Drift and Surge within 3 dB of each other in every ring (S-44, pillar 3)', gaps.every(g => g <= 3), gaps.map(g => g.toFixed(1)).join(' / ') + ' dB');
  // The mode layers alone (pad muted): the bell and the pulse carry the same level (equal weight, not just a shared pad).
  const lay = {};
  for (const mode of ['drift', 'surge']) lay[mode] = (await pg.evaluate(renderMusic, [[[0, st(1, mode)]], 30, { only: 'layer' }])).rmsDb;
  check('music: the Drift bell and the Surge pulse alone are within 3 dB (S-44, pillar 3)', Math.abs(lay.drift - lay.surge) <= 3, JSON.stringify(lay));
  check('music: ≤ 6 live voices at every step, and every ended note disconnected (S-44)',
    all.every(v => v.maxVoices <= 6 && v.ended >= v.endedBy), JSON.stringify(all.map(v => [v.maxVoices, v.endedBy, v.ended])));
  // Wake (either mode): no bells, the pulse at ×1.5 rate (70 bpm -> 105), the pad holds the root chord.
  const wk = await pg.evaluate(renderMusic, [[[0, st(0, 'drift', true)]], 30]);
  const pulses = wk.log.filter(x => x.kind === 'pulse'), gap = pulses.length > 1 ? pulses[1].t - pulses[0].t : 0;
  const pads = new Set(wk.log.filter(x => x.kind === 'pad').map(x => x.hz));
  check('music: a Wake in Drift drops the bell, pulses at ×1.5 (0.571 s), pad holds one chord (S-44)',
    !wk.log.some(x => x.kind === 'bell') && Math.abs(gap - 60 / 70 / 1.5) < 0.01 && pads.size === 3, JSON.stringify({ gap, pads: [...pads] }));
  const zero = await pg.evaluate(renderMusic, [[[0, st(0, 'drift')]], 10, { music: 0 }]);
  check('music 0 builds no nodes and is silent (S-44)', zero.built === 0 && zero.peakDb === -999, JSON.stringify({ built: zero.built, peak: zero.peakDb }));
  const s1 = await pg.evaluate(renderMusic, [[[0, st(1, 'drift')]], 60]), s2 = await pg.evaluate(renderMusic, [[[0, st(1, 'drift')]], 60]);
  const s3 = await pg.evaluate(renderMusic, [[[0, st(1, 'drift')]], 60, { seed: 99 }]);
  check('music: same seed → same first 20 notes; another seed differs (S-44, own PRNG)',
    s1.log.length === 20 && JSON.stringify(s1.log) === JSON.stringify(s2.log) && JSON.stringify(s1.log) !== JSON.stringify(s3.log), `${s1.log.length} notes`);
  // Ring change at 5 s (Hearth -> Deep): a pad note of the Deep root's chord set starts within 14 s.
  const rc = await pg.evaluate(async args => {
    const r = await (0, eval)('(' + args.fn + ')')([args.states, 24]);
    const { MUSIC_ROOT_HZ, RING_PITCH_STEP, MUSIC_SCALES } = await import('/src/config.js');
    const root = MUSIC_ROOT_HZ * Math.pow(2, -RING_PITCH_STEP * 2 / 12), deep = new Set();
    for (let o = 0; o < 3; o++) for (const s of MUSIC_SCALES[2]) deep.add(Math.round(root * Math.pow(2, o + s / 12) * 100) / 100);
    const first = r.log.find(x => x.kind === 'pad' && x.t >= 5 && deep.has(x.hz));
    return first ? first.t - 5 : null;
  }, { fn: renderMusic.toString(), states: [[0, st(0, 'drift')], [5, st(2, 'drift')]] });
  check('music: a ring change reaches the new ring\'s chord set within 14 s (S-44)', rc !== null && rc <= 14, `after ${rc} s`);
  // S-48a: the clamp is ring 4: past the Kiln (ring 5+) plays the Kiln's phrygian pad, a step below the Shoal, flat 2nd heard.
  const ph = await pg.evaluate(async args => {
    const r = await (0, eval)('(' + args.fn + ')')([args.states, 40]);
    const { MUSIC_ROOT_HZ, RING_PITCH_STEP, MUSIC_SCALES } = await import('/src/config.js');
    const root = MUSIC_ROOT_HZ * Math.pow(2, -RING_PITCH_STEP * 4 / 12), set = new Map();
    for (let o = 0; o < 3; o++) for (const s of MUSIC_SCALES[4]) set.set(Math.round(root * Math.pow(2, o + s / 12) * 100) / 100, s);
    const pads = r.log.filter(x => x.kind === 'pad');
    return { n: pads.length, inSet: pads.every(x => set.has(x.hz)), flat2: pads.some(x => set.get(x.hz) === 1) };
  }, { fn: renderMusic.toString(), states: [[0, st(5, 'drift')]] });
  check('music: the clamp is the Kiln phrygian pad (ring 4, flat 2nd heard; ring 5 clamps to it) (S-48a)', ph.n > 0 && ph.inSet && ph.flat2, JSON.stringify(ph));
  const end = await pg.evaluate(renderMusic, [[[0, st(0, 'surge')], [12, st(0, 'surge', false, true)]], 20]);
  check('music: the Ending card fades to silence within 3.5 s (S-44)', end.lastSound <= 15.5, `last sound at ${end.lastSound} s (ending at 12)`);
  const back = await pg.evaluate(renderMusic, [[[0, st(0, 'drift')], [8, st(0, 'drift', false, true)], [14, st(0, 'drift')]], 24]);
  check('music: back from the Ending card fades in again (S-44)', back.win.slice(14 * 20 - 40, 14 * 20).every(d => d < -80) && Math.max(...back.win.slice(18 * 20)) > -70,
    `silent before 14 s: ${back.win.slice(240, 280).every(d => d < -80)}, max after 18 s ${Math.max(...back.win.slice(360))}`);
  // Audit 84 (B-076): mute → unmute mid-chord must not stack a second chord on the ringing one, and a mode switched while
  // muted crossfades the old layer down instead of leaving its gain at 1.
  const mu = await pg.evaluate(renderMusic, [[[0, st(0, 'drift')], [5, null], [5.3, st(0, 'surge')]], 30]);
  check('music: mute → unmute mid-chord stays ≤ 6 voices and fades the old layer out (B-076)',
    mu.maxVoices <= 6 && mu.layerTo && mu.layerTo.bell === 0 && mu.layerTo.pulse === 1, JSON.stringify({ v: mu.maxVoices, l: mu.layerTo }));
  // In the game: old settings (no `music`) load 50; nothing plays on the title; a world plays; the slider saves 0 and stops it.
  await pg.evaluate(() => { localStorage.clear(); localStorage.setItem('lumencore.settings.v1', JSON.stringify({ volume: 70, muted: false })); });
  await pg.reload(); await pg.waitForTimeout(300);
  const title = await pg.evaluate(() => ({ s: window.__lumen.settings.music, ui: document.getElementById('set-music').value, playing: window.__lumen.music.playing }));
  await newWorld(pg); await pg.waitForTimeout(600);
  const inWorld = await pg.evaluate(() => ({ playing: window.__lumen.music.playing, notes: window.__lumen.music.notes.length }));
  await pg.$eval('#set-music', el => { el.value = 0; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await pg.waitForTimeout(100);
  const off = await pg.evaluate(() => ({ level: window.__lumen.music.level, playing: window.__lumen.music.playing, stored: JSON.parse(localStorage.getItem('lumencore.settings.v1')).music }));
  check('music in game: old settings load 50, silent on the title, plays in a world, slider 0 saves and stops it (S-44)',
    title.s === 50 && title.ui === '50' && !title.playing && inWorld.playing && inWorld.notes >= 3 && off.level === 0 && !off.playing && off.stored === 0,
    JSON.stringify({ title, inWorld, off }));
  await pg.close();
  return sc;
}

module.exports = { browserChecks, renderMusic };

if (require.main === module) require('./serve.cjs').runStandalone({ browserChecks });
