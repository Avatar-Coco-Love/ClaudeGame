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

### D-160 — Big glows that sweep the screen are drawn as stacked strokes, not shadowBlur (session 124, audit)
- Debt carried by audits 114 and 119: the Scanner ring's cost on phones was never measured. `tools/perf.cjs` now takes
  `VP=phone` (390 × 844, DSF 3, dpr capped at 2) and a `scan` run (a fresh ring every 0.7 s). Measured at CPU × 4:
  base 42.6 ms mean, scan 73.5 ms (**1.73×**): B-091's clip box grows with the ring, so at full size the blur covers
  the whole phone screen. Now three strokes (12 / 7 / 3 px at alpha × 0.15 / 0.3 / 1, `SCAN_RING_GLOW`): 39.2 vs
  44.1 ms (**1.12×**). Viewed at 1280 × 800: the ring still reads as a glowing amber line. `audit34.cjs` checks the
  ring makes no shadowBlur draw (fails on the old code).
- Rule: a glow whose shape can grow past ~200 px (rings, sweeps) uses stacked strokes; shadowBlur stays for small shapes
  and sprites (B-027 / B-091 as before).
- Rejected: dropping the glow only on L1 / L2 (Auto starts at L0, where the phone paid); a pre-rendered ring sprite
  (a ~900 px canvas rescaled every frame; not tried, the strokes already reach 1.12×); a shorter ring (the sweep is the ping's read).

### D-161 — The standard run's cut-back on compaction is taken, and noted (session 124, audit; D-136)
- The orchestrating conversation of this standard run was summarized after PR 1 (that PR's subagent used ~156k tokens
  and ~30 min), so per `docs/10` it ran 2 PRs instead of 3. Rule kept: a compaction is the cut-back signal; the
  orchestrator stops after the PR in flight and says so in its per-PR list (no catch-up PR in the same conversation).
- Rejected: pushing on to 3 after the summary (the 200k cap is the owner's, D-136, and the summary hides how close it
  is); asking subagents for shorter replies only (the cost was the subagent's own context, not its reply); lowering the
  standard run to 2 PRs for good (most runs do not compact; one data point).

### D-162 — S-59 Tide Lock as specced; the hit's direction is the core's line (session 125, build; D-152)
- An outer vault centred in the Shoal (`TIDE_RING`) is a Tide Lock (`lock.js` `tideSites`, one `rng['tidelock']` heading
  draw per vault index). `undertow.js` gives its chunk a current: a calm draw becomes `LOCK_TIDE_MIN` 40 px/s on that
  heading; a drawn current is kept, also when the chunk's centre lies just outside the Shoal (`undertow.cjs` allows it). The shell takes a hit (× 1) only when it points against the flow (dot < −0.5).
- Direction of a hit: core centre → cell centre (beam, Wide, Arc, Pulse, Shatter); the Echo passes its own aim
  (`world.hit(x, y, amt, dir)`). Other angles spark grey (`quenched`). Same in both modes; seed-only, unsaved.
- Probe (top build holding station 6 cells downstream): 3.60 s vs a plain vault's 3.60 s (1.00×; ≤ 2× PASS).
- Rejected: × 1.5 against the flow (no need: the rule is the cost, not time); per-ray aim for Wide (offsets of a few
  degrees never cross the 120° cone's edge in practice); chevrons on every shell cell (hides which side is upstream).

### D-163 — S-60a Crucible as specced; the lair is stamped by the Game, not the World (session 126, build; D-158)
- `boss.js`: `lairSite` (salt `'lair-4'`, ≤ 60 draws, d 108–118) runs after the vents in `new Game`; clearances are empty
  cells between footprints (Chebyshev): vault 2, vent / Anomaly 3, seed-only Spire choice 6. 30 / 30 seeds, last draw 11.
- The stamp happens after a save is applied (so a plate broken in the saved map comes back) and leaves `World` alone, so
  every terrain hash, site list and old-save upgrade stays as it was. Plates are numbered clockwise from north; the first
  lit plate is `rng['crucible']`; a lit break passes to the next standing plate in the (i + 5) sequence.
- Save 23 `bosses: [{ ring, down }]`. A lair with no record in a save is new to it: placed things in its footprint are
  refunded at craft cost, a core inside goes to the Nexus. The upgrade step only adds `bosses: []` (it has no World).
- Boss hits go through `world.hitMul` (wrapping the locks'); an unlit plate sparks grey (`quenched`). Probe: mid build
  (beam 5, range 3) bot 60–61 s on 4 seeds (≤ 90 PASS).
- Rejected: stamping in `World` (moves the terrain hash `vent.cjs` / `ore.cjs` pin); refunding in the save step (needs
  the anomaly + vent sites, i.e. a World); a lit-plate edge in its own colour only (it pulses + glows, enough vs Kiln rock).
