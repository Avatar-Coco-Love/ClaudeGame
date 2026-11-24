# 06 — Decisions log, part 15

Continues `06-Decisions-14.md` (same rules: supersede, never edit; list rejected alternatives). D-108 on.

### D-108 — Inbox: the owner's AI ally becomes M9 "Echo"; the audio pack is confirmed (2026-11-24, session 77, Design/inbox; supersedes D-045's "finished after M8")
- **Adopted, not parked.** The owner asked for an ally that follows the core, keeps up, and takes orders. It serves
  pillar 2 (both modes get a reason to want it) and pillar 4 (one ally, two orders, one loop). It joins as **M9 Echo**,
  after M8, and `VERSION` gets **M9 → 1.4** (D-046's rule, extended). The game is finished after M9, not M8.
  It replaces nothing in M8: S-41, ambient music and recorded audio stay.
- **What it is:** the **Echo**, a lesser core: a small hollow diamond in the core's colour, tethered by a faint line.
  Geometry only, no figure (pillar 1). One Echo per world, never a squad. It never takes damage and Glitches ignore it
  (no death or repair state to build); it collides with solid cells like the core.
- **Granted by Research** (new *kind* of thing, `01`), 30 ● after Scanner, Wide, Pulse: Research then costs 105 of a
  world's ~141 ●. Lumen lives only in the Deep, so the Echo arrives mid-game, after the player has learned to haul alone.
  New Cycle resets it with the rest of Research. Not a Matrix stat, a Crafting item or a Spire reward (no double unlock).
- **Orders (two):** **Gather** mines exposed ore near the core (Shard / Prism / Lumen cells only, never rock: the player
  stays the one who carves) and its yield drops as pickups for the Attractor. **Guard** shoots Glitches and Spitter bolts
  near the core. Drift wants Gather; Surge trades Gather (income) against Guard (safety). Gather pays the same in both
  modes, so parity (Q-007) holds; Guard earns nothing but the usual kill drops.
- **Keeping up:** a BFS distance field from the core's cell over open cells, rebuilt 2× a second and on any cell break
  within 24 cells (measured: 0.55 ms for a fully open 160×160 world, unthrottled, so a bounded field is far cheaper).
  Catch-up rule: path distance > 10 cells, or no progress for 1.5 s → **blink** to an open cell beside the core
  (0.25 s fade). A bot measures strand rate and lag over many seeds (S-42).
- **Controls:** one order key (rebindable, S-39 list) and one phone button that cycles the order; no radial, no
  third button. The order is shown on the button and as a chip.
- **Audio pack (Q-021):** the owner confirmed the recorded pack is coming. v1a/v1b stay in M8; v1.3 waits for them.
  If S-41 and ambient music are done first, M9 is built in the meantime (minor bumps only when M8 is all ✅).
- Rejected: **parking** it in Later (the owner asked for it by name and it fits the pillars without a new currency);
  an **Attack** order that hunts away from the core (it would leave the core, against "never falls behind", and is a
  Surge-only toy); **3–4 order buttons** (no room in the phone row, D-058); **several allies** (shallow, and cost);
  a **killable** ally (a death, revive and save state for little play); Gather **mining rock** (it would carve the
  world for the player, pillar 3); **straight-line follow + teleport only** (it would blink through every bend: reads as
  broken); granting it from the **first Spire** (ties a Drift/Surge-neutral tool to a late milestone); **replacing
  recorded audio** with it (the owner says the pack is coming).
