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

### D-109 — S-41 adaptive graphics: sample the frame gap, step-up bar 18 ms, bounce backoff (2026-11-24, session 78, Build; extended by D-110)
- Built S-41 (`quality.js`, `settings.graphics` Auto/High/Low, levels L0 DPR ≤ 2 · L1 DPR 1 · L2 + half the particles
  drawn (fixed per particle, no flicker) + pickups without glow + unsmoothed light blit, the audit 74 Debt item).
- **Sampled value:** the real gap between played frames (`now − last`, unclamped), not JS work time. Measured headless:
  JS work ~1 ms on a frame whose gap p90 was 33 ms (canvas raster is deferred, so work time misses it).
- **Step-up bar 18 ms, not the spec's 14:** vsync holds a 60 Hz gap at 16.7 ms, so p90 < 14 can never happen there.
- **Bounce backoff:** a step down right after a step up doubles the wait to step up (10 → 20 … ≤ 160 s), so a device on
  the edge settles instead of cycling every 13 s. Paused / title / ending frames and stalls > 1 s reset the window.
- Rejected: JS work time (misses raster); a 14 ms bar (unreachable at 60 Hz); a fixed step-up wait (oscillates);
  skipping every other particle by index (flickers as particles die); a no-glow pickup with the glow sprite's size.

### D-110 — Auto graphics judges each step down; DPR ≤ 1 skips L1 (2026-11-24, audit 79, B-073)
- **A step down must pay:** the first full 3 s window after a step down needs p90 < `QUALITY_GAIN` (0.85) × the p90 that
  caused it, or the step is undone and Auto stops stepping down until Auto is chosen again in Settings. A 30 Hz rAF cap
  (iOS Low Power, battery saver) gave 33 ms at every level, so Auto sat at L2 (DPR 1, plainer) for nothing.
- **DPR ≤ 1 screens step L0 ↔ L2:** there L1 (DPR 1) draws exactly as L0, so a 0↔1 step was a free bounce + 3 s slow.
- D-109's backoff wording, precisely: any step down whose last step was up doubles the wait; it never shrinks back.
- Rejected: detecting a cap from the gap's 16.7 ms multiples (a slow 60 Hz device also snaps); a time-limited backoff
  (no bounce evidence it's needed); stepping down again after a cooldown (the cap doesn't lift mid-session).

### D-111 — Two stale pointers in old decisions (2026-11-24, audit 79, docs drift)
- D-026: a death's scatter is bounded by the hold, which is 140 normally and 210 with Ballast (D-103); still bounded.
- D-044: `docs/projects-card.html` never existed in this repo; the card lives in the Projects repo (#14, `04`).
- Rejected: editing the old entries' text (06 is append-only; only their headings point here).
