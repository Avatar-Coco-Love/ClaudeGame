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
- Echo (S-42, D-112, `echo.js`, 30 ●): follows down the core's shared `coreField` (S-73b, D-198; path cap 24), blinks back when stranded, Gathers ore at 0.5× beam dps. Bot `tools/echobot.mjs`.
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
≤ 3 cells; fades if its field distance stalls 6 s or it leaves the field. Surge: 8 + tier step dmg, no loot (S-74b, D-201). Drift:
a touch takes 24 ◆-worth (`biteWorth`, most valuable first) and it flees up the field at × 1.5 (≤ 6 s); a kill gives it back. `dev.tracer()`;
`perf` runs `deep` / `hunt`; `tests/tracer.cjs`.


## Pincer pair (S-73a, D-194)
Deep and out, one pair every `PINCER_S` 70–100 s, never while one lives; both on the Tracer's spawn rule, ≥ 10 cells
apart (`hunter: 'lead' | 'flank'`, `mate`). Lead: the Tracer's walk. Flank: every 0.5 s (one search a frame across all
flanks, `hunt.frame`) `flow.js` `aStar` (8-way, octile, ≤ 800 nodes) to the field cell nearest core + velocity × 1.5 s
that is ≥ 4 cells from the lead's next 8 field cells; +8 cost within 2 cells of them; no path → the field. Its give-up
clock counts path steps left. Surge 6 + tier step, Drift 24 worth each; one killed → the other flees 3 s, then fades.
Each dot has a white pip (S-73b, D-197: lead filled r 3, flank a 1.5 px ring; `PINCER_PIP`).
`pincer.js` (flank way, draw), `dev.pincer()`, `tests/pincer.cjs`.

## Ring foes, events, bosses, hunters (moved from `02` word for word, audit 159)
  Spitters (S-32, D-096, `spitter.js`): 1 in 4 natural spawns at tier ≥ 2; hold 200 px, bolt every 2.2 s with a clear line (8 dmg, rock stops it, beam pops it).
- Rift (S-57a, D-156, `rift.js`): every 240–360 s (waits out weather), 45 s, a 3 × 3 rock pocket 8–12 cells out in the core's ring turns to ore (×2 yield; Shoal / Kiln 3 + 6 ▲), reverts unmined; unsaved, both modes; shimmer, minimap dot, toast; S-57b (D-157): edge chevron while off screen, open / close chimes. Gate PASS (D-156). `08`.
- Locks (`lock.js`, `world.hitMul`): Flare (S-58, D-159, Kiln outer vault: shell × 0, × 2 in the last 3 s of 8 s) / Tide (S-59, D-162, Shoal: only against the flow).
- Crucible (S-60a, D-163, `boss.js`): seed-only Kiln lair stamped by the Game; only the lit plate of 8 cuts, then (i + 5) mod 8; core flares; saved `bosses` [{ ring, down }]. B-095 fixed (D-164).
  Surge (S-60b1, D-165): awake ≤ 10 cells: any plate, 4 s flare + 10 dmg, embers; death heals the core. Gate `bossrun.mjs` PASS (S-60b2, D-167). Q-033 closed (D-169).
- Gyre (S-61a, D-168, `gyre.js`): Shoal lair, whirlpool 45 px/s ≤ 6 cells (`flowAt`); mint key steps clockwise / 1.2 s.
  Surge (S-61b, D-171): any plate; tagged mote swarms / 15 s (≤ 2, `spawnSwarm`), rim 12 dmg / 4 s (≤ 8 px), pull 30; gate `--boss=gyre` PASS.
  Perf (D-174): `perf.cjs` run `gyre`; only the core ring is blurred, rim tell = strokes (1.33× → ~1.1× of shoal).
  Marks (S-62, D-173): Chart L2 shows unseen lairs faint; sting on wake / first Drift plate; ending "Bosses n / 2" (256). Q-034: no.
- Tracer (S-72, D-193, `hunter.js`, `flow.js`, `game.hunters`): Veil+, walks the core's BFS field; Surge hits, Drift steals 24 worth.
  Pincer pair (S-73a, D-194, `pincer.js`, `aStar`): Deep+, lead on the field, flank by A* round the lead; white pips (S-73b, D-197).
  The Echo reads the same `coreField` (S-73b, D-198: one build, its path cap 24 kept). `08-…-2`.
- Burrower (S-53a/b/c, D-145…148, `burrower.js`): Kiln creature, every 20–30 s, hunts the core; Surge lunge 22 / Drift bites 4 cargo; unsaved. Gate `biomefoe.mjs` PASS (`GATE_SEEDS` 8, D-155).
- Motes (S-54, D-150, `mote.js`): Shoal swarm of 6, 40–60 s, ride the current; Surge 4 dmg, a touch takes 1 item, Drift carries loose ore; gate PASS.
- Decoy (S-77a, D-208, D-212, `decoy.js`): crafted ▲4 ◆20, carry 2, 3 placed, outside the Nexus disc; a non-fleeing hunter
  that sees one ≤ 6 cells locks on, circles it; 4 s after the first arrival it is spent. Not Glitches / Echo / bosses. Saved.
