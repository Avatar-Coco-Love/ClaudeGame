# 06 — Decisions log, part 20

Continues `06-Decisions-19.md` (part 19 neared the 8 KB cap at D-136; same rules: supersede, never edit; list rejected
alternatives). D-137 on.

### D-137 — Audit 104: the phone bank wraps 3 + 2 once a biome ore shows (session 104, audit; B-089)
- With ≈ / ⬟ (S-49) the bank row ran under the minimap at every portrait phone (panel 12–315 vs 212 at 320 px) and under
  ◎ ⟂ ◇ at 568–844 landscape. `main.js` sets `html.ores` when either chip shows; on phones (≤ 480 px or a coarse
  pointer) `.ores .bank` is a 3-column grid, so the panel keeps the width of the three-kind bank B-034 / B-039 pin and
  grows one row (~20 px). Landscape: the toast's top moves down by that row (+136 / Large +142, ≤ 700 px Large +134) and,
  ≤ 700 px, narrows to 50% − 100 px so it ends left of ⊕. ≤ 380 px: grid column gap 6, Large chips padding 5 (Large's Echo
  + 3 buff chips touched the minimap, 0 px). Landscape 701–932 px: Large leaves the bank at 18 px (21.6 px ran under ◎).
- `touch.cjs` B-089 (6 phones, plain + Large): fails on the old CSS at all 6, passes now.
- Rejected: a smaller bank font (15 px is the floor the phone rules already use); hiding ≈ / ⬟ on phones (bank must be
  readable); a single scrolling row (hides counts); moving the ores into the cargo row (mixes holdings with capacity).
- D-131…D-135 checked against the code: match.

### D-138 — Workflow self-assessment (session 104, owner rule)
- Owner: assess from time to time whether the work is going well: what we do too much of, too little of. One-off: the
  next orchestrating conversation starts with that review (`09` tail + recent PRs; is time / context going to the right
  places?) and acts on it through its PRs (note in `02`). Standing: every Audit session adds a short workflow review to
  the code audit, findings in `09`, changes as D-xxx (`CLAUDE.md`). Kept apart from D-136 (merged; never edited).
- Rejected: a separate "Retro" session type (a sixth slot in the rotation costs a build PR every cycle).

### D-139 — Workflow review of PRs #101–#112 (session 105, D-138 one-off, orchestrator)
- Mix: 6 builds, 2 design, 3 audits, 1 test-tooling, 1 rules-only docs PR (#112). Too much: meta / rules-only PRs (a
  whole PR for one owner rule) and per-PR record churn. Too little: player-usable results per slice (S-49 shipped ores
  that stayed unspendable until S-50: a dead currency for a PR).
- Rules: (1) an owner rule or process change rides in the next content PR, never a PR of its own (`CLAUDE.md` made
  explicit). (2) When a spec is split, each slice leaves the player something usable end to end; a Design session that
  splits a spec checks this (`CLAUDE.md`).
- Rejected: a Retro session type (costs a build slot; already rejected in D-138); dropping record steps (they are the memory).

### D-140 — S-50 Overdrive: a profile flag and a load clamp (session 105, build)
- "256 world only" is `WORLD_PROFILES[size].overdrive` (false for 160), read by `Game.topLevel(u)` = max + `over`; the
  sheet, `canAfford` and the save load all use it. `matrixCost(u, l)` = the old curve below max, `OVERDRIVE_COST` past it;
  a buy charges every kind in `KINDS`. A saved level loads as an integer ≥ 0 clamped to `topLevel` (B-037 rule).
- Rejected: testing `world.w === 256` (a size literal in game code; profiles hold what differs by size); a separate
  `overdrive{}` save field (spec: none new, the level just passes max); dev `maxAll` to the top (stays at base max, so
  dev tools still reach the Overdrive rows the way a player does).
