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

### D-172 — Audit 134: a wait that guards a measurement is part of the check
- B-097: `touch.cjs` waited for the camera to sit < 2 px from the core, but the camera rests 36 px ahead of it (render.js
  look-ahead), so the wait never passed and its `.catch(() => {})` hid a 5 s timeout at all 8 sizes (59 s a smoke).
  Now it waits on the look-ahead spot and the check fails if the camera never settled (`settled` in the detail).
- `tools/waitprobe.cjs` (preload, `node -r`) logs every timed-out `waitForFunction` with its caller; run in audits.
  This audit: the other 12 swallowed waits (spire, spirefeed, facet, quality, echo, wake, ward) never time out.
- Workflow review: too much: two ~9 min smokes a session; too little: nothing showed a wait that silently times out,
  so audits 74 and 129 blamed `waitForTimeout` instead. Rule: a swallowed wait before a measurement returns a flag
  the check uses. Rejected: banning `.catch` on waits (most are fine: a slow frame just measures a little later);
  a smoke-wide probe (doubles every wait's cost to log; an audit tool is enough).

### D-173 — S-62 built: boss marks, sting, ending line; M14 done (v1.9); Q-034 closed: no
- Chart L2 draws each unseen lair as a faint octagon (`BOSS_CHART_ALPHA` 0.35, in `drawBossMarks`); a seen lair keeps
  its full mark (down = filled, as S-60a). Sting (`audio.bossSting`, two low sines 98 / 73 Hz, peak -31 dBFS): each
  wake in Surge, and the first plate in Drift (asleep, 7 left). Ending card "Bosses n / 2" only with lairs (256).
- Lairs vs creature gates (16 seeds, `--boss=on`): Kiln 0.878 / 0.897, Shoal 0.913 / 0.881, both PASS: no Debt.
- Q-034 → **no**: mid build (`bossrun --build=mid`): Crucible ratio 1.40, Gyre 1.29, all down, Surge deaths med 1
  (7 / 8 by the boss each). Bosses are late goals; the band holds where the gate is defined (max build). Rejected:
  a softer flare / rim at low Beam (a second tuning per build), gating on mid (the max fight would go soft).
- M14 closes → v1.9. Nothing new without a design D-xxx (D-119): Design 137 picks the next milestone.
