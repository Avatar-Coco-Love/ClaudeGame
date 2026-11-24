// S-42 (D-108): the Echo bot. Runs surgebot's `mine` route with and without the Echo over many seeds and reports
// strand rate (path or straight distance > 10 cells for > 3 s), lag (cells from the core, median / p90 of per-seed
// medians), blinks per minute, and ◆/min with vs without the Echo in each mode (Drift and Surge gains should match).
// Usage: node tools/echobot.mjs [--seeds=12] [--minutes=10] [--build=mid] [--mode=drift,surge]
import { runBot } from './surgebot.mjs';
import { CELL, ECHO_BLINK_CELLS } from '../src/config.js';

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

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
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
