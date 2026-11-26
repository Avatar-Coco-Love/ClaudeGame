// Audit 29 "Fix first" checks (B-022…B-026), split out of smoke.cjs to keep it under ~600 lines. smoke.cjs calls both.
const { newWorld } = require('./pinworld.cjs');
const audio = new Proxy({}, { get: () => () => {} });
const idle = { move: { x: 0, y: 0 }, aim: null, fire: false };

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { upgradeSave, SAVE_FORMAT } = await import('../src/save.js');
  const { T, PICKUP_CAP: CAP } = await import('../src/config.js');
  const { tryScan } = await import('../src/research.js');

  // B-022: kept pickups (death scatter, caches) never count toward the cap; at the cap the oldest loose pickup makes room.
  const g = new Game({ seed: 77, mode: 'surge', audio, size: 160 }); // its v7 save is a 160 world
  for (let i = 0; i < CAP; i++) g.spawnPickup(g.nexus.x + 200, g.nexus.y, 'shard', true);
  g.onCellBroken(1, 1, T.CRYSTAL); const afterKept = g.pickups.length;
  for (let i = 0; i < CAP + 20; i++) g.spawnPickup(g.nexus.x + 200, g.nexus.y, 'prism');
  const loose = g.pickups.filter(q => !q.kept).length, kept = g.pickups.filter(q => q.kept).length;
  g.onCellBroken(1, 1, T.CRYSTAL); const newest = g.pickups[g.pickups.length - 1].kind;
  check('a floor of 400 kept pickups still lets a crystal yield; loose loot caps at 400 by evicting the oldest (B-022)',
    afterKept > CAP && loose === CAP && kept === CAP && newest === 'shard' && g.pickups.filter(q => q.kept).length === CAP,
    JSON.stringify({ afterKept, loose, kept, newest }));
  const s = JSON.parse(JSON.stringify(g.toSave())), h = new Game({ seed: 77, mode: 'surge', audio, save: upgradeSave(s) });
  const old = upgradeSave({ ...JSON.parse(JSON.stringify(g.toSave())), v: 7, pickups: [[0, 10, 10], [1, 20, 20]] });
  check('kept tags survive save + load; a format-7 save keeps its whole floor as kept (B-022)', SAVE_FORMAT >= 8
    && h.pickups.filter(q => q.kept).length === CAP && old.v === SAVE_FORMAT && old.pickups.every(q => q[3] === 1),
    JSON.stringify({ kept: h.pickups.filter(q => q.kept).length, old: old.pickups }));

  // B-023: a Glitch the beam killed this frame neither hits the core nor fades lootless.
  const e = (over) => ({ x: 0, y: 0, r: 13, vx: 0, vy: 0, tier: 0, hp: 0, maxHp: 1.2, speed: 120, dmg: 14, spin: 0, flash: 0,
    hitCd: 0, wander: 0, alert: true, ...over });
  const k = new Game({ seed: 77, mode: 'surge', audio }), p = k.player;
  p.x = k.nexus.x + 900; p.y = k.nexus.y; p.invuln = 0; k.spawnTimer = 99;
  const hull = p.integrity;
  k.enemies = [e({ x: p.x + 5, y: p.y })]; k.updateEnemies(1 / 60);
  const contact = { hp: p.integrity, kills: k.stats.glitches };
  k.enemies = [e({ x: p.x + 300, y: p.y, best: 300, stall: 5.99 })]; k.updateEnemies(1 / 60);
  const giveUp = { kills: k.stats.glitches, fading: k.enemies.filter(q => q.fade !== undefined).length };
  check('a Glitch killed on contact deals no damage; one killed on its give-up frame still counts (B-023)',
    contact.hp === hull && contact.kills === 1 && giveUp.kills === 2 && giveUp.fading === 0, JSON.stringify({ hull, contact, giveUp }));

  // B-026: a ping with no ore in range still sweeps its ring (the sim advances it).
  const z = new Game({ seed: 77, mode: 'drift', audio });
  z.research.scanner = true; z.world.cells.fill(T.EMPTY);
  z.anomaly.sites.forEach((_, i) => { z.anomaly.taken[i] = 1e9; }); // S-37: charged Anomaly sites are marked too; none here
  tryScan(z);
  for (let i = 0; i < 30; i++) z.update(1 / 60, idle);
  check('an empty Scanner ping still sweeps its ring (B-026)', z.scan.marks.length === 0 && z.scan.ring && z.scan.age > 0.4 && z.scan.end > 0,
    JSON.stringify({ age: z.scan.age, end: z.scan.end }));
}

async function browserChecks(browser, url, check, errors) {
  const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  pg.on('pageerror', e => errors.push('audit29: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await newWorld(pg); await pg.waitForTimeout(200);

  // B-024: F pressed during a hitstop is kept until the sim runs, not consumed and lost.
  const hs = await pg.evaluate(async () => {
    const { game: g, input } = window.__lumen;
    g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40;
    g.research.scanner = true; g.scan.cooldown = 0; g.hitstop = 0.15;
    input.pressed.add('scan');
    await new Promise(r => setTimeout(r, 400));
    return { cooldown: g.scan.cooldown, hitstop: g.hitstop };
  });
  check('F pressed during hitstop still pings once the sim resumes (B-024)', hs.cooldown > 0 && hs.hitstop <= 0, JSON.stringify(hs));

  // B-026: the empty ping's ring is drawn (gold arc) even with no marks.
  const ring = await pg.evaluate(async () => {
    const g = window.__lumen.game, P = CanvasRenderingContext2D.prototype, arc = P.arc; let gold = 0;
    P.arc = function (...a) { if (this.strokeStyle === '#ffc94f') gold++; return arc.apply(this, a); };
    g.world.cells.fill(0);
    g.scan = { cooldown: 20, age: 0, x: g.player.x, y: g.player.y, ring: true, marks: [], end: 6 };
    await new Promise(r => setTimeout(r, 200));
    P.arc = arc;
    return { gold, age: g.scan.age };
  });
  check('an empty Scanner ping draws its ring on screen (B-026)', ring.gold > 0, JSON.stringify(ring));

  // B-025: the open Matrix sheet shows the bank as a deposit streams in.
  await pg.evaluate(() => { const g = window.__lumen.game; g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; });
  await pg.keyboard.press('e'); await pg.waitForTimeout(100);
  const bank = await pg.evaluate(async () => {
    const g = window.__lumen.game; g.cargo.shard = 40;
    await new Promise(r => setTimeout(r, 1600));
    return { cargo: g.cargo.shard, bank: g.bank.shard, sheet: document.querySelector('#matrix-bank .shard').textContent,
      open: !document.getElementById('matrix').classList.contains('hidden') };
  });
  check('the open Matrix sheet shows the bank while a deposit streams (B-025)', bank.open && bank.cargo === 0
    && bank.sheet.endsWith(' ' + bank.bank), JSON.stringify(bank));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
