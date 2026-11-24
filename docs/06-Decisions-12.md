# 06 — Decisions log, part 12

Continues `06-Decisions-11.md` (same rules: supersede, never edit; list rejected alternatives). D-087 on.

### D-087 — Design 57: the Wake for a person; B-048; M6 specs (2026-11-24, session 57, Design; settles Q-017)
- `tools/wakeprobe.mjs` (mid, 20 seeds): guard `human` (re-aims every 0.25/0.35/0.5 s, ±0.08/0.12/0.2 rad) fails
  0/17/67 %; `still` (never moves) 100 %; charge left ~90 when held: deaths, not charge, end Wakes. Start build: 100 %.
- **Tune (S-31):** Wake Glitches one tier down → `human` 0/0/9 %, `still` 100 %: moving round the core is the skill.
  Waves 1.2 s with that: 0/17/49 %; 1.0 s: 86–100 % (a cliff). A start build can't hold a Wake: Surge asks for a build
  where Drift asks for a puzzle; both relight the same Spire (D-055). Rejected: never chasing the player (13/61 %, no
  better: body-blocking still hurts); shorter Wake (the clock is the drama).
- **B-048:** the bot healed at the Nexus for ~85 % of its Wakes and still held them: Wake Glitches despawned past
  1500 px from the core. S-31 fixes it; until then walking away holds a Wake (Design sessions change no game code).
- M6 specs S-32 (Spitter) and S-33 (storm / aurora as one spec, so Drift isn't second-class) written; built after v1.0.

### D-088 — S-31 as built (2026-11-24, session 58, Build; implements D-087, fixes B-048)
- Wake Glitches (`e.wake`) skip the despawn-by-distance; tier = depth tier − `SPIRE_WAKE_TIER_DROP` (1), floored at 0.
- The Wake's facets (lit and unlit) draw in `SPIRE_WAKE_RGB` while it runs; after it they return to the violet-white.
- Rejected: failing the Wake as soon as the core leaves the interior (stepping out to meet a Glitch in a lane is good
  play); a separate clock dial (the facets already are one, D-055).

### D-089 — Audit 59: the Wake on phones, give-up rule, supersede links (2026-11-24, session 59, Audit; amends D-086)
- **Ends D-055's interim:** since S-23 (D-086) only Drift toggles facets; this supersedes D-083's Surge bullet and D-081's
  "Surge too until S-23". A puzzle solve always records `'drift'` (`toggleFacet`).
- **Give-up (D-017) for Wake Glitches** counts progress toward what they chase (Spire core, or the player core within 3
  cells); switching target restarts the 6 s clock. A faded Wake Glitch costs no charge and drops nothing.
- **Camera:** while a Wake runs and the core is within 6 cells (`WAKE_FRAME_PX`), the camera frames the Spire core instead
  of the aim look-ahead, so all four lanes show (phones hid the east lane under ⟂/✦ and the north one off-screen).
  Rejected: fading the HUD (the buttons are needed mid-fight); zooming out (changes every size test); off-screen arrows (more UI).
- **Toasts:** a Surge prime with a Wake on the same frame shows only "Spire waking — hold 40 s" (NOW tier); copy cut to one
  line at 568×320. Lane order stays N E S W: south-first let a standing core hold on its third try (the tune depends on it).
- Kept: the "Circle the core" hint (touch audit thought standing still works; `wakeprobe` `still` fails 100 %).

### D-090 — S-24 Ending as built (2026-11-24, session 60, Build; implements D-045)
- `src/ending.js`. The last `relightSpire` calls `checkEnding`: `ended` + `endedAt` (stats time, for S-29's records) are
  saved (`SAVE_FORMAT` 13; old saves `ended: false`; a save that already lit all 5 gets the ending on load).
- **The sequence (8 s) is an overview frame, not the world zoomed out:** the explored map (minimap pixels scaled up),
  the dark easing `DARK_ALPHA` 0.93 → 0.5, Spire glows, the Nexus, lines drawn in turn over the first 80 %. Zooming the
  world to 0.16 cost 131 ms a frame (100 chunk blits, software canvas); the overview costs 1.7 ms. Reduced motion: a 1 s
  fade at normal zoom. The sim holds during the sequence and under the card; the HUD fades out; any key/tap only skips.
- Card: time to 5/5 (`endedAt`), cells mined + Glitches cleared (live stats), Drift / Surge / restored counts, Continue,
  New Cycle disabled ("Next update"). Reopened from the Matrix ("Ending summary"). The lifted dark stays (`darkAlpha`).
- Rejected: animating the zoom (sprite caches rebuild per zoom step); a separate "lifted" save field (`ended` implies it).

### D-091 — S-29 New Cycle as built; v1.0.0 (2026-11-24, session 61, Build; implements D-062, D-046)
- `game.cycle` + `game.records` (`{ best, cycles: { n: { time, drift, surge } } }`, written by `checkEnding`, seconds
  rounded) are saved (`SAVE_FORMAT` 14; old saves cycle 0, `{}`). New Cycle (card, or title once `ended`): a confirm,
  then `start(null, carry)` with a random seed; carries cycle + 1, records, mode. The Nexus inner ring + core glow take
  `NEXUS_HUES[cycle % 5]` (cyan, green, gold, violet, rose). Title from cycle 1: "Cycle n · best 12m 05s to light all five".
- Rejected: carrying Research or Radiance (D-062: nothing that plays twice; a cycle is a fresh run); a records screen
  (the card + title line hold the two numbers that matter until a play-test asks for more).
- **v1.0.0:** M1–M5 shipped (D-045, D-046). After 1.0, M6 → 1.1 (S-32, S-33 specced; Q-018 Relay reclaim open).

### D-092 — Design 62: Relays can be picked up (2026-11-24, session 62, Design; settles Q-018)
- Player feedback: a Relay is permanent and ≤ 3 per world, so the first one is stranded once you dig past it. The cap
  stays (D-056: Relays thin out the haul, not remove it); moving one is free: B / ✦ in its ring → back to stock (S-34).
- Why the ring, not the Relay's own cell: on a phone the ring is where you already stand to bank; a mistaken pickup
  costs one press to undo (place it again). Why no refund: it was never spent, only placed.
- Rejected: a craftable "Relay+" with a bigger ring / heal (the Nexus stays the only heal, D-056); raising the cap to 5
  (the 3 just move deeper with the player now); reclaiming Beacons too (5▲, 20 per world: nobody asked; revisit on feedback).
- Play-test (Playwright, v1.0.0): New World → relight all (dev) → card → New Cycle → cycle 1 green Nexus + title line
  read well at 1280×800 and 320×568 (viewed `ending-*`, `cycle-*`). S-32 / S-33 re-read against v1.0: unchanged.

### D-093 — S-34 as built: the place button also lifts (2026-11-24, session 63, Build; implements D-092)
- `tryPlace` checks `relayAt` first → `pickUpRelay` ('picked' / 'carrying'); `game.relays` spliced in place.
- **Touch:** ✦ was hidden with nothing carried, so a phone player could never pick up. In a Relay's ring the button now
  shows ⊕↑ (label "Pick up this Relay") whatever is carried; the hint names it: "Tap ⊕↑ to pick up this Relay"
  (desktop: "B: pick up this Relay"). Hint only with empty cargo (after banking), so it doesn't sit over every deposit.
- Rejected: a separate pick-up button (one more HUD box on 320 px phones, D-050); long-press ✦ (undiscoverable).

### D-094 — Audit 64: skip keys, records hygiene, the comment check (2026-11-24, session 64, Audit; amends D-090, D-091)
- Supersedes D-090's "New Cycle disabled" bullet (D-091 enabled it). During the sequence a key is preventDefault'ed
  (it only skips) and focus is dropped when it starts; on the card a repeat keydown does nothing. Records are cleaned
  on load and carry (`cleanRecords`); a world that ended before records existed gets its record on load. A Spire relights once.
- **A rule broken twice gets a check:** an inline `//` comment swallowed code 4 times (sessions 59–64, incl. the Wake
  ring); `tests/comments.cjs` flags comment text that ends like code. Rejected: a full linter (no build step, D-001).

Continued in `06-Decisions-13.md` (D-095 on).
