// S-42 (D-108): the Echo bot. Runs surgebot's `mine` route with and without the Echo over many seeds and reports
// strand rate (path or straight distance > 10 cells for > 3 s), lag (cells from the core, median / p90 of per-seed
// medians), blinks per minute, and ◆/min with vs without the Echo in each mode (Drift and Surge gains should match).
// Usage: node tools/echobot.mjs [--seeds=12] [--minutes=10] [--build=mid] [--mode=drift,surge]
// S-71a (D-186, D-187): `--orders [--seeds=48] [--base=1000]`, the M16 measure: surgebot's `deep` route, mid, 5 min,
// no Echo vs Mine / Defend / Auto at Echo levels 0 and 2 (all rows); means of gain / min (banked + carried), damage / min.
// 48 seeds (6 × GATE_SEEDS, ~3 min): on 16 the Auto / Defend damage ratio swung 0.78–1.25 between seed sets (D-187).
import { runBot } from './surgebot.mjs';
import { CELL, ECHO_BLINK_CELLS } from '../src/config.js';
const GATE_SEEDS = 8; // B-092 / D-155: the seed count gate verdicts are defined on (biomefoe.mjs runs on import)

const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const seeds = +arg('seeds', 12), minutes = +arg('minutes', 10), build = arg('build', 'mid');
const med = v => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const p90 = v => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(0.9 * s.length))] : NaN; };

/** One seed with the Echo: the bot's own numbers plus the Echo's lag samples, strands and blinks. */
export function echoRun(seed, mode, mins = minutes) {
  const lags = []; let far = 0, strands = 0, blinks = 0, n = 0;
  const out = runBot({ seed, route: 'mine', build, mode, minutes: mins, echo: true, onTick: (g, dt) => {
    const e = g.echo; if (!e) return;
    if (e.blink && e.blink.phase === 'out' && e.blink.t <= dt + 1e-9) blinks++;
    const d = Math.hypot(e.x - g.player.x, e.y - g.player.y) / CELL;
    if (!e.blink && n++ % 30 === 0) lags.push(d);
    if (!e.blink && d > ECHO_BLINK_CELLS) { far += dt; if (far > 3 && far - dt <= 3) strands++; } else far = 0;
  } });
  return { ...out, lag: med(lags), strands, blinksMin: blinks / Math.max(out.minutes, 1e-9) };
}

const mean = v => v.reduce((a, b) => a + b, 0) / Math.max(v.length, 1);
const ORDER_ID = { mine: 'gather', defend: 'guard', auto: 'auto' };

/** S-71: one deep-route run; order null = no Echo. Damage = every integrity drop the core takes (heals don't count). */
export function orderRun(seed, mode, order, level, mins = 5) {
  let dmg = 0, last = null, sw = 0, e = null;
  const out = runBot({ seed, route: 'deep', build: 'mid', mode, minutes: mins, echo: !!order,
    setup: g => { if (order) { g.echoOrder = ORDER_ID[order]; g.echoLevels = { focus: level, volley: level, tether: level }; } },
    onTick: g => {
      const h = g.player.integrity; if (last !== null && h < last) dmg += last - h; last = h;
      if (g.echo !== e) { sw += e ? e.switches : 0; e = g.echo; } } });
  return { gain: out.gainMin, dmg: dmg / mins, sw: (sw + (e ? e.switches : 0)) / mins, out };
}

/** S-71 (D-186): every run's means and the gate verdict. Share = 1 − no-Echo gain / with-Echo gain (the gain it adds). */
export function ordersGate(n = 6 * GATE_SEEDS, mins = 5, base = 1000) {
  const rows = {}, lines = [];
  const row = (mode, order, level) => {
    const rs = []; for (let s = 1; s <= n; s++) rs.push(orderRun(base + s, mode, order, level, mins));
    const r = { gain: mean(rs.map(x => x.gain)), dmg: mean(rs.map(x => x.dmg)), sw: mean(rs.map(x => x.sw)) };
    rows[`${mode} ${order || 'none'}${order ? ' L' + level : ''}`] = r; return r;
  };
  for (const mode of ['surge', 'drift']) {
    row(mode, null, 0);
    for (const order of mode === 'surge' ? ['mine', 'defend', 'auto'] : ['auto']) for (const l of [0, 2]) row(mode, order, l);
  }
  for (const [k, r] of Object.entries(rows))
    lines.push(`${k.padEnd(16)} gain/min ${r.gain.toFixed(1)}, damage/min ${r.dmg.toFixed(1)}${/auto/.test(k) ? `, switches/min ${r.sw.toFixed(2)}` : ''}`);
  const band = x => x >= 0.8 && x <= 1.25, fails = [];
  for (const l of [0, 2]) {
    const [m, d, a, ad] = ['surge mine', 'surge defend', 'surge auto', 'drift auto'].map(k => rows[`${k} L${l}`]);
    const share = mode => 1 - rows[`${mode} none`].gain / rows[`${mode} auto L${l}`].gain;
    const added = mode => rows[`${mode} auto L${l}`].gain - rows[`${mode} none`].gain;
    const checks = [[`L${l} Auto gain / Mine ${(a.gain / m.gain).toFixed(3)} ≥ 0.9`, a.gain >= 0.9 * m.gain],
      [`L${l} Auto damage / Defend ${(a.dmg / d.dmg).toFixed(3)} ≤ 1.1`, a.dmg <= 1.1 * d.dmg],
      [`L${l} Auto gain Drift / Surge ${(ad.gain / a.gain).toFixed(3)} in 0.8–1.25`, band(ad.gain / a.gain)],
      [`L${l} added gain Drift / Surge ${(added('drift') / added('surge')).toFixed(3)} in 0.8–1.25`, band(added('drift') / added('surge'))]];
    if (l === 2) for (const mode of ['surge', 'drift'])
      checks.push([`L2 ${mode} share ${(100 * share(mode)).toFixed(1)} % in 15–35 %`, share(mode) >= 0.15 && share(mode) <= 0.35]);
    for (const [txt, ok] of checks) { lines.push(`${ok ? 'ok  ' : 'FAIL'} ${txt}`); if (!ok) fails.push(txt); }
  }
  lines.push(n < 6 * GATE_SEEDS ? `gate: no verdict (${n} seeds < ${6 * GATE_SEEDS}, D-187)` : `gate: ${fails.length ? 'FAIL' : 'PASS'} (${n} seeds × ${mins} min)`);
  return { rows, lines, pass: !fails.length };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop()) && process.argv.includes('--orders')) {
  console.log(ordersGate(+arg('seeds', 6 * GATE_SEEDS), +arg('minutes', 5), +arg('base', 1000)).lines.join('\n'));
} else if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  for (const mode of arg('mode', 'drift,surge').split(',')) {
    const withE = [], without = [];
    for (let s = 1; s <= seeds; s++) {
      withE.push(echoRun(1000 + s, mode));
      without.push(runBot({ seed: 1000 + s, route: 'mine', build, mode, minutes }));
    }
    const a = med(withE.map(r => r.shardMin)), b = med(without.map(r => r.shardMin));
    console.log(`${mode} ${build} (${seeds} seeds × ${minutes} min): strands ${withE.reduce((k, r) => k + r.strands, 0)}, ` +
      `lag med ${med(withE.map(r => r.lag)).toFixed(2)} / p90 ${p90(withE.map(r => r.lag)).toFixed(2)} cells, ` +
      `blinks/min med ${med(withE.map(r => r.blinksMin)).toFixed(2)} / p90 ${p90(withE.map(r => r.blinksMin)).toFixed(2)}, ` +
      `◆/min ${b.toFixed(1)} → ${a.toFixed(1)} with Echo (×${(a / b).toFixed(3)}), stuck ${withE.filter(r => r.stuck).length}/${without.filter(r => r.stuck).length}`);
  }
}
