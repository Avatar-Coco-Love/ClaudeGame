// S-30 (D-082): the Surge bot runner's smoke slice. `spire` and `mine` for 2 seeds × 1 game-minute in both modes:
// every number is finite, the same seed twice gives the same output (the bot is deterministic), and the bot gets stuck
// on 0 of 2 seeds. The full table (12 seeds × 3 builds × 2 modes) is logged in docs/09 and Q-007, not run here.
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
}
module.exports = { nodeChecks };
if (require.main === module) {
  let fail = 0;
  nodeChecks((name, ok, detail) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); })
    .then(() => process.exit(fail ? 1 : 0));
}
