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
  await pg.close();
  return m;
}

module.exports = { browserChecks, measure };

if (require.main === module) {
  (async () => {
    const http = require('http'), fs = require('fs'), path = require('path'), { chromium } = require('playwright');
    const ROOT = path.resolve(__dirname, '..');
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, req.url.split('?')[0].replace(/\/$/, '/index.html'));
      if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(p).pipe(res);
    });
    await new Promise(r => srv.listen(0, r));
    const b = await chromium.launch(), pg = await b.newPage();
    await pg.goto(`http://localhost:${srv.address().port}/`); await pg.waitForTimeout(150);
    console.log(JSON.stringify(await measure(pg)));
    await b.close(); srv.close();
  })();
}
