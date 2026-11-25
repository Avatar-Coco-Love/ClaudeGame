// S-47b brittle glass checks (D-128, shatter.js). smoke.cjs calls nodeChecks. Same seed → same crack picks (whatever the
// break order); a crack adds 60 % of the neighbour's hp; a crack that breaks its cell yields but cracks nothing (no
// chains); only Shoal ROCK / DENSE is cracked or cracks (never ore, vaults, Spires, bedrock; nothing in a 160 world);
// nothing saved. Usage: node tests/shatter.cjs
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { shatterPick } = await import('../src/shatter.js');
  const { T, SHATTER_SHARE } = await import('../src/config.js');
  const make = (seed = 4242, size) => new Game({ seed, mode: 'drift', audio: quiet, ...(size ? { size } : {}) });
  const rocky = t => t === T.ROCK || t === T.DENSE;
  /** Shoal ROCK / DENSE cells with at least one ROCK / DENSE Shoal 4-neighbour, scanned in a fixed order. */
  const sites = (g, n = 40) => {
    const w = g.world, out = [];
    for (let y = 1; y < w.h - 1 && out.length < n; y += 3) for (let x = 1; x < w.w - 1 && out.length < n; x += 5)
      if (w.ring(x, y) === 3 && rocky(w.get(x, y)) && shatterPick(w, x, y)) out.push([x, y]);
    return out;
  };
  const breakAt = (g, x, y) => { const w = g.world, t = w.get(x, y); w.destroy(x, y); g.onCellBroken(x, y, t); };

  // Determinism: two games break the same cells in opposite orders and crack the same neighbours; another seed differs.
  {
    const a = make(), b = make(), c = make(777), sa = sites(a);
    let differ = 0; for (const [x, y] of sites(c)) { const p = shatterPick(c.world, x, y), q = shatterPick(a.world, x, y); if (q && p.join() !== q.join()) differ++; }
    const picks = g => { const out = []; for (const [x, y] of g === a ? sa : [...sa].reverse()) { const p = shatterPick(g.world, x, y); breakAt(g, x, y); out.push(p ? p.join(',') : '-'); } return g === a ? out : out.reverse(); };
    const pa = picks(a), pb = picks(b);
    check('S-47b shatter: same seed → same crack picks, whatever the break order; another seed differs',
      sa.length >= 20 && pa.join(' ') === pb.join(' ') && a.shatter.cracks === b.shatter.cracks && differ > 0, `${sa.length} sites, ${differ} differ at seed 777, ${a.shatter && a.shatter.cracks} cracks`);
  }
  // Amount: a break adds SHATTER_SHARE of the picked neighbour's hp, and nothing to the other neighbours.
  {
    const g = make(), w = g.world, [x, y] = sites(g, 1)[0], [nx, ny] = shatterPick(w, x, y);
    const hp = w.hpAt(nx, ny, w.get(nx, ny)), ring = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([dx, dy]) => (y + dy) * w.w + x + dx);
    breakAt(g, x, y);
    const dmg = w.damage[ny * w.w + nx], others = ring.filter(i => i !== ny * w.w + nx).every(i => w.damage[i] === 0);
    check('S-47b shatter: the crack adds 60 % of the neighbour\'s hp to that one neighbour only (a line flashes)',
      Math.abs(dmg - SHATTER_SHARE * hp) < 1e-5 && others && g.shatter.lines.length === 1, `${dmg.toFixed(3)} of ${hp.toFixed(3)}`);
  }
  // No chains: a pre-cracked neighbour breaks from the crack, yields as normal, and cracks nothing of its own.
  {
    const g = make(), w = g.world, [x, y] = sites(g, 1)[0], [nx, ny] = shatterPick(w, x, y), ni = ny * w.w + nx;
    w.damage[ni] = 0.5 * w.hpAt(nx, ny, w.get(nx, ny));
    const mined = g.stats.mined, dmgBefore = Float32Array.from(w.damage);
    breakAt(g, x, y);
    let touched = 0; for (let i = 0; i < w.damage.length; i++) if (i !== ni && w.damage[i] !== dmgBefore[i]) touched++;
    check('S-47b shatter: a crack that breaks its cell counts as mined but cracks nothing (no chain)',
      w.get(nx, ny) === T.EMPTY && g.stats.mined === mined + 2 && g.shatter.cracks === 1 && touched === 0, `cracks ${g.shatter.cracks}, other cells touched ${touched}`);
  }
  // Scope: outside the Shoal nothing cracks; ore / vault / Spire / bedrock neighbours are never picked; a 160 world has none.
  {
    const g = make(), w = g.world;
    let inner = 0, badPick = 0;
    for (let y = 1; y < w.h - 1; y += 2) for (let x = 1; x < w.w - 1; x += 2) {
      const p = shatterPick(w, x, y);
      if (!p) continue;
      if (w.ring(x, y) !== 3) inner++;
      if (!rocky(w.get(p[0], p[1])) || w.ring(p[0], p[1]) !== 3) badPick++;
    }
    const s = make(4242, 160);
    let small = 0; for (let y = 1; y < s.world.h - 1; y += 2) for (let x = 1; x < s.world.w - 1; x += 2) if (shatterPick(s.world, x, y)) small++;
    // An ore break in the Shoal cracks nothing (yield cells never shatter).
    const o = make(), ow = o.world; let ore = null;
    for (let i = 0; i < ow.cells.length && !ore; i++) { const x = i % ow.w, y = (i / ow.w) | 0; if (ow.ring(x, y) === 3 && ow.get(x, y) === T.CRYSTAL && shatterPick(ow, x, y)) ore = [x, y]; }
    if (ore) breakAt(o, ore[0], ore[1]);
    check('S-47b shatter: only Shoal ROCK / DENSE cracks or is cracked; ore breaks crack nothing; none in a 160 world',
      inner === 0 && badPick === 0 && small === 0 && !!ore && !o.shatter, `outside ${inner}, bad ${badPick}, 160-world ${small}, ore ${ore}`);
  }
  // Nothing saved.
  {
    const g = make(); for (const [x, y] of sites(g, 10)) breakAt(g, x, y);
    const keys = JSON.stringify(Object.keys(g.toSave())), fresh = JSON.stringify(Object.keys(make().toSave()));
    check('S-47b shatter: nothing saved (toSave keys unchanged, no shatter field)', keys === fresh && !/shatter/i.test(JSON.stringify(g.toSave())), fresh.slice(0, 60));
  }
}

module.exports = { nodeChecks };
if (require.main === module) {
  let fail = 0;
  const report = (name, ok, detail) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
  nodeChecks(report).then(() => process.exit(fail ? 1 : 0), e => { console.error(e); process.exit(1); });
}
