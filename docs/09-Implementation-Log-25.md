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
