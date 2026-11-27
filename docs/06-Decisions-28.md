# 06 — Decisions log, part 28

Continues `06-Decisions-27.md` (part 27 neared the 8 KB cap at D-186; same rules: supersede, never edit; list rejected
alternatives). D-187 on.

### D-187 — S-71 splits: the measure ships (S-71a), the gate waits on Q-040; 48 seeds, hold stays 2 s (session 148)
- `echobot --orders` built as specced (D-186). On 48 seeds (1001–1048, hold 2 s) every S-71 line passes but one:
  Auto 0.98 / 0.98 × Mine's gain, 0.83 / 0.67 × Defend's damage, share Surge 21 % / Drift 29 %, Auto gain Drift /
  Surge 0.89 / 0.92 — but the **added gain Drift / Surge is 1.26 / 1.27** (L0 / L2), just over D-158's 1.25.
- **Seeds: 48** (6 × `GATE_SEEDS`, ~3 min), not 16: Auto / Defend damage (L0) read 1.25 on seeds 1001–1016 at 2 s, and
  0.75 / 1.25 / 0.80 on three 16-seed sets at 3 s; and added-gain ratios 1.12–1.44; the Design 147 probe's pass was its seed set.
- **`ECHO_AUTO_HOLD` stays 2 s.** Tried 1 / 1.5 / 3 / 4 s (48 seeds; 4 s on 16): the L0 added-gain ratio reads
  1.33 / 1.33 / 1.46, 4 s fails on 16 too. A longer hold defends more and mines less in Surge, the wrong way.
  Focus was not tried: it scales the Echo's mining in both modes alike, so the ratio does not move.
- Why it misses: in Surge the Echo spends ~14 % of the time defending; that buys the core 19 → 11 damage / min,
  which a gain-only band does not count. Whether that is fair, or the Echo must add equal ore, is **Q-040**.
- Not wired into smoke until Q-040 is settled (a failing gate can't merge, and loosening its band here would be
  choosing the answer). The tool's own run is checked (`echoorder.cjs`, 1 seed: rows, switches, no verdict).
- Rejected: shipping the 16-seed PASS from hold 3 s (seeds 1001–1016; the 48-seed run fails it); widening the band
  to 1.35 in a Build session; a Surge-only Echo buff (pillar: Drift and Surge are equals).

### D-189 — Q-040 settled: the Drift / Surge band is on Auto's gain; the Echo's added gain has a 1.5 ceiling (session 151)
- Probe of the lean (a Defend Echo mines while its shot reloads, idle once ready; 48 seeds): Defend gain +0.3–0.7 /min,
  added gain Drift / Surge L0 1.33 (worse), L2 1.23; Auto / Defend damage 0.94. Shots are 0.45–0.8 s apart and
  re-targeting eats most of that: it barely mines, so it was **reverted**.
- **Gate:** Auto gain Drift / Surge in 0.8–1.25 (0.89 / 0.92) stays the equal-modes line (D-158). The added-gain ratio is a
  difference of noisy means (1.12–1.44 on 16-seed sets) and Surge's Echo spends ~14 % of its time on safety (damage
  19.3 → 11.3 / 7.5 /min), which Drift has no need of: that safety is counted. It keeps a ceiling ≤ 1.5 so a real drift
  still fails. In smoke via `echoorder.cjs` (`gates.cjs` SMOKE `echobot.mjs --orders`). M16 done (v1.11).
- Rejected: mine between shots (above); a Drift-only Echo nerf (punishes the calm mode for Surge's choice); dropping the
  added-gain line (nothing would catch a large drift); more seeds to squeeze under 1.25 (48 already 4 min).

### D-188 — Every test's New World is pinned by one helper, and a check enforces it (audit 150)
- Random New World seeds broke tests twice (B-101 Spire tests, B-103 `lens.cjs`): a rule broken twice gets a check.
  `tests/pinworld.cjs` `newWorld(page, tap, r = 0.42)` fixes Math.random for the click only (D-100's way); 42 test files
  moved to it, `spire.cjs` `pinnedNewWorld` wraps it. Its `run()` (in smoke) fails on any raw `#new-world` click in
  `tests/` / `tools/` with no `Math.random = ` pin on that line or the 3 above and no `any-seed:` note. Old code: 55 hits.
- One seed for all: 0.42 is the Spire tests' world (`foundChecks` prove its gaps). A test that needs another world
  passes its own `r`. Seed coverage lives in the bots and gates (many seeds), not in page tests.
- Rejected: flagging only tests that act on terrain near the core (a heuristic on test code misses new ones); pinning
  Math.random for the whole page (visual randomness and game draws would all freeze); a `?seed=` URL flag (game code for tests).
- Workflow review (D-138): too much: audit Debt lines restating "perf / phone not re-measured" every audit (closed:
  re-measured when a change touches draw cost, `perf.cjs`); too little: shared test helpers (5 of 47 files had the pin).
  B-100 closed: unseen since B-101's pin (audits 144, 150).

### D-190 — S-72 build-ready: hunters in their own list, any break rebuilds, `deep` perf run added (Design 152)
- Play-test (Playwright, seed 0.42, Surge, Deep d 60, Echo Auto, 30 s digging): 7 Glitches gave up in the rock, none
  touched the core, Auto never Defended. The Deep's tunnels are safe from beeliners: the gap M17 fills (D-182).
- **`game.hunters`**, not `game.enemies`: Drift empties `enemies` every frame (`game.js` 262), and hunters live in both
  modes. `beamFoes` adds them, so beam / Arc / Echo Defend / Auto need no other change. Mode switch keeps them.
- **Rebuild on any break** (`world.breaks` is one counter; the Echo's rule, D-108), not "a break inside it": 0.08 ms a build.
- **Perf baseline:** `perf.cjs` had no `deep` run (D-182 named one); S-72 adds `deep` (Surge d 60) and `hunt` beside it.
- Spawn off screen by the camera rect, streams `tracer` / `pincer` added to the list (D-025). Tracer 0.8 × Glitch speed
  stays below the core's (Q-041). Rejected: hunters in `enemies` with a Drift exception (every Drift clear would need it);
  a dirty-region rebuild (a counter is all `world` keeps, and the build is cheap); comparing `hunt` to `surge` (Veil d 30, other cost).

### D-191 — The map view: tap the minimap (or N) for a 3–4× map that holds the world still (owner feedback, session 153)
- Owner: the minimap is too small and crowded to read on a phone, and a tap on it aims the beam (`#hud` passes every
  touch through to the canvas). Now `#minimap` takes its own pointer events; a tap / click / `map` key (N, rebindable)
  opens `#mapview`: the same `drawMinimap` into a canvas of min(560, 92 % width, height − 40) px. Marks keep their pixel
  size, so the same 160-cell window spreads out 3–4×. The world holds still while open (as under the ending card), since
  the map can open anywhere, Surge included; the Matrix (Nexus-only, safe) still does not pause.
- Rejected: a bigger HUD minimap (the phone top row has no room: `touch.cjs` layouts); a smaller window on the minimap
  (D-123's "the Nexus is always in the window" would need an edge arrow, and it still crowds at 96 px); pinch zoom
  (a second gesture system); a live (unpaused) map (reading it in Surge would cost Integrity).
- Known edge: a player who bound N to another action gets both reset by `cleanKeys` (clash → defaults). Rare; logged.
