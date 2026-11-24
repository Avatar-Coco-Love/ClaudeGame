// S-30 (D-082): the Surge bot runner's smoke slice. `spire` and `mine` for 2 seeds × 1 game-minute in both modes:
// every number is finite, the same seed twice gives the same output (the bot is deterministic), and the bot gets stuck
// on 0 of 2 seeds. S-36: the anomaly on ÷ off gain ratio (6 seeds × 10 min, mine, both modes). The full table
// (12 seeds × 3 builds × 2 modes) is logged in docs/09 and Q-007, not run here.
// Usage: node tests/surgebot.cjs   (also run by tests/smoke.cjs)
async function nodeChecks(check) {
  const { runBot, summarize } = await import('../tools/surgebot.mjs');
  const t0 = Date.now(), lines = [], again = [], rows = [];
  for (const route of ['spire', 'mine']) for (const mode of ['drift', 'surge']) {
    const a = [1, 2].map(k => runBot({ seed: k * 7919, route, mode, build: 'mid', minutes: 1 }));
    rows.push(...a); lines.push(summarize(a));
  }
  for (const route of ['spire', 'mine']) again.push(JSON.stringify(runBot({ seed: 7919, route, mode: 'surge', build: 'mid', minutes: 1 })));
  const nums = rows.flatMap(r => Object.values(r).filter(v => typeof v === 'number'));
  check('S-30 surge bot: spire + mine × 2 seeds × 1 min report finite numbers in both modes',
    nums.length > 0 && nums.every(Number.isFinite) && lines.every(l => !/NaN|Infinity/.test(l)), lines.join(' | '));
  check('S-30 surge bot: the same seed twice gives identical output (deterministic)',
    again[0] === JSON.stringify(rows.find(r => r.route === 'spire' && r.mode === 'surge' && r.seed === 7919)) &&
    again[1] === JSON.stringify(rows.find(r => r.route === 'mine' && r.mode === 'surge' && r.seed === 7919)), again.join(' | '));
  const stuck = rows.filter(r => r.stuck > 0).length, spireFed = rows.filter(r => r.route === 'spire').map(r => r.fed);
  check('S-30 surge bot: stuck on 0 seeds, and the spire route feeds ▲ in its first minute', stuck === 0 && spireFed.every(f => f > 20),
    `stuck ${stuck}, fed ${spireFed}, ${Date.now() - t0} ms`);
  // S-36: the Anomaly tune holds (12 seeds × 10 min table in docs/09, D-101): mine, mid, 6 seeds × 10 min, both modes.
  // Gain (banked + carried at the cap) with ÷ without anomalies ≤ 1.30 and ≥ 0.95, Drift ÷ Surge boost 0.8–1.25, ≥ 1 take per run.
  {
    const t1 = Date.now(), gain = {}, takes = [];
    for (const mode of ['drift', 'surge']) for (const anomaly of ['off', 'on']) {
      let sum = 0; for (let k = 1; k <= 6; k++) { const r = runBot({ seed: k * 7919, route: 'mine', mode, build: 'mid', minutes: 10, anomaly });
        sum += r.gainMin; if (anomaly === 'on') takes.push(r.buffs); }
      gain[mode + anomaly] = sum / 6;
    }
    const d = gain.drifton / gain.driftoff, s = gain.surgeon / gain.surgeoff;
    check('S-36 surge bot: anomalies lift the mine haul ≤ 30 % (and don\'t cost it), equal in Drift and Surge (0.8–1.25)',
      [d, s].every(x => x >= 0.95 && x <= 1.3) && d / s >= 0.8 && d / s <= 1.25 && takes.every(n => n >= 1),
      `drift ×${d.toFixed(3)}, surge ×${s.toFixed(3)}, D÷S ${(d / s).toFixed(3)}, takes ${takes}, ${Date.now() - t1} ms`);
  }
}
module.exports = { nodeChecks };
if (require.main === module) {
  let fail = 0;
  nodeChecks((name, ok, detail) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); })
    .then(() => process.exit(fail ? 1 : 0));
}
