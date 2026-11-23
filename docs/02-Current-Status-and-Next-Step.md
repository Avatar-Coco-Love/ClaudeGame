# 02 — Current Status & Next Step

_Last updated: 2026-11-23_

**Session counter: 4** · **Version: v0.1.6** (session 4 was the first Audit; next is a Build)

## What's real right now
- Static web game (vanilla JS modules, no build). Deployed from `main` through GitHub Pages.
- 160×160-cell procedurally generated world (seeded). Cell types: rock, dense rock, crystal (→ Shards ◆), prism (→ Prisms ▲, found farther out), and a bedrock border.
- Core movement: analog intent → target velocity → acceleration → axis-separated collision → realized velocity, plus corner assist so the core slides into 1-cell tunnels.
- Mining beam: grid raycast from the core's centre, damage over time, crack overlay, particles, and pickups that the Attractor pulls in.
- Cargo limit, auto-deposit inside the Nexus ring, and a Core Matrix with 6 upgrades (beam, range, thrust, cargo, attractor, integrity).
- Modes: Drift (calm) and Surge (Glitches that chase you, contact damage, cargo scatters where you fall and can be recovered, the Nexus repels Glitches and heals you).
- Darkness/light overlay, explored-only minimap, an off-screen Nexus pointer, contextual hints, synthesized audio, and a mute toggle.
- Desktop (WASD + mouse) and touch (twin dynamic sticks).
- Autosave to localStorage (seed + mined bitset + explored bitset + economy) every 10 s, on deposit, and on page hide. Saves carry a format number; old formats are upgraded on load (`src/save.js`).
- History lives in: `05` changelog (per version), `06` decisions (D-xxx), `03` open questions (Q-xxx), `09` log. The version is shown on the title screen.
- Build-ready specs live in `07` (S-1…S-5). Economy basis: a world holds ~2750◆ / 1470▲; a full Core Matrix costs 2482◆ / 246▲.

## Verified (headless Chromium, desktop + Pixel 7 emulation)
- Mining down from the Nexus tunnels continuously and collects Shards.
- Deposit moves all cargo into the bank, and buying Beam Power deducts 8◆.
- Surge spawns Glitches away from the Nexus, and the beam kills them.
- Reloading restores the mode, upgrades, bank, and mined terrain.
- Touch sticks move the core and mine. No page errors.
- Title-screen hotkeys can't open the Core Matrix; New World asks before replacing an unreadable save (audit, session 4).

## Health
- `node tests/smoke.cjs`: all passing (includes `tests/docs.cjs`: doc caps, version = changelog, inbox empty).

## Next step (one thing)
Next session (5) is a **Build**: implement **S-1 (Nexus Radiance)** from `07` (Prism-only sink, D-009). Smoke must cover buying a level and the save round-trip.
