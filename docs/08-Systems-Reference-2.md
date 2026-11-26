# 08 — Systems Reference, part 2

Continues `08-Systems-Reference.md` (same rules: moved word for word from `02`, one entry per system; update it here
when the system changes). Moved in Design 132 for `02` headroom.

## Systems
- Weather (S-33, D-097, `weather.js`): every 300–420 s (seeded, unsaved), 40 s: Surge storm (spawns ×0.75, cap +2, violet dark),
  Drift aurora (Shard / Prism breaks in the core's light +1 at 40 %, teal dark, shimmer). Never in a Wake / the ending (the cut event is saved, D-117).
- Anomalies (S-35/36, D-099, D-101, `anomaly.js`): seed-only sites (3/5/8 by ring; a 256 world 28) in rock, kind 1/3 each: Overclock
  (beam ×1.5), Lodestone (reach ×2, pull ×1.5), Ballast (cargo ×1.5) via `stat()`; kinds stack; end when a deposit banks
  all cargo; recharge 300 s. Saved `anomalies` + `buffs` (format 15). Chip `#buffs`. Bot: `surgebot --anomaly`.
  S-37 (D-102): minimap sites, Scanner marks, end tone, hint line.
- Echo (S-42, D-112, `echo.js`, 30 ●): follows by BFS, blinks back when stranded, Gathers ore at 0.5× beam dps. Bot `tools/echobot.mjs`.
  Orders (S-43, D-113): R / ◇ cycles Gather ↔ Guard (0.8 hp / 0.8 s at the foe nearest the core ≤ 140 px); chip in the
  `#buffs` row; saved `echoOrder` (format 16). `tests/echoorder.cjs`; `ECHO=guard tools/wakeprobe.mjs` (no Wake cut).
- Lens (S-63, D-176, `rift.js` `callRift` / `callBlock`): Nexus row ▲ 40 (`nexusLevels.lens`, format 24). C / ❖ (D-177) spends
  `RIFT_CALL_COST` ▲ 30 and opens a rift now (own stream `rng['rift-call']`, `open.called`, closes at t0 + 45 s; a natural
  one due meanwhile is skipped). Refused, nothing spent: Nexus ring, open rift, weather / Wake / ending / awake boss,
  `RIFT_CALL_CD` 150 s (unsaved; D-178), < 30 ▲, no site. ❖ dims while refused. `tests/lens.cjs`.
