# 06 — Decisions log, part 10

Continues `06-Decisions-9.md` (same rules: supersede, never edit; list rejected alternatives). D-073 on.

### D-073 — Toasts queue; milestones hold their time (2026-11-24, session 49, Audit; fixes C3)
- One toast slot stays. A toast shows ≥ 0.8 s (`TOAST_MIN`, `main.js`); a milestone (`keep`: Spire found, ring entered,
  cache opened, destabilized) holds its whole time. A toast that answers a key or tap (`now`: beam mode, beacon result,
  mode switch) may replace a routine toast at once, never a milestone. The rest wait in a queue of ≤ 3; a repeat of the
  showing message only extends it; a new world clears the queue. Measured: beacon + Spire + cargo-full in 2 frames now shows
  all three in order and the Spire toast 3.2 s (was: Spire 32 ms, the beacon toast never).
- `#toast` gets `width: max-content` (T3): `left: 50%` had capped it at half the screen, so it wrapped at 320 px.
- Rejected: a stack of toasts (clutters the centre of a phone); dropping routine toasts under a milestone (cargo-full is a
  real instruction); a priority number per toast (three tiers say it).

### D-074 — The Nexus pointer slides inward off HUD boxes (2026-11-24, session 49, Audit; fixes T1)
- The arrow stays on its ray to the Nexus but walks inward (4 px steps) from the 40 px inset until neither it (12 px) nor its
  NEXUS label (44×16, 22 px inward) touches a HUD box (bank panel, minimap, buttons, hint, Matrix button). Boxes are read
  from the DOM at most twice a second and on resize. Measured: under a box for 56–131 of 180 headings by viewport, now 0
  at 568×320, 320×568, 412×839, 863×360, 1280×800 (`tests/hud.cjs`).
- Rejected: an inset per side tuned per layout (breaks with every HUD change); hiding the arrow under a box (loses the way
  home); reading the DOM every frame (forces a reflow after each HUD text write).

### D-075 — Tests never pin SAVE_FORMAT (2026-11-24, session 49, Audit; H5, the second time)
- `tests/saveformat.cjs` fails on `SAVE_FORMAT === <n>`, `<n> === SAVE_FORMAT` or `.v === <n>` in any test or tool (a line
  marked `pin-ok` is exempt), and checks one upgrade step per format (`STEPS.length === SAVE_FORMAT − 1`, now exported) and
  that a bare format-1 save upgrades to SAVE_FORMAT and loads. Old saves in tests still say `{ v: 9 }`: that is their format.
- Rejected: a comment in `save.js` only (the rule was already understood and broken twice; CLAUDE.md asks for a check).

