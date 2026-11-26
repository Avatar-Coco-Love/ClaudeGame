# 09 — Implementation Log, part 18

Continues part 17 (sessions 119–125). Newest at the bottom; read the tail only.

## Session 126 — Build: S-60a Crucible, the first boss slice (v1.8.67, D-163)
- `boss.js` (lair site, stamp, take-apart, flare, draw, minimap mark); `T.BOSS_CORE` / `T.BOSS_PLATE`; save format 23.
  Wired in `game.js` (make / stamp / update / save), `render.js`, `hud.js`, `main.js` (toast), `lock.js` `quenched`,
  `wake.js` (boss cells stop a lane).
- Lair: 30 / 30 seeds, found by draw 11 at the latest (matches Design 122); vents, Anomalies and terrain outside the
  footprint unchanged. Probe (mid build, beam 5 / range 3, bot circles the body on a 3.4-cell ring): 59.9, 59.9, 59.8,
  61.0 s on 4 seeds (≤ 90 s PASS); about 4 s a plate, overheats twice.
- Screenshot viewed (seed 4242): the rose 3 × 3 body with the ember octagon core and the lit plate's glowing edge read
  well; a lit plate's orange edge is close to Kiln rock's, but its pulse and glow set it apart.
- `tests/boss.cjs` (10 node + 1 browser checks); the old-save check failed first (the Beacon cell was solid in the save's
  map, so it never loaded): the test now breaks that cell in the old map, as a real save would.
- B-094 (caught by smoke): the 8-seed Shoal gate (`mote.cjs`) went 0.922 / 0.855, gap 0.067 FAIL: on 3 seeds the bot's
  Shoal pad is 8–16 cells from the lair, and its floor shifts paths and spawns (12 / 16 seeds still PASS). Fix as for
  rifts: `runBot` clears lairs unless `boss: 'on'`; the gates read their old numbers exactly (Shoal 0.017, Kiln 0.039).
- Smoke 601/601 (+11: `boss.cjs` 10 node + 1 browser).

## Session 127 — Design: Crucible play-test, B-095, boss gate scope (v1.8.68, D-164)
- Play-test in the page (seed 4242, mid build, the S-60a probe's path as `input.read`): after the first plate broke the
  glow stayed on the empty cell and nothing took damage for 120 s. **B-095:** `render.js` attach replaced
  `world.listeners`, dropping `boss.js`'s break listener (node probes have no renderer, so smoke never saw it). Fix: the
  renderer adds / removes only its own listener. New browser check in `boss.cjs` failed on the old code (was 1, now 1).
- After the fix: down in 60.5 s (7 → 4 plates by 24 s, core open at 47 s), loot burst + toast + filled minimap octagon.
  Screenshots viewed: the lit plate shows only as an orange edge in a still frame (close to Kiln rock) → S-60b tints
  its fill. The flare ring reads; the bot's 3.4-cell ring stays just out of `BOSS_FLARE_R`.
- Specs vs shipped (D-163): S-60b gate now runs `boss: 'on'` with creatures, spawns and vents live and logs Surge deaths
  by cause (blind spot from B-094: creature gates run without lairs); Wards ignore the body and embers. S-61a fits D-163
  as is (a new lair on a format-23 save is refunded by the existing no-record rule). S-62 adds an advisory lairs-on
  run of both creature gates (16 seeds).
- B-096 (caught by smoke, 601/602): `lock.cjs`'s browser check crashed on a world with no Flare Lock ("New world"
  ignores `?seed` and draws a random one; 1 in 25 measured has none). The test now retries a new world (≤ 8) until
  one has a lock; 5 / 5 standalone runs pass.
