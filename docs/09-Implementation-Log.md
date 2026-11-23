# 09 — Implementation Log

Older entries: v0.1 to session 2 in `archive/2026-11-23-09-sessions-0-2.md`, session 3 in `archive/2026-11-23-09-session-3.md`, sessions 4–7 in `archive/2026-11-23-09-sessions-4-7.md`.

## 2026-11-23 — Session 8 (v0.1.10): Build — S-6 Glitch give-up
- **Built:** every Glitch keeps `best`/`stall`; no 24 px gain on its best distance to the core for 6 s → `fade` 0.6 s (drifts to a stop, no contact, no loot, skipped by the beam), then removed. A contact hit resets the stall. Render fades alpha and shrinks to 40 %. Constants in `config.js`.
- **Spec was wrong, measured:** alert-only (as specced) left `surgefarm 1000 0 300` at 0.36 kills/min, 28/29 stuck. A probe showed the slot-holders were *unalerted* wanderers spawned 560–740 px out, drifting in rock. Applying the rule to all Glitches → D-017.
- **surgefarm before → after (10 seeds × 300 s):** 1000 px lvl0 0.38 → 4.30 kills/min (deaths 0.02 → 0.80); lvl3 0.42 → 4.14; 1700 px lvl0 1.10 → 4.74; lvl6 0.78 → 4.10. Stuck at end 30–50 → 4–9. Over 3/min, so the Q-007 fallback shipped: Prism drop 50 % (D-018).
- **Tests:** 2 smoke checks (37 total), stepped in-page by game time (480 × 1/60 s). Boxed one failed on the old code (still present). First run of it failed on the new code too: the open Glitch's hits knocked the core toward the box, which counted as progress; the core is now invulnerable for the check.
- **Screenshot (800×500, DSF 1):** full, mid-fade and almost-gone Glitches side by side read as one shape shrinking and dimming; no new effect.
- **Docs:** `09` session 3 archived word for word. `06` hit 8 KB: D-015 (superseded) archived word for word to `docs/archive/decisions-1.md`, new decisions go in `06-Decisions-2.md`; `tests/docs.cjs` checks ID uniqueness across both.
- **Watch:** a core that outruns a Glitch also makes it give up (it lost the trail). Fine for now; Glitches still can't path (logged in `04` Debt).

## 2026-11-23 — Session 9 (v0.1.11): Audit
- **How:** no subagent tool, so correctness, perf, mobile, code health and docs drift were done in-line; each finding reproduced first.
- **Parity (asked: D-018 vs D-002):** new `tools/parity.mjs`, same bot in both modes, 10 seeds × 600 s, lvl 0/3/6. Surge banks 0.81–0.90× Drift's Prisms (combat eats mining time; drops pay ~2▲/min back), ◆ 0.94–1.10× when hunting Crystals. Verdict: no Surge edge, drop stays → D-019.
- **B-006 → fixed:** root cause found: `frame()` clamps dt to 0.05 s, so slow frames lose game time. At 6× CPU throttle the old 5 s wall wait gave 1.2–1.3 s of play and mined 1–2 cells (fails, 3/3); waiting for 5 s of `stats.time` mined 8 (3/3, 16–18 s wall). Bar unchanged (≥ 4).
- **B-009 → fixed (was "to verify" in Debt):** `blur` cleared keys and mouse, not touch sticks; a held stick kept steering after the page hid. `input.release()` on blur and `visibilitychange` hidden. New smoke check (38 total) failed on the old code (stick held, move 0.89).
- **Perf:** nothing new; the culling item stays in Debt until the throttled perf check exists. **Code health:** no dead code found in touched files; largest file `render.js` 457 lines.
- **D-check:** D-001…D-018 match the code (spot-read save.js, input.js, main.js tab memory, config costs). `09` sessions 4–7 archived word for word. No screenshot: no visual change.

## 2026-11-23 — Session 10 (v0.1.12): Build — S-3 Settings panel
- **Built:** `src/settings.js` (load/clean/save `lumencore.settings.v1`, legacy `lumencore.muted` migrated then removed), a Settings sheet over the title (volume slider, mute, shake, reduced motion; ✕, Escape or backdrop closes), `audio.setVolume()`, `game.addShake()` gate (D-020). Mute button and M now write the settings object.
- **Tests:** 5 new smoke checks (43 total): legacy mute → muted; shake off → `game.shake` max 0 over a stepped Glitch kill + a hit; volume 0 + shake off survive reload; settings never in the world save; sheet fits 320×568 with no scroll and every control ≥ 40 px. Overflow check now covers `#settings`. Shake check failed on the old behaviour (gate disabled: max shake 8).
- **Screenshots (1280×800 and 320×568, DSF 1):** Settings button reads as secondary under New World; the sheet fits the narrow phone with room to spare; switch states clear (cyan = On).
- **Watch:** the M badge hides on coarse pointers via a media query, since `body.touch` is only set once a game starts.

## 2026-11-23 — Session 11 (v0.1.13): Build — S-4 Feel pass
- **Built:** `audio.depositDone(kinds)` (kinds+1 rising notes, max 3) when the hold empties; `audio.beamStart()` on the beam's off→on edge; `game.coreRing` ring on the core after a Core Matrix buy + `.flash` pip row; `game.hitstop` (35 ms, crystal/prism only, ≥ 150 ms apart) honoured by `main.js`; `game.motionOn()` gate. B-008 fixed: hint hidden while the Matrix is open (D-021). Demo world uses a silent audio Proxy.
- **Tests:** 6 new smoke checks (49 total): B-008 hint, ring + pip flash, hitstop rock/crystal/rate-limit, arpeggio `[2,1]` + beam sweep ×2, reduced motion → no hitstop/ring, loop holds `stats.time` during hitstop. Five failed on the old code (stash run, 44/49); the reduced-motion one is a guard.
- **Screenshot (900×600, DSF 1):** ring reads clearly around the core inside the Nexus; Matrix open shows no hint behind it.
- **Watch:** can't listen in-session; arpeggio levels (vol 0.13) were set by ear-free reasoning next to `upgrade()` (0.14). Revisit if a play-test log says the deposit is loud.

## 2026-11-23 — Session 12 (v0.1.14): Design — S-4 play-test, M2 specs
- **Play-test (1280×800, DSF 1, in-page greedy crystal bot, 60 s real time, Drift):** 32 crystal breaks → 32 hitstops (~1.1 s frozen
  in total, never on the 21 rock breaks), 1 beam sweep (beam held), bank 46◆, no page errors. Reads as a light tick, not a stutter.
  The arpeggio never fired: the bot left the ring as soon as cargo had room. Logged as "Missed chime (watch)". B-010 found: the
  "Bring shards home" hint stays up with 46◆ banked (`main.js` hint checks bank + cargo, not cargo alone).
- **Screenshot:** a room carved 62 cells out looks exactly like the start (same blue rock): distance means nothing on screen yet.
- **Measured (40 seeds, scratch scripts, not committed):** cells per distance band (header of `07`); a new Lumen noise at cut 0.80 on
  ROCK/DENSE at d ≥ 55 gives ~141 cells/world (0.74 → 381, 0.78 → 203); 6 vaults (7×7, d 50–72, ≥ 20 apart) place on 40/40 seeds.
- **Decided:** D-022 (rings in the fixed world, settles Q-002), D-023 (generation changes keep a save's seen layout; `vaultSkip`),
  D-024 (Lumen ships next to Research v1). Specs S-8 rings, S-9 vaults, S-10 Lumen in `07`. New Q-008 (Deep toughness).

