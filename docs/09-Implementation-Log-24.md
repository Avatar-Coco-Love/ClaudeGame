# 09 — Implementation Log, part 24

Continues part 23 (`09-Implementation-Log-23.md`); sessions 170–173 archived in audit 179 (`archive/2026-11-28-09-sessions-169-173.md`). Newest at the bottom; read the tail only.

## Session 174 — Audit: B-113 Decoy lair refund, debt closed, 09 archive (v1.12.115, D-215)
- No subagent tool: sweep in-session, newest code first (`decoy.js`, `maplegend.js`, `huntrun.mjs --decoy`). Edge cases:
  death and mode switch keep Decoys (saved, like Wards); a held Decoy's clock runs once a frame before the hunters.
- **B-113 (fixed):** `boss.js` `refund` skipped `game.decoys`. A current save with an unreadable lair record and a
  Decoy on lair floor kept it (decoys 1, bank 0); now refunded ▲4 ◆20. New `boss.cjs` check FAILed on the old code.
- D-210…D-214 vs code: match. Debt: audit 164 watch closed (three audits), Design 167 blob closed (Q-044 settled).
- Workflow review (D-215): too little: no "every placed kind" checklist (rule added); too much: none new.
- `09` sessions 164–168 archived word for word (`archive/2026-11-27-09-sessions-164-168.md`).
- Smoke 733/733. Pitfall: bumping `VERSION` while smoke runs FAILs S-38 / S-29 (the version is read at the start); re-run clean.

## Session 175 — Build: S-66a Feats list (v1.12.116, D-216)
- `feats.js` derives six feats (four in a 160 world); `stats.kinds` / `stats.rifts` counters, format 27; Nexus tab list.
- Observed: a fresh world already has the Nexus reveal explored, so a chart stub must clear `explored` first (test fix).
  Screenshot 360 × 640: Radiance / Chart / Lens rows unscrolled, Feats 2 / 6 below, ✓ gold; 320 × 568 Large text no overflow.
- **B-114 (fixed):** `decoy.cjs` built its old save as `SAVE_FORMAT - 1`, so format 27 made it a post-Decoy save
  (FAIL 740/741). Now it finds the step adding `craft.decoy` (lens.cjs's way). Second time: a ban check is debt (`04-…-4`).
- New `feats.cjs` (9 checks) fails on the old code (no `feats.js`).
- Smoke 741/741.

## Session 176 — Build: S-66b Feats toast + ending row (v1.12.117, D-217)
- `checkFeats` on the feat events + `buy()`; unsaved `featsSeen` filled at load; `audio.feat()`; ending "Feats n / N".
- Observed: a `deposited` event pushed by a page test also toasts "Deposited" first, so the browser check uses
  `rift-close` (no toast of its own). Screenshot 360 × 640: "Feat: Rift runner (2 / 6)" over the Nexus, one line.
- New checks: `feats.cjs` +4 (toast once / reload / mode switch, Overdrive buy, summary, page toast), `ending.cjs`
  Feats row after Bosses (fits 568 × 320, no scroll), `audio.cjs` feat note ceiling. They fail on the old code (no `checkFeats`).
- **B-115 (fixed before merge):** the first cut checked when the frame's `events` held a feat event; bots never clear
  `events`, so one deposit made every later frame scan 65 k cells (`echobot --orders` stalled > 18 min). Now `notify()`
  sets `featDue` and the update runs one check per notify; `feats.cjs` asserts it.
- Smoke 746/746.

## Session 177 — Design: Q-045 settled, S-77b2 spec, S-67 / S-68 refreshed (v1.12.118, D-218, D-219)
- `huntrun --decoy` gains measure flags (`--cue`, `--price`, `--spend`, `--drop`, `--fixate`; default output unchanged,
  checked against D-214's rows). Saving Drift / Surge at 8 seeds (16), all with `--price=level` unless noted:
  seen −421/−596 % per-use price; seen 49/18 (–); line 32/41 (22/52); one 38/34 (2/45); throw 50/26 (32/51);
  fade 45/72 (23/61); **fixate 62/57 (59/56), ratio 1.09 (1.06)**, floor fails Deep only (−0.5 … −1.1 %);
  fixate + stock 1 19/50 (3/54); fixate + hold 3 54/70 (50/78). Every per-use price: −377 … −684 %.
- Play-test (Playwright, 1000 × 700, Drift, core on its own Decoy, a Tracer 4 cells off): it steered at the Decoy
  under the core and snatched 35 ◆-eq ("A Tracer snatched…" toast) before any hold started. Screenshot viewed: the ◈ is
  hidden under the core. So the lure aims hunters at you when you drop it at your feet: S-77b2's no-touch rule (D-218).
- `eventrun --call` prints pockets emptied: 1.6–2.4 per 10 min a ring; `FEAT_RIFTS` 5 ≈ 21–31 min (D-219).
- Observed: the hunters' cost gate fails on 16 seeds (pooled Drift / Surge 0.628; 8 seeds pass) → Q-046.
- Specs: S-77b2 (`07-…-22`), S-67 split into a rifts check + chart route, S-68 tied to `nexusRings` (`07-…-18`).
- Smoke 746/746.
