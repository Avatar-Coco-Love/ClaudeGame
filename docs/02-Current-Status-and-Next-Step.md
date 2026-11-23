# 02 — Current Status & Next Step

_Last updated: 2026-11-23_

**Session counter: 22** · **Version: v0.1.24** (session 22 was a Design; next is a Build)

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
- Depth rings (S-8, D-028): Hearth < 24 / Veil 24–48 / Deep ≥ 48 cells; rock + dense ×1 / ×1.4 / ×2 hp, own palette, toast once per session, lower hum.
- Lumen (S-10, D-033): gold ● at d ≥ 55 (~141 per world). Research tab (S-11, D-034) spends it: Scanner (10●) = F / ◎ ping, ore within 12 cells for 6 s, 20 s cooldown.
- Vaults (S-9, D-031): 6 sealed 7×7 rooms at d 50–72 (seed-only sites); the centre cache bursts 20◆ + 6▲. Old saves skip seen vaults (`vaultSkip`).
- Darkness/light overlay, explored-only minimap, an off-screen Nexus pointer, contextual hints, synthesized audio, and a mute toggle.
- Desktop (WASD + mouse) and touch (twin dynamic sticks). Phones (coarse pointer) get touch hints and no key badges from the start.
- Autosave to localStorage (seed + mined bitset + explored bitset + economy + floor pickups) every 10 s, on deposit, and on page hide. Saves carry a format number (now 6); old formats are upgraded on load (`src/save.js`).
- History lives in: `05` changelog (per version), `06` decisions (D-xxx), `03` open questions (Q-xxx), `09` log. The version is shown on the title screen.
- Gameplay randomness is seeded per draw from the world seed (`game.rng.*`, D-025): same seed + input = same run.
- Dev tools (S-7, D-027): `window.__lumen.dev.*` (resources, teleport 0/30/60 cells, god, mode, max all); panel via `?dev` or backtick.
- Build specs live in `07`: S-12 (ping shows vault caches, D-035), S-13 Wide beam, S-14 Pulse beam (D-036), S-15 perf check.
- M2 rules (D-022…D-024): depth = 3 rings inside the 160-cell world; new generation may re-type solid cells but changes layout only where a save hasn't looked. Tools: `tools/vaultfind.mjs` (vaults seen on a Lumen run, D-035), `tools/surgefarm.mjs` (parked Surge probe), `tools/parity.mjs` (same miner bot in both modes; Surge earns 0.81–0.90× Drift's Prisms, D-019), `tools/deeprun.mjs` (time to first Lumen; Beam 2 median 29 s, D-029). Economy basis: a world holds ~2750◆ / 1470▲; a full Core Matrix costs 2482◆ / 246▲.

## Verified (headless Chromium, desktop + Pixel 7 emulation)
- Mining down from the Nexus tunnels and collects Shards; deposit banks all cargo; Beam Power costs 8◆.
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
- Banked Shards show "Upgrade ready"; a death on a full floor keeps all cargo; floor pickups survive reload (audit, session 14).
- `dev.teleport(60)` lands 1936 px out in an open room; no panel without `?dev`; god mode is never saved (session 15).
- Deep rock takes 2× Hearth's beam time; seed 77's layout + types are unchanged by rings; Veil–Deep border reads at DSF 1 (session 16).
- A Deep Prism field reads at DSF 1; the Deep's ×2 rock adds only ~2 s to the first-Lumen trip, kept (D-029, session 17).
- 6 vaults on 40/40 seeds; a cache gives 20◆ + 6▲ and stays open; a format-3 save keeps its tunnels and skips seen vaults (session 18).
- 400 off-screen pickups cost no draws (frame 1093 → 19 ms headless); dev teleport keeps the bedrock border (audit, session 19).
- Lumen only at d ≥ 55 on 40 seeds; one cell banks 1●; a format-4 save loads with 0●; beads read at DSF 1 (session 20).
- Scanner ping marks exactly the ore within 12 cells, cools 20 s, survives reload; Research tab fits 320 px (session 21).
- By the 10● Scanner, a Lumen-hunting bot has seen 8 % of vaults; at 60● 35 % (`tools/vaultfind.mjs`, session 22).

## Health
- `node tests/smoke.cjs`: all passing (includes `tests/docs.cjs`: doc caps, version = changelog, inbox empty).

## Next step (one thing)
Next session (23) is a **Build**: S-12, the Scanner ping shows vault caches (spec in `07`).
