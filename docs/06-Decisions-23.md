# 06 — Decisions log, part 23

Continues `06-Decisions-22.md` (part 22 neared the 8 KB cap at D-157; same rules: supersede, never edit; list rejected
alternatives). D-158 on.

### D-158 — M14 plan: two bosses, one body each, two forms; the ending does not ask for them (session 122, design; Q-026)
- **Which:** one boss per outer biome: the Crucible (Kiln) and the Gyre (Shoal), each in a seed-only 9 × 9 lair drawn
  last with its own salt, so vents, Anomalies, vaults and old-save hashes don't move. Hearth / Veil / Deep already have
  their big thing (the Spires); a 160 world has no bosses. Specs S-60a / S-60b / S-61a / S-61b / S-62
  (`07-Build-Specs-15/16`). Lair probe (30 seeds, 9 × 9, clearances in S-60a): a site on 30 / 30 in both rings.
- **One body, two forms:** a core cell ringed by 8 plates (16 hp each, core 40). Drift takes it apart by a readable
  rule that uses its biome: the Crucible's lit plate jumps across the body ((i + 5) mod 8) through flares and heat;
  the Gyre's key plate steps round while its whirlpool carries you round with it. Surge fights the same body: any plate
  cuts, and it hits back (Crucible: flare damage + embers; Gyre: inward pull, touch damage, mote swarms). Same loot
  (`BOSS_LOOT`: 80 ◆, 20 ▲, 24 of the biome ore), same save flag. Gate `bossrun.mjs`: time to defeat Surge / Drift
  0.8–1.25 on 8 seeds.
- **Slicing (D-139):** each boss lands take-apart first, used by both modes until its Surge slice (as Spires shipped
  the feed before the Wake). The fight state is never saved (a reload restores the plates); `bosses` down flags are
  (format 23), and an old 256 save gets the lair stamped (placed items inside refunded, a core inside moved home).
- **Q-026 settled: no.** The ending (relight every Spire) stays the v1.0 arc and works on a 160 world; bosses pay
  their own reward and get an ending stats line on 256 (S-62).
- Rejected: one boss per ring (five, three in rings that have Spires: a long list); a boss that roams (two unequal
  faces, as roaming elites, D-152); a reward that unlocks something (a layer would unlock a thing twice) or calms the
  biome (D-134: calming the Undertow buys nothing); bosses required for the ending (a 160 world could never finish);
  Glitch spawns from the Crucible (Surge's Glitches already come anyway; the embers are its own voice); a Gyre rule
  "cut only against the current" (that is S-59's Tide Lock).

### D-159 — Flare Lock: a 3 s window at × 2, one damage hook for every cutter (session 123, build; S-58)
- **Numbers:** S-58's 2 s at × 1.5 missed its own probe (top build, Focus, 3.5 cells out, mean over 32 phases: 2.48× a
  plain vault). 3 s × 1.5: 2.04×; 3 s × 2: **1.94× (kept)**; 3 s × 2.5: 1.78× (cut: a low build would open a lock almost
  as fast as a plain vault, 8 / 7.5). Low builds tend to 8 / (3 × 2) = 1.33×, so the cycle still matters.
- **Hook:** `world.hitMul` (lock.js) scales every `world.hit` (beam, Arc, Pulse, Echo, shatter), so no cutter skips the
  rule. The Kiln heat from a quenched beam still counts (beaming at the wrong time has a cost). Opened = the cache is gone
  (read from the cells, so an old save needs no field). The flare fires only in the window's first 0.25 s, once per cycle,
  measured from the 7 × 7 footprint's edge.
- Rejected: a lock-only shorter cycle (S-58 ties it to the vents' 8 s, one rhythm per biome); a saved "opened" flag (the
  cache cell already says it); excusing the Echo (one rule for every cutter reads as a rule).
