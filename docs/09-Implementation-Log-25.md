# 09 — Implementation Log, part 25

Continues part 24 (`09-Implementation-Log-24.md`, near the 8 KB cap). Newest at the bottom; read the tail only.

## Session 178 — Build: S-77b2 the Decoy holds without touching, from the Nexus Lure level (v1.12.119, D-218, D-220)
- `hunter.js`: a hunter with `e.lure` set never touches. `NEXUS_UPGRADES` gains Lure (▲ `LURE_COST` 30, max 1);
  `refillDecoys` (decoy.js) fills the stock on buying it and as each item banks; Craft row + `craftDecoy` + `DECOY_COST`
  gone; S-65 rings add a peach hexagon. Format 28: Lure 1 if the save held a Decoy (stock or placed), else 0.
- Lair refund (B-113) now returns a Decoy to the stock. `huntrun --decoy`: Design 177's measure flags dropped; the
  floor is pooled per mode; `tracer.cjs` gates it.
- First cut refilled only when cargo emptied: gate FAIL (saving 29.7 / 46.2 %, ratio 0.643; the bot mines on its Relay
  pad, cargo seldom hits 0). Refill per banked item: PASS, Drift 62.5 % / Surge 57.4 %, ratio 1.089, pooled cost with
  Decoys 4.6 % / 5.2 % — the same numbers as D-218's `--fixate --price=level` (D-220).
- Proved the no-touch checks fail on the old touch rule (stashed the `!e.lure`). A test stub Decoy without `hold: null`
  is spent on the first frame (NaN clock); stubs now carry it.
- Screenshot (360 × 640, Nexus tab): the Lure row sits under Lens, ▲30, fits; viewed.
- Smoke 750/750.

## Session 179 — Audit: B-116 arc key, `SAVE_FORMAT - n` banned, 09 archive (v1.12.120, D-221)
- No subagent tool: sweep in-session, newest code first (`decoy.js` S-77b2, `feats.js`, `hunter.js` contact, `boss.js`
  refund). Edge cases: a Decoy refunded or spent mid-lure releases its hunters before the contact check; death / mode
  switch keep Decoys. No new gameplay bug. Drift: `decoy.js` header still said "end of every deposit" (D-220); fixed.
- Debt two audits carried first (D-144). **B-116 (fixed):** the thumb arc's re-layout key ignored the bank panel, so a
  taller panel never moved the arc. Measured 390 × 844: the top slots sit at y 539–595, x 285–382; a panel to y 572
  and x 312 covers one. `arcKey` adds the panel's hidden-row count; the new `thumbarc.cjs` check FAILs on the old key.
- Build 175 debt: `echoorder` / `relay` / `echolevels` built "old" saves as `SAVE_FORMAT - 1` (format 27, not the
  10 / 15 / 24 their comments meant); now found by their step. `saveformat.cjs` bans the pattern (FAILs on the old three).
- D-215…D-220 vs code: match (D-220 supersedes D-218's refill wording). Workflow review: D-221.
- `09` sessions 169–173 archived word for word (`archive/2026-11-28-09-sessions-169-173.md`).
- Pitfall: a "baseline" smoke started before editing reads the edited tree; it is no baseline. Run it after.
- Smoke 751/751. Screenshot (390 × 844, Surge, stand-in tall panel): the arc sits clear below it; viewed.
