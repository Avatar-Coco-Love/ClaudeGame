# 05 — Changelog

One entry per merged PR, newest first. Version = `<major>.<minor>.<PR count>` (D-046: minor = milestones shipped; 1.0 = M5; D-105: patch = PRs since 1.0.0). `VERSION` in `src/config.js` must match the top entry
(`tests/docs.cjs` enforces it). Write for a player: what changed on screen, not how it was coded. Detail lives in `09`.

## v1.10.86 — 2026-11-26
- The Echo has three orders now: **Mine**, **Defend** and **Auto**. A new Echo starts in Auto: it mines, turns to
  defend when something comes for you (a ring round it shows it), and goes back to mining 2 s after it is safe.
- Smarter in every order: it shoots an incoming bolt first, then whatever would reach you soonest, and mines the most
  valuable ore in reach rather than the nearest. Defend also works in Drift (Burrowers, Motes).

## v1.10.85 — 2026-11-26
- No change in play: a health check. The game's own tests got steadier (two that failed now and then under load), so
  new features reach you with fewer false alarms.

## v1.10.84 — 2026-11-26
- No change in play yet: your feedback shaped the next updates. The Echo gets Mine, Defend and a smart Auto mode
  plus its own upgrades, then new hunters arrive that follow you through the tunnels you dig, in Drift and Surge alike.
  World feats come after that.

## v1.10.83 — 2026-11-26
- No change in play yet: the next update is planned. Each world will keep a short list of feats (open every vault,
  chart a third of the map, empty five rifts and more) shown at the Nexus and on the ending card. They pay nothing
  and count the same in Drift and Surge.

## v1.10.82 — 2026-11-26
- **The Nexus reaches out (v1.10).** The Nexus now wears what you've built: a thin cyan ring for Radiance, a mint one for
  the Chart and a violet-white one for the Lens. The Lens ring dims while a call recharges and brightens when you can
  call again, and buying a Nexus upgrade sends a white ring out from the Nexus itself.

## v1.9.81 — 2026-11-26
- **Lens tuned:** a rift can be called once every 150 s (was 90 s). Tested over many runs in Deep, Shoal and Kiln:
  calling on every cooldown now earns at most about a quarter more ore than plain mining, and always costs more ▲
  than it brings back, the same in Drift and Surge. A call stays a choice, not the new way to mine.

## v1.9.80 — 2026-11-26
- **Clearer buttons:** the Lens's call-a-rift button is now ❖ (it used to be ✧, the same mark as the Lodestone
  Anomaly's chip). No other change in play; a health check behind the scenes (phone layouts re-checked with every
  button shown).

## v1.9.79 — 2026-11-26
- **New: the Lens.** A Nexus row for 40 ▲. Once built, press C (or tap ✧) anywhere outside the Nexus to spend 30 ▲
  and open a rift nearby right now: the same 45-second ore pocket as a natural rift, from your ring. One call every
  90 s; it won't open during weather, a Wake, an awake boss or while a rift is open, and a refused call costs nothing.

## v1.9.78 — 2026-11-26
- No change in play yet: the next update is planned. Late on, Prisms pile up with nothing to buy, so the Nexus will
  grow a Lens that calls a rift where you stand, for a Prism price, in both modes.

## v1.9.77 — 2026-11-26
- Smoother Gyre fight. The awake Gyre's rim warning now glows with layered lines instead of a costly blur, so frames
  near the whirlpool stay closer to the rest of the Shoal. It looks the same: a sparking mint outline.

## v1.9.76 — 2026-11-26
- **Bosses complete (v1.9).** The Chart's second level now marks each boss lair you haven't found as a faint octagon
  on the minimap. A low two-note sting sounds when a boss wakes in Surge or when its first plate breaks in Drift.
  On a large world the ending card adds "Bosses n / 2" (beating them is still optional).

## v1.8.75 — 2026-11-26
- Health check (no gameplay change). The phone layout tests now wait for the camera the right way and run 40 s
  faster; the dev log was tidied and a probe for stalled test waits was added.

## v1.8.74 — 2026-11-26
- **The Gyre wakes in Surge.** Come within 10 cells and every plate can be cut, in any order. It fights back: every
  15 s a mote swarm leaves the lair's edge (two at most), its whirlpool drags you inward, and hugging the body lashes
  you (12 damage and a shove out into the current) at most once every 4 s. Watch the body's mint outline: when it
  sparks, the rim is ready to strike. Drift keeps the calm stepping-key puzzle.

## v1.8.73 — 2026-11-26
- Design pass on the bosses (no gameplay change). The Crucible's embers stay a threat for a core that stands off; up
  close its flare is the danger. The Gyre's coming Surge form is planned the same way: mote swarms at range, a rim
  that lashes a core hugging the body, and a pull that drags you in if you stop steering.

## v1.8.72 — 2026-11-26
- New in the Shoal (large worlds): the Gyre, a second boss. Its lair sits in a whirlpool that carries you round it
  clockwise; one plate glows mint and only it can be cut, and the glow steps round the body every second or so. Ride
  the current with the beam on the glowing plate; each plate keeps the damage it took. Down, it pays like the Crucible
  (with Tide ≈) and the whirlpool stills. Same fight in Drift and Surge for now.

## v1.8.71 — 2026-11-26
- No change in play. A balance bot now fights the Crucible to the end in both modes on every test run, so its two
  forms stay equally quick to take down (about 40 s at the top build).

## v1.8.70 — 2026-11-26
- Health check, no change in play. The game's own test run is about 90 s shorter (its balance bots now run side by
  side), and it reports which tests take longest.

## v1.8.69 — 2026-11-26
- **The Crucible wakes in Surge.** Come within 10 cells in Surge and every plate glows and takes your beam, in any
  order. It fights back: its flare now comes every 4 s and burns (10), and it lobs embers at you when it can see you
  (rock blocks them, your beam pops them). Die and its core heals, but broken plates stay broken. No storm or rift
  starts mid-fight. Drift keeps the calm take-apart puzzle. New low thump and ember sounds.

## v1.8.68 — 2026-11-26
- **The Crucible can be finished.** In the live game the glow stopped after the first plate broke, so no plate took
  damage and the boss could not be downed. Now the glow jumps across the body after every break, as intended.

## v1.8.67 — 2026-11-26
- **The Crucible (first boss, Kiln).** Deep in the Kiln a 9 × 9 lair holds an ember core ringed by eight rose plates.
  Only the plate that glows takes your beam; break it and the glow jumps across the body, so you keep circling it while
  the core flares heat at anyone too close. Strip all eight, break the core, and it bursts 80 ◆, 20 ▲ and 24 ⬟. A seen
  lair is an octagon on the minimap, filled once it is down. Both modes take it apart the same way for now.

## v1.8.66 — 2026-11-26
- **Tide Locks — events and puzzles complete (v1.8).** A vault in the Shoal's outer reaches always sits in a current, and
  its shell only gives to a beam aimed against the flow: cut it from downstream while the Undertow pushes you away. Faint
  mint chevrons on its upstream side show which way the water runs.
