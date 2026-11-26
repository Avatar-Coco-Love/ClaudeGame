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
