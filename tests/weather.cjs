// S-33 Weather checks (D-087, D-097). smoke.cjs calls nodeChecks. Node only: storm (Surge) and aurora (Drift) fire on the
// same schedule from the same seed; neither starts inside a Wake, and a Wake cancels one in progress; a reload mid-event
// resumes it; the storm speeds spawns (same draws); the aurora's bonus is inside the core's light only; the haul
// ratio storm/aurora from `surgebot mine` (6 seeds × 6 min, weather forced on) is 0.8–1.25.
// Usage: node tests/weather.cjs
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { updateWeather, weatherStarts, auroraBonus, darkRGB } = await import('../src/weather.js');
  const { updateGlitches } = await import('../src/glitch.js');
  const { runBot } = await import('../tools/surgebot.mjs');
  const C = await import('../src/config.js');
  const { WEATHER_S, WEATHER_EVERY_S, GLITCH_SPAWN_S, STORM_SPAWN_MUL, LIGHT_RADIUS, T, CELL, WEATHER_TINT } = C;
  const make = (mode, seed = 4242) => new Game({ seed, mode, audio: quiet });
  /** Step play time in 1 s ticks to `t1`, calling `each(g, t)` first; returns [{ t, kind }] for every change of kind. */
  const run = (g, t1, each = () => {}) => { const log = []; let last = null;
    for (let t = g.stats.time; t <= t1; t++) { g.stats.time = t; each(g, t); updateWeather(g, 1); g.events.length = 0;
      if (g.weather.kind !== last) { log.push({ t, kind: g.weather.kind }); last = g.weather.kind; } }
    return log; };

  // Schedule: the same seed fires at the same times in both modes; start-to-start gaps within WEATHER_EVERY_S.
  {
    const starts = weatherStarts(4242, 4), d = run(make('drift'), starts[3] + 60), s = run(make('surge'), starts[3] + 60);
    const on = (log, kind) => log.filter(e => e.kind === kind).map(e => e.t);
    const want = starts.map(Math.ceil), gaps = starts.map((t, i) => t - (starts[i - 1] || 0));
    const ok = JSON.stringify(on(d, 'aurora')) === JSON.stringify(want) && JSON.stringify(on(s, 'storm')) === JSON.stringify(want) &&
      d.filter(e => e.kind === null).every((e, i) => e.t === want[i] + WEATHER_S) && gaps.every(x => x >= WEATHER_EVERY_S[0] && x <= WEATHER_EVERY_S[0] + WEATHER_EVERY_S[1]);
    check('S-33 weather: aurora (Drift) and storm (Surge) start at the same seeded times, 40 s each, 5–7 min apart', ok,
      `starts ${want.join(', ')} s; drift ${JSON.stringify(d.slice(0, 4))}`);
  }
  // Never inside a Wake (or the ending): one due during a Wake is skipped; a Wake mid-event ends it for good.
  {
    const st = weatherStarts(4242, 2).map(Math.ceil), wake = { core: { x: 0, y: 0 } };
    const g = make('surge'), log = run(g, st[1] + 60, (g, t) => { g.wake = (t >= st[0] - 5 && t < st[0] + 10) ? wake : null; });
    const h = make('surge'), log2 = run(h, st[0] + 60, (g, t) => { g.wake = (t >= st[0] + 10 && t < st[0] + 15) ? wake : null; });
    const e = make('drift'), log3 = run(e, st[0] + 5, (g, t) => { g.endSeq = t >= st[0] - 1 ? { t: 0 } : null; });
    check('S-33 weather: none starts inside a Wake or the ending, and a Wake ends the one in progress',
      log.length === 2 && log[0].t === st[1] && log2.length === 2 && log2[1].t === st[0] + 10 && log3.length === 0,
      `skipped → ${JSON.stringify(log)}; cut → ${JSON.stringify(log2)}; ending → ${log3.length}`);
  }
  // B-081: a Wake-cancelled event stays cancelled after a reload (old code resumed it); the next one still comes.
  {
    const st = weatherStarts(4242, 2).map(Math.ceil), wake = { core: { x: 0, y: 0 } }, g = make('surge');
    run(g, st[0] + 15, (g, t) => { g.wake = (t >= st[0] + 5 && t < st[0] + 10) ? wake : null; });
    const h = new Game({ seed: 4242, mode: 'surge', audio: quiet, save: JSON.parse(JSON.stringify(g.toSave())) }); updateWeather(h, 1);
    const off = h.weather.kind === null;
    h.stats.time = st[1] + 1; updateWeather(h, 1);
    check('B-081 weather: an event a Wake cancelled stays cancelled after a reload; the next one still starts',
      off && h.weather.kind === 'storm', `after reload ${off ? 'off' : 'on'}, next → ${h.weather.kind}`);
  }
  // A reload mid-event resumes it (schedule from the saved play time); a mode switch swaps the face.
  {
    const st = Math.ceil(weatherStarts(4242, 1)[0]), g = make('surge'); g.stats.time = st + 12;
    const h = new Game({ seed: 4242, mode: 'surge', audio: quiet, save: g.toSave() }); updateWeather(h, 1);
    const resumed = h.weather.kind === 'storm' && h.events.includes('weather-start');
    h.setMode('drift'); h.events.length = 0; updateWeather(h, 1);
    check('S-33 weather: a reload mid-storm resumes it; switching to Drift turns it into the aurora',
      resumed && h.weather.kind === 'aurora' && h.events.join() === 'weather-start', `${h.weather.kind}, events ${h.events}`);
  }
  // Storm: the next spawn interval × STORM_SPAWN_MUL and the alive cap + 2; the darkness tints toward violet.
  {
    const timers = force => { const out = []; for (let k = 0; k < 200; k++) { const g = make('surge', 100 + k); g.weather.force = force; updateWeather(g, 9);
      g.spawnTimer = 0; g.player.x += 40 * CELL; updateGlitches(g, 0); out.push(g.spawnTimer); } return out; };
    const on = timers('on'), off = timers('off'), lo = GLITCH_SPAWN_S[0], hi = lo + GLITCH_SPAWN_S[1];
    const g = make('surge'); g.weather.force = 'on'; updateWeather(g, 9);
    check('S-33 storm: spawn interval × 0.75 (same draws), and the darkness eases to its violet tint',
      on.every((t, i) => Math.abs(t - off[i] * STORM_SPAWN_MUL) < 1e-9) && off.every(t => t >= lo && t <= hi) && darkRGB(g) === WEATHER_TINT.storm.join(', '),
      `on ${Math.min(...on).toFixed(2)}–${Math.max(...on).toFixed(2)} s, off ${Math.min(...off).toFixed(2)}–${Math.max(...off).toFixed(2)} s, dark ${darkRGB(g)}`);
  }
  // Aurora: +1 at AURORA_CHANCE inside the core's light, never outside it, never for rock or Lumen, never in a storm.
  {
    const g = make('drift'); g.weather.force = 'on'; updateWeather(g, 1);
    const p = g.player; let inside = 0, outside = 0, other = 0;
    for (let k = 0; k < 1000; k++) inside += auroraBonus(g, p.x + LIGHT_RADIUS * 0.8, p.y, k % 2 ? T.CRYSTAL : T.PRISM);
    for (let k = 0; k < 200; k++) { outside += auroraBonus(g, p.x + LIGHT_RADIUS + CELL, p.y, T.CRYSTAL); other += auroraBonus(g, p.x, p.y, k % 2 ? T.ROCK : T.LUMEN); }
    const s = make('surge'); s.weather.force = 'on'; updateWeather(s, 1); let storm = 0;
    for (let k = 0; k < 200; k++) storm += auroraBonus(s, s.player.x, s.player.y, T.CRYSTAL);
    check('S-33 aurora: ore in the core\'s light yields +1 at AURORA_CHANCE; none outside it, for rock / Lumen, or in a storm',
      Math.abs(inside / 1000 - C.AURORA_CHANCE) < 0.05 && outside === 0 && other === 0 && storm === 0, `inside ${inside}/1000, outside ${outside}, other ${other}, storm ${storm}`);
  }
  // Haul: storm vs aurora, the same supply (D-087): mine route, mid build, weather forced on, 6 seeds × 6 min.
  {
    const mean = (mode, weather) => { let s = 0; for (let k = 1; k <= 6; k++) s += runBot({ seed: k * 7919, route: 'mine', mode, minutes: 6, weather }).haulMin; return s / 6; };
    const storm = mean('surge', 'on'), aurora = mean('drift', 'on'), r = storm / aurora;
    check('S-33 weather: surgebot mine haul/min storm ÷ aurora is 0.8–1.25', r >= 0.8 && r <= 1.25,
      `storm ${storm.toFixed(1)}, aurora ${aurora.toFixed(1)}, ratio ${r.toFixed(3)}`);
  }
}
module.exports = { nodeChecks };
if (require.main === module) {
  let fail = 0;
  nodeChecks((name, ok, detail) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); })
    .then(() => process.exit(fail ? 1 : 0));
}
