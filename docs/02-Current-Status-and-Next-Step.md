# 02 — Current Status & Next Step

_Last updated: 2026-11-23_

**Session counter: 13** · **Version: v0.1.15** (session 13 was a Build: S-5; next is an Audit)

## What's real right now
- Static web game (vanilla JS modules, no build). Deployed from `main` through GitHub Pages.
- 160×160-cell procedurally generated world (seeded). Cell types: rock, dense rock, crystal (→ Shards ◆), prism (→ Prisms ▲, found farther out), and a bedrock border.
- Core movement: analog intent → target velocity → acceleration → axis-separated collision → realized velocity, plus corner assist so the core slides into 1-cell tunnels.
- Mining beam: grid raycast from the core's centre, damage over time, crack overlay, particles, and pickups that the Attractor pulls in.
- Cargo limit, auto-deposit inside the Nexus ring, and a Core Matrix with 6 upgrades (beam, range, thrust, cargo, attractor, integrity).
- Nexus Development v1: a **Nexus** tab in the Matrix sheet sells Radiance (5 levels, Prisms only, D-009): +96 px Nexus light per level and a wider explored disc.
- Modes: Drift (calm) and Surge (Glitches that chase you, contact damage, cargo scatters where you fall and can be recovered, the Nexus repels Glitches and heals you).
  A Glitch that gains no ground on the core for 6 s fades out and frees its slot (D-017); kills drop a Prism half the time (D-018).
- Settings on the title (S-3): volume, mute, screen shake, reduced motion; stored in `lumencore.settings.v1`, apart from the world save (D-016, D-020).
- Feel (S-4): deposit arpeggio, upgrade ring on the core + pip flash, 35 ms hitstop on crystal/prism breaks, beam start sweep (D-021).
- Darkness/light overlay, explored-only minimap, an off-screen Nexus pointer, contextual hints, synthesized audio, and a mute toggle.
- Desktop (WASD + mouse) and touch (twin dynamic sticks). Phones (coarse pointer) get touch hints and no key badges from the start.
- Autosave to localStorage (seed + mined bitset + explored bitset + economy) every 10 s, on deposit, and on page hide. Saves carry a format number (now 2); old formats are upgraded on load (`src/save.js`).
- History lives in: `05` changelog (per version), `06` decisions (D-xxx), `03` open questions (Q-xxx), `09` log. The version is shown on the title screen.
- Gameplay randomness is seeded per draw from the world seed (`game.rng.*`, D-025): same seed + input = same run.
- Build-ready specs live in `07`, in build order: S-7, S-8 (depth rings), S-9 (vaults), S-10 (Lumen, right before Research v1).
- M2 rules (D-022…D-024): depth = 3 rings inside the 160-cell world; new generation may re-type solid cells but changes layout only where a save hasn't looked. Tools: `tools/surgefarm.mjs` (parked Surge probe), `tools/parity.mjs` (same miner bot in both modes; Surge earns 0.81–0.90× Drift's Prisms, D-019). Economy basis: a world holds ~2750◆ / 1470▲; a full Core Matrix costs 2482◆ / 246▲.

## Verified (headless Chromium, desktop + Pixel 7 emulation)
- Mining down from the Nexus tunnels continuously and collects Shards.
- Deposit moves all cargo into the bank, and buying Beam Power deducts 8◆.
- Surge spawns Glitches away from the Nexus, and the beam kills them.
- Reloading restores the mode, upgrades, bank, and mined terrain.
- Touch sticks move the core and mine. No page errors.
- Title-screen hotkeys can't open the Core Matrix; New World asks before replacing an unreadable save (audit, session 4).
- Radiance spends only Prisms, grows the light and minimap, survives reload; Matrix tabs fit at 320 px (session 5).
- Phone shows the thumb hint before the first touch; nothing in title/HUD/Matrix overflows at 320 px (session 6).
- Dying among several Glitches near the Nexus no longer freezes the game (B-007, session 7).
- A Glitch boxed in by dense rock fades within 8 s without kill credit; one with a clear line keeps chasing (session 8).
- The mining check is timed by game time (B-006); leaving the page drops held touch sticks (B-009) (audit, session 9).
- Shake off stays 0 through a Glitch kill and a hit; volume 0 and a legacy mute survive reload; Settings fits 320×568 (session 10).
- Hitstop freezes the sim only on crystal/prism, rate-limited; reduced motion drops hitstop + ring; no hint under the Matrix (session 11).
- Real-time play: 32 crystal breaks → 32 hitstops in 60 s, none on rock; a room 62 cells out looks like the start (session 12).
- Two Surge runs on one seed with one script give identical pickups and Glitch spawns (session 13).

## Health
- `node tests/smoke.cjs`: all passing (includes `tests/docs.cjs`: doc caps, version = changelog, inbox empty).

## Next step (one thing)
Next session (14) is an **Audit**: parallel health check; fix top issues (B-010 hint included), archive `09`.
