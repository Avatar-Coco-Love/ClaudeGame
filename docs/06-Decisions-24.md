# 06 — Decisions log, part 24

Continues `06-Decisions-23.md` (part 23 neared the 8 KB cap at D-163; same rules: supersede, never edit; list rejected
alternatives). D-164 on.

### D-164 — Design 127: fix B-095 in this docs session; the boss gate measures the world as played (D-158, D-163)
- B-095 (play-test): `render.js` replaced `world.listeners` on attach, dropping the Crucible's break listener, so in
  the page the glow stayed on the first broken plate and the boss could not be downed (node tests have no renderer).
  The renderer now adds its listener and removes only its own. A Design session ships no gameplay code, but a boss
  that cannot be finished on `main` is a broken promise: a two-line fix + a browser check that fails on the old code.
- Blind spot from B-094: the creature gates run without lairs, and S-60b's gate said nothing about creatures, so a
  Burrower lunging during a Surge boss fight (while a Drift bite costs nothing on an empty hold) was never measured.
  `bossrun.mjs` runs `boss: 'on'` with creatures, spawns and vents live and logs Surge deaths by cause; S-62 runs the
  creature gates once with lairs on (advisory, 16 seeds).
- The lit plate's fill tints ember (S-60b): in a still frame only its edge (close to Kiln rock's orange) set it apart.
- Play-test (seed 4242, mid build, browser, after the fix): down in 60.5 s, 7 → 4 plates by 24 s, core open at 47 s.
- Rejected: a creature-free boss gate (measures a fight nobody has); gating the creature bots on lairs (B-094: 3 of
  8 seeds swing on lair geometry, which is noise for a creature gate); waiting for S-60b to fix B-095 (main stays broken).

### D-165 — Build 128: S-60b split; the Surge form's open details (D-158, D-164)
- S-60b ships in two slices (D-139): **S-60b1** the awake Surge form + smoke (usable alone); **S-60b2** the
  `bossrun.mjs` gate (a boss route in `runBot`, lairs on, creatures live) and any tuning it asks for.
- Embers launch `BOSS_EMBER_OUT` 2.2 cells out along the line to the core (past the 3 × 3 body's corners at 2.12),
  so the body never stops its own shots; no ember inside that radius (the flare covers it). Sight = no rock from there.
- The awake flare's damage comes with no extra knockback (the vent shove is it); the flare cycle switches to 4 s at
  once, keyed per form so a switch never double-fires. A death heals each live core (any mode; Drift cores take no
  damage before all plates anyway). "Never start": a storm due while awake is cancelled, a rift due is skipped; one
  already running goes on (a rift can sit by the lair).
- Awake, every standing plate glows at 60 % of the lit plate's look; the lit glow still moves for a switch to Drift.
- Probe (mid build, beam 5 / range 3, no creatures, embers popped): Surge 57.1–57.3 s vs Drift 59.8–61.0 s, 0 deaths.
- Rejected: shipping the gate in the same PR (a new bot route + 8-seed tuning loop is its own slice); embers that
  pass through boss cells (a special case in `updateBolts`); cancelling a running rift (punishes the player for it).

### D-166 — Audit 129: the bot gates run beside the smoke; every smoke file is timed
- `tests/gates.cjs` `run(tool, args)` starts a `tools/*.mjs` gate once (async child process) and memoizes it;
  `smoke.cjs` prestarts every gate in `SMOKE` first, so they run on spare cores during the node and browser phases.
  A check keeps the list in step with the tests' calls and bans `execFileSync` of a tool. Same seeds, same verdicts.
- `smoke.cjs` times each browser file (`T()`), the node phase and the inline block, and prints the 12 slowest
  as TIME lines plus the total: the next speed fix starts from a number (620 → 529 s here).
- Rejected: running browser files in parallel (wall-clock waits and the frame-time checks would see contention);
  fewer gate seeds (D-155: 8 / 16 are the verdict floors); a separate gate job outside the smoke (main could merge red).

### D-167 — Build 130: the boss gate route (S-60b2, D-165)
- `runBot` route `boss`: target the lit plate (asleep) or the nearest standing plate (awake), then the core; stand on an
  open 4-neighbour and beam it, foes first. No retreat (the only heal is the Nexus, ~100 cells off); a death respawns
  there and the bot paths back. Boss cells joined the bot's walls: a path never digs through the body.
- `tools/bossrun.mjs`: base max, Heat Sink at core + (2, 0) (within 5 cells of every standing spot), Wards at ± 4,
  start 12 cells toward the Nexus; lairs, rifts and creatures on, anomalies off. Deaths by cause from the hit's caller.
- 8 seeds: Drift 0.67 / Surge 0.69 min median, ratio 1.059, 0 deaths (16 seeds 1.033): PASS, no tuning. Smoke gate.
- Rejected: retreat to heal (a 200-cell round trip would gate the walk, not the boss); a gate-only start next to the
  body (the spec's 12 cells crosses the wake radius, so the switch to awake is measured).

### D-168 — Build 131: the Gyre (S-61a, D-158)
- `gyre.js` holds what differs from the Crucible (whirlpool, key step, look); `boss.js` keeps lair, stamp, loot, save.
  The boss list runs Kiln first, so the Crucible stays boss 0 for tools and tests. Key start: its own rng stream `gyre`.
- Whirlpool = `flowAt` within GYRE_R (so pickups and Motes ride it too); the core eases into it like a chunk border.
  `undertow.off` (tools flag) turns it off too. The chunk's dashes skip it; the Gyre draws four rings of arc dashes.
- The key steps to the next *standing* plate clockwise; when it breaks it passes on at once with a full 1.2 s step.
- Interim Surge: `BOSS_WAKES` [4] (only the Crucible wakes); S-61b adds 3. Colours per boss: `BOSS_RGB`.
- Rejected: the key drawn with 'lighter' (mint over the rose plate read white); a separate save entry (`bosses` holds
  { ring, down } per lair already; an older 23 save without the Gyre gets it stamped by S-60a's rule).
