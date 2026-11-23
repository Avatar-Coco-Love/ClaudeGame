# 02 — Current Status & Next Step

_Last updated: 2026-11-23_

**Session counter: 1** (next session = 2 → **Design** session per CLAUDE.md rotation)

## What's real right now
- Static web game (vanilla JS modules, no build). Deployed from `main` through GitHub Pages.
- 160×160-cell procedurally generated world (seeded). Cell types: rock, dense rock, crystal (→ Shards ◆), prism (→ Prisms ▲, found farther out), and a bedrock border.
- Core movement: analog intent → target velocity → acceleration → axis-separated collision → realized velocity, plus corner assist so the core slides into 1-cell tunnels.
- Mining beam: grid raycast from the core's centre, damage over time, crack overlay, particles, and pickups that the Attractor pulls in.
- Cargo limit, auto-deposit inside the Nexus ring, and a Core Matrix with 6 upgrades (beam, range, thrust, cargo, attractor, integrity).
- Modes: Drift (calm) and Surge (Glitches that chase you, contact damage, cargo scatters where you fall and can be recovered, the Nexus repels Glitches and heals you).
- Darkness/light overlay, explored-only minimap, an off-screen Nexus pointer, contextual hints, synthesized audio, and a mute toggle.
- Desktop (WASD + mouse) and touch (twin dynamic sticks).
- Autosave to localStorage (seed + mined bitset + explored bitset + economy) every 10 s, on deposit, and on page hide.

## Verified (headless Chromium, desktop + Pixel 7 emulation)
- Mining down from the Nexus tunnels continuously and collects Shards.
- Deposit moves all cargo into the bank, and buying Beam Power deducts 8◆.
- Surge spawns Glitches away from the Nexus, and the beam kills them.
- Reloading restores the mode, upgrades, bank, and mined terrain.
- Touch sticks move the core and mine. No page errors.

## Health
- `node tests/smoke.cjs`: 16/16 passing.

## Next step (one thing)
Next session is a **Design** session: play-test, then spec M1's remaining items in `04` in enough detail to build directly.
After that, build **Nexus Development v1:** spend Prisms to raise the Nexus light radius. Prisms currently have only light use
(upgrade costs at level 2 and up), so they need a reason to exist.
Done = a "Nexus" tab in the Core Matrix with a single *Radiance* upgrade, and a visibly bigger lit area around the hub.
