# 07 — Build Specs, part 4

Continues `07-Build-Specs-3.md` (same rules; build order in `07-Build-Specs.md`'s header, D-063). Written in Design 42; refreshed in Design 52 (D-081/D-082). S-30 built (#60, D-085), S-23 built (#61, D-086). S-24 built (#65, D-090), S-29 built (#66, D-091): v1.0.0. Design 62 added S-34 (D-092). Design 57 added S-31 (built #63, D-088) and the first M6 specs (S-32, S-33, D-087).
None of these adds a sink: the Wake and the ending spend nothing; New Cycle resets the world's supply with the world (D-062).

## S-34 — Relay reclaim (player request; v1.0.x, before M6) (D-092, Q-018)
- **Pick up:** B / ✦ inside a Relay's bank ring (`relayAt`, 64 px) picks that Relay up when no Relay is carried
  (`craft.relay` < `RELAY_STOCK`): it leaves `game.relays` (light, floor glow, minimap ring go the same frame), stock + 1,
  `craft.last = 'relay'`, toast "Relay picked up — place it further out". Carrying one already: toast "Already carrying
  a Relay" and nothing changes. Outside every ring, B / ✦ places exactly as now (S-16/S-22).
- Free both ways: no cost, no refund (it never left the world's supply). Re-placing on the same cell works (the gap rules
  skip the Relay being moved). No save change: `relays` is a cell list and `craft.relay` is saved.
- **Hint** (touch and desktop) while in a ring with nothing in cargo: "B: pick up this Relay" / "✦: pick up this Relay".
- **Smoke:** pick up → relays − 1, stock 1, the light set shrinks; place it 30 cells on → placed; pick up with one
  carried → refused, unchanged; pick up + place on the same cell → back; reload keeps the moved Relay; a Beacon press
  outside rings unchanged; banking at the ring the frame it is picked up doesn't crash (cargo stays).

## S-32 — Spitter: the first Glitch variant (M6, after v1.0) (D-087)
- Surge only (M6 is Surge depth; Drift's M6 piece is S-33's aurora). Natural spawns at tier ≥ 2 (Deep): 1 in 4 is a
  Spitter (`rng['glitch-spawn']`, same stream). It stops at 200 px from the core and fires a bolt every 2.2 s: 150 px/s,
  8 damage, stops at the first solid cell, beam-killable (hp 0.5). Its own hp ×0.8; loot as its tier. Violet-orange
  diamond, no humanoid shape; a 0.4 s glow before each shot (readable, D-002 fairness). Wake Glitches stay plain.
- **Smoke:** spawn share 20–30 % over 400 Deep spawns; a bolt hits a core in the open, never through rock; the beam pops
  a bolt; `surgebot mine` Surge deaths/min at mid stay ≤ 0.2 (log the table).

## S-33 — Weather: static storm (Surge) and aurora (Drift) (M6) (D-087)
- One event at a time, every 5–7 min of play (seeded `rng['weather']`), 40 s long, toast on start/end, never during a
  Wake or the ending. **Storm** (Surge): Glitch spawn interval ×0.6 and cap +2 while it lasts; the darkness tints violet.
  **Aurora** (Drift): ore within the core's light shimmers and yields +1 per break (the same +supply in both: a storm's
  extra kills pay ~the aurora's extra ore; measure with `surgebot mine`, both ≤ +25 % haul/min).
- **Smoke:** both fire on schedule from the same seed; neither starts inside a Wake; haul ratio storm/aurora 0.8–1.25.
