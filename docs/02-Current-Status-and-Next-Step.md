# 02 — Current Status & Next Step

_Last updated: 2026-11-24_ · **Session counter: 83** · **Version: v1.4.23** (session 83: Build; rotation: 84 Audit, 85 Build, 86 Build, 87 Design, 88 Build).
**Scope (D-045, D-108, `01`):** v1.0 = M5 ships (Spires, ending, New Cycle); M6–M9 post-1.0 (M9 = Echo ally), all ✅ as of v1.4.23 (M8 last). VERSION minor = milestones shipped (D-046), patch = PRs since 1.0.0 (D-105).

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
- Weather (S-33, D-097, `weather.js`): every 300–420 s of `stats.time` (seeded, unsaved), 40 s: Surge storm (spawns ×0.75, cap +2, violet dark),
  Drift aurora (Shard / Prism breaks in the core's light +1 at 40 %, teal dark, shimmer). Never in a Wake / the ending. Play-tested D-098 (Q-019: no).
- Anomalies (S-35/36, D-099, D-101, `anomaly.js`): 16 seed-only sites (3/5/8 by ring) in rock, kind 1/3 each: Overclock
  (beam ×1.5), Lodestone (reach ×2, pull ×1.5), Ballast (cargo ×1.5) via `stat()`; kinds stack; end when a deposit banks
  all cargo; recharge 300 s. Saved `anomalies` + `buffs` (format 15). Chip `#buffs`. Bot: `surgebot --anomaly`.
  S-37 (D-102): seen sites on the minimap (hollow while recharging), Scanner marks charged ones, end tone, hint line.
- PWA (S-38, D-104): `manifest.webmanifest` + `icons/`, network-first `sw.js?v=VERSION` (cache `lumen-<VERSION>`, warmed
  from the first visit's loaded files), registered by `src/pwa.js` (not on `file:`/`?dev`); offline navigations ignore the query (D-105). Test `pwa.cjs`.
- Music (S-44, D-115, `music.js`): synthesized pad by ring + Drift bell / Surge pulse (equal RMS), Wake = root + pulse ×1.5,
  Ending fades out; own PRNG (seed + 'music'); Music slider (`settings.music`, default 50). `tests/music.cjs` (11 checks).
- Settings (S-3): volume, mute, shake, reduced motion in `lumencore.settings.v1`, apart from the world save (D-016, D-020).
- Feel (S-4): deposit arpeggio, upgrade ring on the core + pip flash, 35 ms hitstop on yield-cell breaks (D-048 note), beam start sweep (D-021).
- Depth rings (S-8, D-028): Hearth < 24 / Veil 24–48 / Deep ≥ 48 cells; rock + dense ×1 / ×1.4 / ×2 hp, own palette, toast once per session, lower hum.
- Lumen ● (S-10) buys Research (S-11): Scanner ping (S-12), beam modes Wide / Pulse (S-13, S-14, S-21). Detail: `08`.
- Echo (S-42, D-112, `echo.js`, Research 30 ●): follows down a BFS field, blinks back when stranded, Gathers exposed ore
  at 0.5× beam dps; never saved beyond `research.echo`. `tests/echo.cjs`, bot `tools/echobot.mjs` (strands 0, ◆/min ×1.4 mid).
  Orders (S-43, D-113): R / ◇ cycles Gather ↔ Guard (0.8 hp / 0.8 s at the foe nearest the core ≤ 140 px); chip in the
  `#buffs` row; saved `echoOrder` (format 16). `tests/echoorder.cjs`; `ECHO=guard tools/wakeprobe.mjs` (no Wake cut).
- Crafting (S-16): Beacons (light, S-25 glow) and Relays (remote deposit, S-22; reclaim S-34), `craft.js`. Detail: `08`.
- Vaults (S-9), Spires (S-19/S-27/S-20/S-28: found, fed, facet puzzle), Wake (S-23/S-31), Ending (S-24), New Cycle (S-29). Detail: `08`.
- Darkness/light overlay, minimap, Nexus pointer, queued toasts, synthesized audio held to `tests/audio.cjs` ceilings. Detail: `08`.
- Graphics (S-41, D-109, `quality.js`): Settings → Auto / High / Low; Auto samples the frame gap (p90 over 3 s): > 24 ms
  steps down, < 18 ms for 10 s up. L1 DPR 1; L2 + half the particles drawn, no pickup glow, unsmoothed light. Sim unchanged.
  D-110: a step down that doesn't beat 0.85 × its p90 is undone and Auto stops stepping down (30 Hz caps); DPR ≤ 1 skips L1.
- Keys (S-39, D-106, `keys.js`/`keysui.js`): read by position (`e.code`, AZERTY-safe); Settings → Keys rebinds ten
  actions (clash swaps, Esc cancels, Reset) into `settings.keys`; arrows/Esc/Enter/Tab fixed; labels follow the bindings.
- Text (S-40, D-107): every font size × `--ts` (Settings → Large text = 1.2); 12 px floor in play (title footer 11).
  `tests/colours.cjs`: must-tell-apart pairs ΔE ≥ 25 under 3 colour-blind sims, or a shape difference (Shard/Prism).
- Desktop (WASD + mouse), touch (twin sticks; a lifted stick adopts another canvas finger). Phones: touch hints, no key badges, every button ≥ 44 px, landscape ◎⟂♪≡ top row (S-17, D-050, D-058), glyph-only ◎ ⟂ ≤ 700 px wide (D-064).
- Autosave to localStorage (seed + mined + explored bitsets + economy + floor pickups + beam mode + beacons + relays + spires + anomalies + buffs + echoOrder + ended + cycle + records) every 10 s, on deposit, and on page hide. Saves carry a format number (now 16); old formats are upgraded on load (`src/save.js`); malformed fields load empty (B-037); no seed / unreadable map = no save (B-066); tests never pin the number (`saveformat.cjs`).
- History: `05` changelog, `06` decisions (D-xxx), `03` questions (Q-xxx), `09` log (tail: `09-…-11`), `08` per-system detail.
- Gameplay randomness is seeded per draw from the world seed (`game.rng.*`, D-025): same seed + input = same run.
- Dev tools (S-7) `window.__lumen.dev.*` (`?dev` panel); M2 rules (D-022…D-024); bots in `tools/`. Detail: `08`.
- Specs (1 PR each, D-063): every spec built; M6 ✅ (v1.1), M7 ✅ (v1.2). M8 specs S-38…S-41 in `07-Build-Specs-6.md` (D-103); S-38…S-41 built. M9 Echo (owner's ally ask, D-108): S-42 (#87), S-43 (#88), S-44 (#90) built: M1–M9 ✅, every spec built. Code: Glitches `glitch.js`, HUD `hud.js`, grid `body.js` (D-053), light `light.js`, chunk paint `terrain.js`; no file > 600 lines (`docs.cjs`).

## Verified
- Per-session checks (sessions 10–48) moved word for word to `09-…-5` (audit 49), now `archive/2026-11-24-09-sessions-49-53.md` (audit 59); each lives on in the smoke suite.

## Health
- `node tests/smoke.cjs`: all passing (includes `tests/docs.cjs`: doc caps, version = changelog, inbox empty) + `tests/audio.cjs`.

## Next step (one thing)
Session 84 (Audit): parallel sweeps (bugs, perf, touch, code health, docs drift) incl. `music.js`; fix the top issues,
log the rest in `04-…-2` Debt; archive `09` parts older than audit 79; check D-xxx vs code. Top perf debt: chunk-blit pre-scale.
