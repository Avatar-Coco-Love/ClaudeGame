# Changelog archive: v0.2.39–v0.2.42

Moved word for word from `docs/05-Changelog.md` (session 50, size cap).

## v0.2.42 — 2026-11-24 (#43)
- Smoother frames: the Nexus's glowing rings are now drawn only where they can be seen, and much more cheaply when they are.
  It looks the same; in a slowed-down test browser a frame away from the Nexus takes half as long (106 → 52 ms), at home 117 → 65 ms.

## v0.2.41 — 2026-11-24 (#42)
- No gameplay change. Design pass: the Pulse beam gets a plan to hold a full charge until a Glitch or wall is in reach,
  so it becomes the beam for picking off tough Glitches at range. Relighting a Spire is decided (feed it 80 Prisms, then
  a light puzzle in Drift or a 40 s defence in Surge), and Relays (remote deposit points) are planned.

## v0.2.40 — 2026-11-24 (#41)
- No gameplay change. Behind the scenes the game's code is tidied into smaller pieces (Glitches, the minimap and HUD each have
  their own file) to make room for Beacons and Spires. A recorded Surge run and a test scene look and play exactly the same.

## v0.2.39 — 2026-11-24 (#40)
- New Research node **Pulse Beam** (40● Lumen): hold fire to charge (a dotted line shows its 1.5× reach, the core glows brighter),
  let go to fire one burst that punches through up to 3 cells, or a Glitch. Full charge fires by itself; a short tap just fizzles.
  Q / ⟂ now cycles Focus → Wide → Pulse. Works with the mouse, Space, and the touch aim stick, in Drift and Surge.
