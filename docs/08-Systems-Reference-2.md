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
  Orders (S-43, D-113; S-69, D-184): R / ◇ cycles Mine → Defend → Auto (ids gather / guard / auto; 0.8 hp / 0.8 s,
  closing bolt first, then soonest to the core ≤ 140 px); Auto: threat → Defend, 2 s calm → Mine; chip in the
  `#buffs` row; saved `echoOrder` (format 16). `tests/echoorder.cjs`; `ECHO=guard tools/wakeprobe.mjs` (no Wake cut).
- Lens (S-63, D-176, `rift.js` `callRift` / `callBlock`): Nexus row ▲ 40 (`nexusLevels.lens`, format 24). C / ❖ (D-177) spends
  `RIFT_CALL_COST` ▲ 30 and opens a rift now (own stream `rng['rift-call']`, `open.called`, closes at t0 + 45 s; a natural
  one due meanwhile is skipped). Refused, nothing spent: Nexus ring, open rift, weather / Wake / ending / awake boss,
  `RIFT_CALL_CD` 150 s (unsaved; D-178), < 30 ▲, no site. ❖ dims while refused. `tests/lens.cjs`.

## Cell types (moved from `02`, session 155)
Rock, dense rock, crystal (→ Shards ◆), prism (→ Prisms ▲, farther out), Lumen (●), Tide ≈ / Calx ⬟ (Shoal / Kiln,
S-49, D-135; spent on Overdrive), vault shell + cache, Spire shell / core / facet, boss core / plate, and a bedrock border.

## Tracer (S-72, D-190, D-193)
Veil and out, 1 at a time (2 from the Deep), every `TRACER_S` 40–60 s, on a field cell 16–24 steps out and off screen.
`flow.js`: one 4-way BFS from the core's cell, 32 cells out, rebuilt on any break, a core cell change or every 0.5 s;
`downhill` (8-way, no corner cuts). 0.8 × the tier's Glitch speed, a Glitch's hp; straight at the core with a clear line
≤ 3 cells; fades if its field distance stalls 6 s or it leaves the field. Surge: 8 + tier step dmg, Glitch loot. Drift:
a touch takes 1 item (`biteCargo`) and it flees up the field (≤ 6 s); a kill gives the item back. `dev.tracer()`;
`perf` runs `deep` / `hunt`; `tests/tracer.cjs`.


## Pincer pair (S-73a, D-194)
Deep and out, one pair every `PINCER_S` 70–100 s, never while one lives; both on the Tracer's spawn rule, ≥ 10 cells
apart (`hunter: 'lead' | 'flank'`, `mate`). Lead: the Tracer's walk. Flank: every 0.5 s (one search a frame across all
flanks, `hunt.frame`) `flow.js` `aStar` (8-way, octile, ≤ 800 nodes) to the field cell nearest core + velocity × 1.5 s
that is ≥ 4 cells from the lead's next 8 field cells; +8 cost within 2 cells of them; no path → the field. Its give-up
clock counts path steps left. Surge 6 + tier step, Drift 1 item each; one killed → the other flees 3 s, then fades.
`pincer.js` (flank way, draw), `dev.pincer()`, `tests/pincer.cjs`.
