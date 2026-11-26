# 06 — Decisions log, part 26

Continues `06-Decisions-25.md` (part 25 neared the 8 KB cap at D-176; same rules: supersede, never edit; list rejected
alternatives). D-177 on.

### D-177 — Audit 139: the Lens button is ❖; one glyph, one meaning; slow-test debt closed (session 139, Audit)
- Supersedes D-176's ✧ only (its place in the HUD stands). ✧ was already the Lodestone Anomaly's chip glyph, in a
  near-identical violet, a few cm away on a phone (B-099). ❖ (four diamonds: a pocket of ore) is in no other HUD
  role. Rule: a HUD button glyph is never also an Anomaly chip glyph (`lens.cjs` check, fails on the old markup).
- Phone sweep (carried two audits): 320 × 568, 360 × 780, 412 × 915, 568 × 320, 640 × 360, 844 × 390, Normal and Large,
  Surge, Echo, Lens, ✦, 3 buff chips, 5 banks at a 256 world's realistic top: no overlap, nothing off screen, all
  buttons ≥ 44 px. `touch.cjs`'s B-034 loop now also runs 320 × 568 and 412 × 915 portrait. Found: a 4-digit ● with a
  4-digit ◆ ▲ overlaps the minimap by 13 px at 320 portrait; a 256 world holds ~550 ● in all and a New Cycle resets
  the bank, so it can't happen in play (not fixed, not tested).
- The slow-file items (`quality` ~48 s, `ending` ~27 s, `spire` / `facet` ~20 s) leave the Debt list: they wait out
  real-time windows the checks are about (3 s p90, 10 s step-up; the ending sequence). Carried four audits, never
  worth a fix; the smoke runs ~500 s with the gates beside it.
- Workflow: a Debt line carried three audits gets fixed or closed with a reason in that audit, not copied on.
- Rejected: changing Lodestone's chip instead (older, in saves' toasts and players' memory); ⊛ / ⌖ (thin at 44 px);
  ◈ (reads as Echo's ◇); speeding `quality.cjs` with a fake clock in `Quality` (test-only hook in game code).

### D-178 — S-64 Lens gate PASS at a 150 s call cooldown (session 140, Build)
- Gate: `tools/eventrun.mjs --call` (in `gates.cjs`, checked by `lens.cjs`): the S-57a bot, max build, Relay pad, no
  creatures / weather, natural rifts off (`rift.force` 'calls', tools only), Lens built; 16 seeds × 10 min, both modes,
  Deep / Shoal / Kiln; policy mine vs call-on-cooldown (detour to the pocket). Value ◆ 1 ▲ 3 ● 4 ≈ / ⬟ 12, gross
  (▲ spent added back: the strict reading). "Net ▲ < 0" read as call − mine ▲ per run, spent included (the sink is
  real against not calling; a run's own ▲ is always > 0 from ring ore).
- Try 1, CD 90: Kiln 1.381 / 1.286 FAIL (Deep 1.17 / 1.20, Shoal 1.23 / 1.19). Try 2, CD 120: Kiln 1.304 / 1.237 FAIL.
  Try 3, CD 150: Deep 1.131 / 1.155, Shoal 1.147 / 1.092, Kiln 1.185 / 1.226; ▲ call − mine −35…−75 / run; Drift /
  Surge 0.97–1.05: **PASS**. Cost stays ▲ 30 (the pocket rules stay S-57a's, as the spec says).
- Rejected: cost 40 (it gates the first calls on the bank, not the rate: Kiln's excess is the call rate); net value
  (spent ▲ taken off: Kiln 1.01, would pass at 90 s but hides that ▲ is cheap to the bot); a separate `lensrun.mjs`
  (`eventrun` is 100 lines and shares the pad, detour and bot).

### D-179 — S-65 Nexus rings: unblurred hexagons outside the three, built order (session 141, Build)
- `nexusview.js`: one 1.25 px hexagon per structure built (Radiance / Chart / Lens, any level), 78 px out then +16 px
  (half a cell) in that order, so the rings pack with no gaps when the Chart is absent (a 160 world). Alpha 0.75; Lens
  0.22 while `callCooldown` > 0 (other blocks, like "rift already open", don't dim it: cooldown is the spec's tell).
  `shadowBlur` 0 inside the 'lighter' pass; the existing blurred clip box (112 px) stays as it was.
- Purchase flash: `game.nexusFlash` 1 → 0 over 0.5 s (any Nexus row, off with reduced motion), a white hexagon from the
  outermost ring. Radiance keeps its light sweep too; the core's S-4 ring stays Core Matrix / Research only.
- Perf: +3 strokes at most (smoke counts them, none blurred); `perf.cjs` home builds no structure, so it is unchanged.
- Rejected: fixed slots per structure (gaps in a 160 world read as missing), rings inside the 62 px one (crowded by
  the cycle hue), level ticks per Radiance level (the Nexus panel shows levels already), a blurred glow (D-160).
