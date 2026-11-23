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
