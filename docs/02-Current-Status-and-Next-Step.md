# 02 — Current Status & Next Step

_Last updated: 2026-11-24_ · **Session counter: 42** · **Version: v0.2.46** (session 42: design; rotation: 43 Build, 44 Audit, 45 Build).
**Scope (D-045, `01`):** v1.0 = M5 ships (Spires, ending, New Cycle); M6–M8 post-1.0, then finished. VERSION minor = milestones shipped (D-046).

## What's real right now
- Static web game (vanilla JS modules, no build), deployed from `main` via GitHub Pages. Share image `og.png` (D-044).
- 160×160-cell procedurally generated world (seeded). Cell types: rock, dense rock, crystal (→ Shards ◆), prism (→ Prisms ▲, found farther out), and a bedrock border.
- Core movement: analog intent → target velocity → acceleration → axis-separated collision → realized velocity, plus corner assist so the core slides into 1-cell tunnels.
- Mining beam: grid raycast from the core's centre, damage over time, crack overlay, particles, and pickups that the Attractor pulls in.
- Cargo limit, auto-deposit inside the Nexus ring, and a Core Matrix with 6 upgrades (beam, range, thrust, cargo, attractor, integrity).
- Nexus Development v1: a **Nexus** tab in the Matrix sheet sells Radiance (5 levels, Prisms only, D-009): +96 px Nexus light per level and a wider explored disc.
- Modes: Drift (calm) and Surge (Glitches that chase you, contact damage, cargo scatters where you fall and can be recovered, the Nexus repels Glitches and heals you).
  A Glitch that gains no ground on the core for 6 s fades out and frees its slot (D-017); kills drop a Prism half the time (D-018).
- Settings (S-3): volume, mute, shake, reduced motion in `lumencore.settings.v1`, apart from the world save (D-016, D-020).
- Feel (S-4): deposit arpeggio, upgrade ring on the core + pip flash, 35 ms hitstop on yield-cell breaks (D-048 note), beam start sweep (D-021).
- Depth rings (S-8, D-028): Hearth < 24 / Veil 24–48 / Deep ≥ 48 cells; rock + dense ×1 / ×1.4 / ×2 hp, own palette, toast once per session, lower hum.
- Lumen (S-10, D-033): gold ● at d ≥ 55 (~141 per world). Research tab (S-11, D-034) spends it: Scanner (10●) = F / ◎ ping, ore + unopened vault caches (S-12, D-040) within 12 cells for 6 s, 20 s cooldown.
  Beam modes (`src/beam.js`, Q / ⟂ cycles): Wide (25●, D-041) 3 rays 0.45× each, 0.75× reach; Pulse (40●, D-052) charge → burst, pierce 3, 1.5× reach; a full charge waits for a target in reach (S-21, D-059).
- Crafting (S-16, D-043, D-060): Craft tab, Beacon 5▲ (carry 3); B / ✦ places one on the core's cell (open, outside the ring,
  ≥ 4 cells apart, ≤ 20): permanent 140 px light (`R.extraLights` = `game.beacons`), minimap dot. Code `craft.js`.
- Vaults (S-9, D-031): 6 sealed 7×7 rooms at d 50–72 (seed-only sites); the centre cache bursts 20◆ + 6▲. Old saves skip seen vaults (`vaultSkip`).
- Darkness/light overlay, explored-only minimap, Nexus pointer, hints, synthesized audio (beam hum = soft bed, B-016/D-038, measured
  −42 → −57 dBFS by `tests/audio.cjs`, which also bounds every one-shot and the deposit ticks (D-039); recorded CC0 audio waits on the owner's pack, D-037, M8), and a mute toggle.
- Desktop (WASD + mouse), touch (twin sticks; a lifted stick adopts another canvas finger). Phones: touch hints, no key badges, every button ≥ 44 px, landscape ◎⟂♪≡ top row (S-17, D-050, D-058).
- Autosave to localStorage (seed + mined bitset + explored bitset + economy + floor pickups + beam mode) every 10 s, on deposit, and on page hide. Saves carry a format number (now 9); old formats are upgraded on load (`src/save.js`).
- History: `05` changelog, `06` decisions (D-xxx), `03` questions (Q-xxx), `09` log (tail: `09-…-3`).
- Gameplay randomness is seeded per draw from the world seed (`game.rng.*`, D-025): same seed + input = same run.
- Dev tools (S-7, D-027): `window.__lumen.dev.*` (resources, teleport 0/30/60 cells, god, mode, max all); panel via `?dev` or backtick.
- Specs (`07-…-2/3/4`, 1 PR each, D-063): S-25 glow+B-034, S-26 `light.js`, S-19/S-27 Spires, S-22 Relays, S-20/S-28 relight, bot, S-23, S-24, S-29 (D-062). Code: Glitches `glitch.js`, HUD `hud.js`, grid `body.js` (D-053); no file > 600 lines (`docs.cjs`).
- M2 rules (D-022…D-024): depth = 3 rings in the 160-cell world; new generation changes layout only where a save hasn't looked. Bots/probes in `tools/` (vaultfind, surgefarm, parity D-019, deeprun D-029, standoff D-054, perf D-057; each file's header says how). Economy: a world holds ~2750◆ / 1470▲; a full Core Matrix costs 2482◆ / 246▲.

## Verified (headless Chromium, desktop + Pixel 7 emulation)
- Mining from the Nexus collects Shards; deposit banks all cargo; Beam Power costs 8◆. Surge Glitches spawn away, die to the beam.
- Reloading restores the mode, upgrades, bank, and mined terrain. Touch sticks move the core and mine. No page errors.
- Dying among several Glitches near the Nexus no longer freezes the game (B-007, session 7).
- A Glitch boxed in by dense rock fades within 8 s without kill credit; one with a clear line keeps chasing (session 8).
- The mining check is timed by game time (B-006); leaving the page drops held touch sticks (B-009) (audit, session 9).
- Shake off stays 0; volume 0 and a legacy mute survive reload; Settings fits 320×568 (session 10).
- Hitstop only on yield cells, rate-limited (32 breaks → 32 in 60 s); reduced motion drops it + ring (sessions 11–12).
- Two Surge runs on one seed with one script give identical pickups and Glitch spawns (session 13).
- Banked Shards show "Upgrade ready"; a death on a full floor keeps all cargo; floor pickups survive reload (audit, session 14).
- `dev.teleport(60)` lands 1936 px out in an open room; no panel without `?dev`; god mode is never saved (session 15).
- Deep rock takes 2× Hearth's beam time; seed 77's layout + types are unchanged by rings; Veil–Deep border reads at DSF 1 (session 16).
- A Deep Prism field reads at DSF 1; the Deep's ×2 rock adds only ~2 s to the first-Lumen trip, kept (D-029, session 17).
- 6 vaults on 40/40 seeds; a cache gives 20◆ + 6▲ and stays open; a format-3 save keeps its tunnels and skips seen vaults (session 18).
- 400 off-screen pickups cost no draws; teleport keeps the border (audit 19). Lumen only at d ≥ 55; format-4 saves load with 0● (20).
- Scanner ping marks exactly the ore within 12 cells, cools 20 s, survives reload; Research tab fits 320 px (session 21);
  also an unopened vault cache 10 cells away, with one soft tone, but not at 14 cells (session 25).
  Wide cracks 3 wall cells at 0.45× Focus each, two rays on one cell count once; Q is dropped under the Matrix (session 26).
- Audit 29 (`audit29.cjs`); touch (33, `touch.cjs`); glow sprites 540 → 33 ms (34, `audit34.cjs`); Pulse 2 / 3 cells per burst (35, `pulse.cjs`); S-18 split: same Surge run + byte-same screenshot (36); a full Pulse fires out of reach (37); draw cost as counts + ratios (38, `drawcost.cjs`);
  blur/hidden drop a Pulse charge, HUD fingers not adopted, sheets ≥ 44 px at 3 phone sizes, Glitch sprites (audit 39, `audit39.cjs`); full Pulse holds at open floor, one-shots tier 3 at Beam 2 (40); beacons: rules, light pixel, reload, format 8, phones ×3 (41, `craft.cjs`).
- Every sound rendered offline: a full-hold deposit is loud 0.35 s (was 4.4 s); no square-wave buzz (audit 24).

## Health
- `node tests/smoke.cjs`: all passing (includes `tests/docs.cjs`: doc caps, version = changelog, inbox empty) + `tests/audio.cjs`.

## Next step (one thing)
Session 43 (Build): S-25 in `07-Build-Specs-2.md`: beacon floor glow (D-061) + B-034 short-landscape row; smoke checks fail first.
