# 09 — Implementation Log, part 17

Continues part 16 (sessions 114–118 archived word for word in audit 124: `archive/2026-11-25-09-sessions-114-118.md`, part 16 removed; 118 came from this part). Newest at the bottom; read the tail only.

## Session 119 — Audit: seed-fragile bot gate (B-092), audio test 50× faster, 09 archive (v1.7.60, D-155)
- No subagent tool: sweeps in-session, newest code first (`ward.js`, D-154 `warded` in glitch / burrower / mote: match).
- **B-092** (fixed): `biomefoe.mjs` defaulted to 4 seeds while every gate was defined on 8. On 4 seeds both biome gates
  FAIL by noise (Kiln 0.800 / 0.916, Shoal FAIL); 8 / 12 / 16 seeds PASS and converge (Kiln 0.866 / 0.905, 0.869 /
  0.888, 0.883 / 0.885; Shoal PASS at 8 and 16). D-155: `GATE_SEEDS = 8` is the default, fewer seeds print no verdict;
  the base Kiln gate (never in the smoke) now runs in `burrower.cjs`; the Ward gate runs at 8 (was 4). `audit119.cjs`
  fails on the old tool (stash-proved).
- Smoke time (debt carried by audits 109 + 114): baseline 565 s; node phase 74 s (three bot gates ~25 s each), browser
  490 s. The one-shot sound check rendered spectra with a plain DFT (74 s); now an FFT: same 28 results bit for bit,
  1.5 s. Next costs: Spire / Wake / toast viewport loops (~7 s each), S-41 quality runs (13–15 s).
- `09` sessions 109–113 archived word for word (`archive/2026-11-25-09-sessions-109-113.md`; part 15 removed).
- D-150…D-154 checked against `config.js` / code: match. No phone sweep again (last: audit 109).
- Workflow review: too much trust in a tool's default output (two sessions read a 4-seed FAIL as a regression); too
  little: the smoke measured per phase only now. Change: D-155 (a gate's seed count lives in the tool and the smoke).
- Smoke 565/565 (+3: `audit119.cjs` ×2, Kiln gate in `burrower.cjs`) in 497 s (was 562 in 565 s).

## Session 120 — Build: S-57a Rift (v1.7.61, D-156)
- `src/rift.js` (schedule cursor over `rng['rift']` + the weather draws, site, open / close, shimmer, minimap dot);
  `world.retype` (type change without a crack, repaints the chunk + minimap); toast in `main.js`; `game.js` hooks
  `updateRift` after the weather and rolls `riftBonus` in `onCellBroken`. Nothing saved (no format bump).
- Gate `tools/eventrun.mjs` (biomefoe's pad + Relay, top build, creatures / weather off, detour to rift cells ≤ 12 cells):
  as specced Deep 1.026 / 0.965, Kiln 1.034 / 1.053 (8 seeds) → D-156 (double yield, Shoal / Kiln 3 + 6, 16-seed gate).
  Final, 16 seeds: Deep 1.092 / 1.089, Kiln 1.079 / 1.078: PASS (24: 1.073 / 1.077, 1.094 / 1.097). ~1.6 rifts / 10 min.
- Observed: Surge runs swing ±10 % from any change to the path (one seed 1080 vs 1419), so 8 seeds can't see a 5–10 %
  effect. Screenshot (1280 × 800): the Hearth pocket (● + ◆) outlined violet-white beside the Nexus, toast on top: reads.
- `tests/rift.cjs` (8 node checks incl. the gate, 1 browser). Smoke 574/574 (+9).

## Session 121 — Build: S-57b Rift pointer and tones (v1.7.62, D-157)
- `hud.js` `drawRiftPointer` (after the Nexus pointer, `r.riftPointer` for tests); `audio.js` `riftOpen` / `riftClose`,
  called from `openRift` / `closeRift`. Scanner: rift cells are ore types, so a ping marks all 9 (no new rule; tested).
- First chevron (2 px, no glow, 0.6 alpha) read as a grey tick in the screenshot; now 3 px with an 8 px glow. Viewed at
  1280 × 800 with the pocket off screen bottom-left: violet-white chevron next to the cyan Nexus arrow, no overlap.
- Chimes rendered: open peak −33.1 dBFS (as loud as the Anomaly take), close −38.0, 0 % > 2 kHz, loud ≤ 0.15 s.
- `rift.cjs` +2 (node: chimes once each + Scanner 9 marks; browser: chevron only off screen, points at the pocket,
  gone at the close), stash-proved failing on the old code; `audio.cjs` +1 row. Smoke 577/577 (+3).

## Session 122 — Design: M14 boss specs S-60a…S-62 (v1.7.63, D-158)
- Play-test (1280 × 800, `rift.cjs` shot + an off-screen probe): the Hearth pocket reads at the light's edge with its
  toast; off screen, the violet-white chevron sits beside the cyan Nexus arrow in the bottom-left corner, no overlap,
  though it is the dimmer of the two (fine: the toast and chime carry the open). No change.
- Re-checked S-58 / S-59 against `config.js` (`VENT_PERIOD_S` 8, `VENT_R` 2.5, `VENT_HEAT` 0.4, Undertow 30–55 px/s,
  thrust 190): numbers hold, specs unchanged; S-58 is next.
- Lair probe (30 seeds, 256 world, 9 × 9 all in ring, ≥ 2 cells clear of vault footprints, ≥ 3 from vents and
  Anomalies, ≥ 6 from Spires): Shoal d 88–100 found on 30 / 30 by draw 2; Kiln d 108–118 on 30 / 30 by draw 11.
- Specs S-60a / S-60b (`07-Build-Specs-15`), S-61a / S-61b / S-62 (`-16`); Q-026 settled (no); Q-032 opened.
- `05` split: v1.5.43–v1.6.58 moved word for word to `archive/changelog-v1.5.43-v1.6.58.md`.

## Session 123 — Build: S-58 Flare Lock (v1.7.64, D-159)
- `lock.js`: outer vaults centred in the Kiln (seeds 4242 / 7 / 99 / 5: one each; 31337: none; 8 locks on 8 seeds).
  `world.hitMul` hook: shell × 0, × 2 in the last 3 s of the 8 s cycle; tell edge orange; grey sparks; window flare.
- Probe (`lock.cjs`, top build): plain vault 1.50 s, lock 2.91 s mean over 32 phases = **1.94×** (≤ 2× PASS). The spec's
  2 s × 1.5 gave 2.48×, so tuned (D-159). Screenshot of the tell viewed: orange shell edge reads in the core's light,
  dimmer past it (same layer as the vents; fine, the cycle is learned up close).
- `tests/lock.cjs` (6 node + 1 browser checks), failing on the old code (no `lock.js`). Smoke 584/584 (+7).

## Session 124 — Audit: Scanner ring off shadowBlur, phone sweep, 09 archive (v1.7.65, D-160, D-161)
- No subagent tool: sweeps in-session, newest code first (`lock.js`, `rift.js`: edge cases on save / reload / New
  Cycle / mode match their headers; D-155…D-159 numbers match `config.js`). No new bug found there.
- Debt two audits carried, done: Scanner ring cost on phones. `perf.cjs` `VP=phone ONLY=scan`: 1.73× base before,
  1.12× after (D-160). Ring screenshot viewed (1280 × 800): still a glowing amber line. Phone sweep (6 sizes, Large
  text on two, Kiln, 5 banks, Echo, 3 buffs): no overlaps, nothing off screen, buttons ≥ 44 px; 320 and 568 viewed.
- Still open (third audit): the smoke's browser phase; `04` Debt says to time each browser file next audit.
- Workflow review: the standard run was summarized after PR 1 (subagent ~156k tokens, ~30 min) and ran 2 PRs (D-161).
  Too much: a subagent PR's own context; too little: nothing new (sweeps in-session stay the norm with no subagent tool).
- `09` sessions 114–118 archived word for word (`archive/2026-11-25-09-sessions-114-118.md`, part 16 removed).
- Smoke 585/585 (+1, `audit34.cjs` ring check), 567 s.

## Session 125 — Build: S-59 Tide Lock, M13 done (v1.8.66, D-162)
- `lock.js` `tideSites` / `tideFlow` / `drawTides`; `undertow.js` makes a lock chunk flow; `world.hit` takes an optional
  dir (Echo). 8 seeds: 24 Tide Locks, 16 of them on a calm draw (now 40 px/s); flows elsewhere unchanged.
- Probe: lock 3.60 s = plain 3.60 s from downstream (1.00×). Screenshot viewed (seed 4242 new world): five mint `>`
  chevrons on the shell's upstream column read at a glance, pointing with the flow.
- `tests/tidelock.cjs` (4 node + 1 browser checks), failing on the old code (no `tideSites`). M13 ✅ → v1.8.
- B-093 (caught by smoke): `undertow.cjs` failed on 2 lock chunks whose centre sits outside the Shoal; the check now
  names Tide Lock chunks as allowed (D-162), the band and bearing checks still apply to them. Smoke 590/590 (+5).
