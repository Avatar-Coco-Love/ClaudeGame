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
