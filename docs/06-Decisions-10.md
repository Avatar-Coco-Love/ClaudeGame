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


### D-076 — S-22 Relays as built (2026-11-24, session 50; implements D-056)
- `game.relays` = `[{ i, x, y, r, glow }]` is `R.lightSets[1]`; `craft = { beacon, relay, last }`; `SAVE_FORMAT` 11.
  `game.atDeposit()` (Nexus ring or a Relay's 64 px) drives banking and the cargo-full toast; heal, Matrix and Glitch
  repel still read `inNexus()`. Streaks fly `RELAY_STREAK_PX` 200 toward the Nexus (a full trip would leave the screen).
- **B / ✦ places `craft.last` if still carried, else the other carried item** (`placeKind`): one key, no dead press.
- Refusals beyond S-16's: "Too near a vault" / "Too near a Spire" (own words, so the player knows what to move from);
  a cell already holding a Beacon or Relay is "Blocked". A Relay reveals nothing on placement (it is not a light tool).
- A faint dashed ring at 64 px shows where cargo banks. Measured (`tools/relayrun.mjs`, 20 seeds, mid build): a 10▲ haul
  from d 60 takes 6.95 s to the Nexus, 1.42 s with a Relay at d 50 (−80 %; spec asked ≥ 30 %); Surge same (start build
  9.64 → 1.80 s), 0 deaths either way on a cleared tunnel. Same gain in both modes; no heal, so Surge gets no perk (D-002).
- Rejected: a separate key per item (D-056); refusing a Relay without saying why vault/Spire; a reveal like a Beacon's.

### D-077 — M3 and M4 are both done: v0.4 (2026-11-24, session 50; applies D-046, corrects D-056/D-063's "v0.3")
- M3's last item (S-21, #45) shipped before D-063 was written, but no version bump followed; D-056/D-063 still said
  "M4 done → v0.3". D-046's rule is the highest N with M1…MN all ✅: M1–M4 → **v0.4.54**. Both headers now say ✅.
- Rejected: v0.3 (would keep a minor that matches no rule); renumbering past versions (history in `05` stays as shipped).
