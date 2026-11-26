# 06 — Decisions log, part 27

Continues `06-Decisions-26.md` (part 26 neared the 8 KB cap at D-180; same rules: supersede, never edit; list rejected
alternatives). D-181 on.

### D-181 — Owner ask first: M16 Echo minds, M17 Hunters, Feats move to M18 (session 143, inbox; supersedes D-180's slot)
- **Inbox** (`archive/2026-11-26-owner-feedback-echo-enemies.md`): Echo upgrades, Mine / Defend modes and an Auto that
  does both and "acts smart"; more enemy kinds, some with real pathfinding and better AI.
- **Order:** owner requests go first (D-119: the owner gives feedback, Claude decides; feedback is the strongest signal
  we get). **M16 = Echo minds** (S-69…S-71, `07-Build-Specs-19.md`) → v1.11; **M17 = Hunters** (S-72…S-74,
  `07-Build-Specs-20.md`) → v1.12; **M18 = Feats** (D-180's S-66…S-68 unchanged, `07-…-18`) → v1.13. Feats' save step
  takes the next free format number when built (S-70 takes 25; tests never pin it). Echo first: smallest, reuses
  `echo.js`, and S-72's Tracers give Defend a target in Drift.
- **Echo (M16):** orders become **Mine / Defend / Auto** (ids `gather` / `guard` kept, `auto` added: no save change; a
  new Echo starts in Auto). Auto is a rule with hysteresis, not a learner: Defend while a threat is near (bolts first),
  Mine otherwise, the chip says which. Mine picks ore by worth over distance (eventrun's `VALUE` weights). Upgrades:
  3 Research rows bought with ● once the Echo is researched (Focus / Volley / Tether, 2 levels each, ● 165 in all;
  format 25). Q-022 settled: **yes** to a third order (Auto), the second Echo stays out (Q-039).
- **Both modes:** Defend already hits Burrowers and Motes in Drift; "Guard (idle)" goes; every upgrade helps both.
- **Layers:** Echo upgrades live in Research only and change Echo-only numbers (its share of Beam Power, its fire rate,
  its reach); no Core Matrix stat is touched, so nothing unlocks twice. Bounded ● sink (late Lumen ~530 vs 140 spent,
  Design 137), not a second M15: Q-036's "leave" stands for open-ended sinks.
- Rejected: Feats first (the owner's ask would wait 3 PRs for an unasked feature); interleaving the two milestones
  (two half-done systems on `main`); an Attack order or a squad (D-108); a learning / weighted-utility Auto with
  sliders (opaque, untestable); Echo upgrades on the Core Matrix (core-only layer) or on the Nexus (▲ sink); more than
  2 levels a row (the gate can't tell them apart); an Echo that roams off its leash to mine (loses the core).

### D-182 — Hunters: a shared flow field, a Tracer and a Pincer pair, both modes (session 143, inbox)
- **Pathfinding budget:** one BFS flow field from the core's cell (`src/flow.js`, 32-cell bound, ≤ 4225 cells, every
  0.5 s or on a break inside it), shared by the Echo (its 24-cell field moves onto it) and every hunter: hunters add
  no BFS. The Pincer's flank runs one bounded A* (≤ 800 nodes) per 0.5 s. `perf.cjs` run `hunt` ≤ 1.1× `deep`.
- **Tracer** (S-72): comes through tunnels down the field instead of beelining, leaves a short trail of the cells it
  took (the "smart" tell). **Pincer** (S-73): two that split: one down the field, one by A* to where the core is
  heading, from a different tunnel. Both modes, two faces like the Burrower / Motes (D-152): Surge contact damage,
  Drift a touch takes 1 cargo item and it runs; the beam and Echo Defend kill both. Gate S-74 (D-158 band).
- **Existing foes:** Glitches keep the beeline + give-up (D-017); it is the tunnel's safety and the contrast that
  makes hunters read as smart (Q-038 asks again after S-74's play-test). No other foe changes.
- Rejected: A* per enemy per frame (perf, 8+ foes); flow fields for Glitches now (no play-test says they feel dumb;
  the owner wasn't sure); Surge-only hunters (pillar 2); a hunter that bores rock (the Burrower's role); a boss-like
  hunter (M14 has two); creature shapes with limbs (pillar 1: chevrons and dots only).

### D-183 — Audit 144: Spire browser tests pin their seed; flakes get a stress repro (session 144, Audit)
- **B-101 fixed:** `facet.cjs` / `spirefeed.cjs` / `wake.cjs` built random New Worlds, then teleported to Spire 0
  (D-100 said pin). 1 of 12 parallel runs showed "A dormant Spire (2/5)" instead of "Spire relit (1/5)". All three now
  use `pinnedNewWorld` (`spire.cjs`); its gap check covers 160 and 256 (New World builds 256). 12 / 12 after.
- **B-096 (2nd use of that ID) fixed:** `bigworld.cjs` `new Game` budget is the median of 5 seeds, same 150 ms bar.
- **Workflow (D-138):** too little: a flake was logged "open" without a try at reproducing it. Rule: before a flake is
  logged open, run its file 6 at a time, twice (its own runner); log the result. Too much: nothing new (Debt lines no
  longer ride audits, D-177 holds). B-IDs: grep the highest before assigning (B-096 was used twice).
- Rejected: a retry on a failed budget (hides a real slowdown); raising the bar (weakens it); a smaller world-gen
  rewrite (hoisting getters measured no change, reverted).

### D-184 — Echo Auto: a threat check with a 2 s hold; worth-first ore (session 145, S-69)
- Ids stay `gather` / `guard` (no save change) and `auto` joins; labels Mine / Defend / Auto · Mine|Defend. Buying the
  Echo (and `dev.echo`) sets Auto; the game default stays `gather`, so old saves keep their order.
- Auto checks every 0.25 s: a bolt closing ≤ 1.5 × 140 px of the core (no sight needed) or a seen foe ≤ 140 px →
  Defend; 2 s with none → Mine. Defend ranks closing bolts first, then distance / speed. Mine: `ORE_WORTH` / (cells + 2);
  `ORE_WORTH` is now eventrun's `VALUE` (one table). Tell: a 1 px ring while defending, no blur (D-160).
- Rejected: a toast on each Auto switch (noise; the chip and ring show it); defending only while a shot is ready (it
  would mine between shots and flicker); sight for bolts (a bolt behind a corner still arrives).

### D-185 — Echo upgrades live in `echolevels.js`; `echoStat` is the only reader (session 146, S-70)
- `ECHO_LEVELS` (config) holds Focus `dmg`, Volley `guardS`, Tether `reach` + `guardPx` per level; `ECHO_DMG`,
  `ECHO_REACH`, `ECHO_GUARD_S`, `ECHO_GUARD_PX` are gone, so nothing can read a level-0 number by mistake.
- Rows sit under the Echo row in Research (only once it is owned) and reuse the Core Matrix row builder (pips, MAX).
  `game.echoLevels` is saved (format 25); load clamps 0…2, anything else 0 (B-037). New Cycle starts at 0 like Research.
- Rejected: a fourth Research-style one-time unlock per level (no pips, 6 rows); levels on the Core Matrix (D-181 cut);
  keeping the old constants as level-0 aliases (two sources of one number).
