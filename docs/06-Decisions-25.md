# 06 — Decisions log, part 25

Continues `06-Decisions-24.md` (part 24 neared the 8 KB cap at D-170; same rules: supersede, never edit; list rejected
alternatives). D-171 on.

### D-171 — S-61b built: the Gyre's Surge form as specced (D-170), gate PASS untuned
- `BOSS_WAKES` [3, 4]. Awake: any plate cuts, the key mark is hidden (the key keeps stepping unseen, so falling asleep
  shows it where the clock put it). Swarms: one clock per Gyre, reset to a full 15 s on waking; at 0 it releases one
  if fewer than 2 tagged swarms live, else waits another full 15 s. Spawn: a seeded open cell on the lair's edge
  ring (`rng['gyre-swarm']`, its own salt). The tagged motes share the S-54 list (beam, Wards, drawing for free) but
  each swarm keeps its own centre, leash and loot count; the Shoal's own timer counts only untagged motes.
- Rim: gap = distance from the core's centre to the nearest standing body cell (plates + core) minus its radius; the
  bot's beam spot (open cell beside a plate) is 6 px, one cell out 38 px. The cooldown runs in both modes; the tell is
  the 3 × 3 outline sparking mint while it is ≤ 0.5 s (also while armed). Knockback: `hurtPlayer`'s own, outward.
- Pull: inside `gyreCurrent` only while awake, so motes and pickups feel it too (one whirlpool, one rule).
- Gate (`--boss=gyre`, 8 seeds, top build): Drift med 0.69 min, Surge 0.66, ratio 0.954, Surge deaths 0, swarms 16,
  rims 78: PASS first try, nothing tuned. Smoke runs both gates.
- Rejected: a separate mote list for boss swarms (doubles beam / Ward / draw wiring); a swarm the moment one dies
  (no breather; the spec's 15 s is the rhythm); counting the Shoal's own swarm in the cap of 2 (it is not the boss's).
