# 02 — Current Status & Next Step

_Last updated: 2026-11-24_ · **Session counter: 65** · **Version: v1.0.5** (session 65: S-32 Spitter; v1.0 shipped in 61; rotation: 66 Build, 67 Design, 68 Build, 69 Audit).
**Scope (D-045, `01`):** v1.0 = M5 ships (Spires, ending, New Cycle); M6–M8 post-1.0, then finished. VERSION minor = milestones shipped (D-046).

## What's real right now
- Static web game (vanilla JS modules, no build), deployed from `main` via GitHub Pages. Share image `og.png` (D-044).
- 160×160-cell procedurally generated world (seeded). Cell types: rock, dense rock, crystal (→ Shards ◆), prism (→ Prisms ▲, farther out), Lumen (●), vault shell + cache, Spire shell / core / facet, and a bedrock border.
- Core movement: analog intent → target velocity → acceleration → axis-separated collision → realized velocity, plus corner assist so the core slides into 1-cell tunnels.
- Mining beam: grid raycast from the core's centre, damage over time, crack overlay, particles, and pickups that the Attractor pulls in.
- Cargo limit, auto-deposit inside the Nexus ring, and a Core Matrix with 6 upgrades (beam, range, thrust, cargo, attractor, integrity).
- Nexus Development v1: a **Nexus** tab in the Matrix sheet sells Radiance (5 levels, Prisms only, D-009): +96 px Nexus light per level and a wider explored disc.
- Modes: Drift (calm) and Surge (Glitches that chase you, contact damage, cargo scatters where you fall and can be recovered, the Nexus repels Glitches and heals you).
  A Glitch that gains no ground on the core for 6 s fades out and frees its slot (D-017); kills drop a Prism half the time (D-018).
  Spitters (S-32, D-096, `spitter.js`): 1 in 4 natural spawns at tier ≥ 2; hold 200 px, bolt every 2.2 s with a clear line (8 dmg, rock stops it, beam pops it).
- Settings (S-3): volume, mute, shake, reduced motion in `lumencore.settings.v1`, apart from the world save (D-016, D-020).
- Feel (S-4): deposit arpeggio, upgrade ring on the core + pip flash, 35 ms hitstop on yield-cell breaks (D-048 note), beam start sweep (D-021).
- Depth rings (S-8, D-028): Hearth < 24 / Veil 24–48 / Deep ≥ 48 cells; rock + dense ×1 / ×1.4 / ×2 hp, own palette, toast once per session, lower hum.
- Lumen (S-10, D-033): gold ● at d ≥ 55 (~141 per world). Research tab (S-11, D-034) spends it: Scanner (10●) = F / ◎ ping, ore + unopened vault caches (S-12, D-040) within 12 cells for 6 s, 20 s cooldown.
  Beam modes (`src/beam.js`, Q / ⟂ cycles): Wide (25●, D-041) 3 rays 0.45× each, 0.75× reach; Pulse (40●, D-052) charge → burst, pierce 3, 1.5× reach; a full charge waits for a target in reach (S-21, D-059).
- Crafting (S-16, D-043, D-060): Craft tab, Beacon 5▲ (carry 3); B / ✦ places one on the core's cell (open, outside the ring,
  ≥ 4 cells apart, ≤ 20): permanent 140 px light (`game.beacons` in `R.lightSets`, `light.js`, D-067), minimap dot, floor glow (S-25, D-061). Code `craft.js`.
  Relays (S-22, D-076): 40◆ + 12▲, carry 1, ≤ 3, d ≥ 24, 16 cells from Relays / vault centres / Spire footprints; cargo
  within 64 px banks like the Nexus (`game.atDeposit()`), no heal; B / ⊕↑ in a ring picks it up (S-34, D-093); ⊕ glyph, 100 px light, minimap ring. B places `craft.last`.
- Vaults (S-9, D-031): 6 sealed 7×7 rooms at d 50–72 (seed-only sites); the centre cache bursts 20◆ + 6▲. Old saves skip seen vaults (`vaultSkip`).
- Spires (S-19, D-049, D-068, `spire.js`): 5 dormant 9×9 sites at d 64–74, one per 72° sector, saved as `game.spires`
  (`{x, y, seen, fed, mask, lit, mode, keep}`); shell cuttable, core + facets `UNBREAKABLE`. Found (S-27, D-072): toast + tone, minimap hexagon, breath, stats line.
  Feed (S-20, D-078): in the 7×7 interior ▲ flows in 8/s, cargo then bank (D-070), arc fed / 80; at 80 `mask` = S-28's
  start pattern (`startMask`, `FACET_RING`; lit facets glow) + "Spire primed"; a broken Spire (D-069) relights instead. Wake lanes D-071.
  Facets (S-28, D-080, D-083): 0.35 s of the aim ray (or one Pulse burst) flips a primed facet + neighbours; all 8 →
  relit: 260 px light (`game.spireLights` = `R.lightSets[2]`), chime, filled hexagon, `mode` saved; primed hint. Drift only (S-23).
  Wake (S-23, D-086, `wake.js`): Surge, enter primed → 4 lanes cleared, Glitches go for the core (charge 100, −10), 40 s → relit 'surge'; fail → step out/in. S-31: tier −1, no despawn, orange clock (D-088); camera frames the core (D-089).
  Ending (S-24, D-090, `ending.js`): 5/5 relit → 8 s map overview + lines (skippable) → card; `ended` saved, dark 0.93 → 0.5.
  New Cycle (S-29, D-091): card / title → fresh seed, `cycle` + 1, `records` (best, per cycle) kept, Nexus hue `NEXUS_HUES`.
  One toggle per aim for every beam (D-084: Pulse `beam.facetLatch`; a Glitch on the ray pauses the dwell latch).
- Darkness/light overlay, explored-only minimap, Nexus pointer (slides clear of HUD boxes, D-074), toasts (queued, D-073; phones: below the core / under the bank panel, tap answers first, D-084), hints, synthesized audio (beam hum = soft bed, B-016/D-038, measured
  −42 → −57 dBFS by `tests/audio.cjs`, which also bounds every one-shot and the deposit ticks (D-039); recorded CC0 audio waits on the owner's pack, D-037, M8), and a mute toggle.
- Desktop (WASD + mouse), touch (twin sticks; a lifted stick adopts another canvas finger). Phones: touch hints, no key badges, every button ≥ 44 px, landscape ◎⟂♪≡ top row (S-17, D-050, D-058), glyph-only ◎ ⟂ ≤ 700 px wide (D-064).
- Autosave to localStorage (seed + mined + explored bitsets + economy + floor pickups + beam mode + beacons + relays + spires) every 10 s, on deposit, and on page hide. Saves carry a format number (now 14); old formats are upgraded on load (`src/save.js`); malformed fields load empty (B-037); tests never pin the number (`saveformat.cjs`).
- History: `05` changelog, `06` decisions (D-xxx), `03` questions (Q-xxx), `09` log (tail: `09-…-8`).
- Gameplay randomness is seeded per draw from the world seed (`game.rng.*`, D-025): same seed + input = same run.
- Dev tools (S-7, D-027): `window.__lumen.dev.*` (resources, teleport 0/30/60 cells, god, mode, max all); panel via `?dev` or backtick.
- Specs (`07-…-4`, 1 PR each, D-063): M6 S-32, S-33 (D-087). Code: Glitches `glitch.js`, HUD `hud.js`, grid `body.js` (D-053), light `light.js`, chunk paint `terrain.js`; no file > 600 lines (`docs.cjs`).
- M2 rules (D-022…D-024): depth = 3 rings in the 160-cell world; new generation changes layout only where a save hasn't looked. Bots/probes in `tools/` (wakeprobe D-087; surgebot S-30/D-085: A*, fights, `--route=mine|rim|hug|spire`; spireloop + facetprobe D-079/D-080, spirerun D-070, relayrun D-076, vaultfind, surgefarm, parity D-019, deeprun D-029, standoff D-054, perf D-057; each file's header says how). Economy: a world holds ~2750◆ / 1470▲; a full Core Matrix costs 2482◆ / 246▲.

## Verified
- Per-session checks (sessions 10–48) moved word for word to `09-…-5` (audit 49), now `archive/2026-11-24-09-sessions-49-53.md` (audit 59); each lives on in the smoke suite.

## Health
- `node tests/smoke.cjs`: all passing (includes `tests/docs.cjs`: doc caps, version = changelog, inbox empty) + `tests/audio.cjs`.

## Next step (one thing)
Session 66 (Build): **S-33 Weather** (`07-Build-Specs-4.md`; the last M6 spec, D-087); measure haul with
`surgebot --route=mine` (and `deep`, D-096). Audit 64 Debt in `04-Roadmap-2.md`. Read only this file to start.
