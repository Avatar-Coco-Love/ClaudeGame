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
