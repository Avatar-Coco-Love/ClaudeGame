# 09 — Implementation Log, part 5

Continues `09-Implementation-Log.md` (split at the 8 KB cap, session 49; parts 3–4 were archived in audit 54). Newest at the bottom; read the tail only.

## Session 49 — Audit: tests split, SAVE_FORMAT guard, Nexus pointer, toast queue, B-041, B-042 (v0.2.53, #54)
- Sweeps (code health + docs drift, correctness, mobile/touch + perf) ran in parallel; each finding re-run here first.
- Tests: node-only checks (S-5 RNG, S-8 rings, S-9 vaults, S-10 Lumen, audit 14 loot) moved word for word from
  `smoke.cjs` (545 → 392 lines) to `tests/world.cjs`; new `saveformat.cjs`, `hud.cjs`, `audit49.cjs`. Smoke 190/190.
- H5 (the second pin, `spire.cjs` `SAVE_FORMAT === 10`; first was `craft.cjs`, audit 44): `saveformat.cjs` (D-075) fails
  on the old `spire.cjs` and with `SAVE_FORMAT` set to 11 and no step (proven). `peak.core === 10` → `T.SPIRE`.
- T1 (D-074): pointer under a HUD box (label counted, all buttons shown) for 131 / 101 / 60 / 104 / 56 of 180 headings at
  568×320 / 320×568 / 412×839 / 863×360 / 1280×800 on the old code, 0 now. Viewed 568×320: arrow clear of ✦ and minimap;
  its NEXUS label can now cross a toast at 30 % height (T1b, Debt).
- C3 + T3 (D-073): old code showed "A dormant Spire" 32 ms then cargo-full, beacon toast never; 320 px toast 50 px tall
  (2 lines). Now all three in order, Spire 3.2 s; 33 px, centred. `spire.cjs` waits for the Spire toast after "Entering the
  Deep" (the ring toast now holds). First run of the queue failed S-13's Q toast (queued behind "Wide Beam online"): key and
  tap answers got the `now` tier.
- **B-041 (fixed, dev only):** `dev.teleport` aimed at a Spire landed the core inside the unbreakable 3×3 core (9 solid
  cells around it on all 5 Spires of seed 77). It now picks the nearest clear 3×3 within 12 cells (3 cells off, 0 solid).
- **B-042 (fixed):** sparks on a Spire core / facet were the ring's rock edge (`#6a4dff` on seed 77): `world.hit` is null
  for unbreakable cells and the fallback was `T.ROCK`. Now the cell's own type (`#a89cf0`).
- H1 comment `spirefind.cjs` → `.mjs`; H4 one `BEACON_RGB` in `config.js` (craft + light). Docs: `02` trimmed (8156 → ~5.6 KB),
  cell types complete; pillar 3 names the Spire exception; `07-2` built specs deleted; `09` sessions 39–43 archived
  (`archive/2026-11-24-09-sessions-39-43.md`, `09-2` removed). D-001…D-072 checked against the code: all match (D-067's
  "render.js 464 lines" is a snapshot; 466 now). Left in Debt: T2, T1b, T4, H2, H3, H6.

### Verified list, moved word for word from `02` (headless Chromium, desktop + Pixel 7 emulation)
- Older per-session checks (shake, hitstop, Surge determinism, teleport: sessions 10–15) live in `09` and the smoke suite.
- Mining from the Nexus collects Shards; deposit banks all cargo; Beam Power costs 8◆. Surge Glitches spawn away, die to the beam.
- Reloading restores the mode, upgrades, bank, and mined terrain. Touch sticks move the core and mine. No page errors.
- Dying among several Glitches near the Nexus no longer freezes the game (B-007, session 7).
- A Glitch boxed in by dense rock fades within 8 s without kill credit; one with a clear line keeps chasing (session 8).
- The mining check is timed by game time (B-006); leaving the page drops held touch sticks (B-009) (audit, session 9).
- Banked Shards show "Upgrade ready"; a death on a full floor keeps all cargo; floor pickups survive reload (audit, session 14).
- Deep rock takes 2× Hearth's beam time; seed 77's layout + types are unchanged by rings; Veil–Deep border reads at DSF 1 (session 16).
- A Deep Prism field reads at DSF 1; the Deep's ×2 rock adds only ~2 s to the first-Lumen trip, kept (D-029, session 17).
- 6 vaults on 40/40 seeds; a cache gives 20◆ + 6▲ and stays open; a format-3 save keeps its tunnels and skips seen vaults (session 18).
- 400 off-screen pickups cost no draws; teleport keeps the border (audit 19). Lumen only at d ≥ 55; format-4 saves load with 0● (20).
- Scanner ping marks exactly the ore within 12 cells, cools 20 s, survives reload; Research tab fits 320 px (session 21);
  also an unopened vault cache 10 cells away, with one soft tone, but not at 14 cells (session 25).
  Wide cracks 3 wall cells at 0.45× Focus each, two rays on one cell count once; Q is dropped under the Matrix (session 26).
- Audit 29 (`audit29.cjs`); touch (33, `touch.cjs`); glow sprites 540 → 33 ms (34, `audit34.cjs`); Pulse 2 / 3 cells per burst (35, `pulse.cjs`); S-18 split: same Surge run + byte-same screenshot (36); a full Pulse fires out of reach (37); draw cost as counts + ratios (38, `drawcost.cjs`);
  blur/hidden drop a Pulse charge, HUD fingers not adopted, sheets ≥ 44 px at 3 phone sizes, Glitch sprites (audit 39, `audit39.cjs`); full Pulse holds at open floor, one-shots tier 3 at Beam 2 (40); beacons: rules, light pixel, reload, format 8, phones ×3 (41, `craft.cjs`); pool floor 3.3 → 7.1 luma, walls same (43, `glow.cjs`); no HUD overlap at 4 landscape sizes (43); Pulse waits at bedrock, bad saves load, HUD text fits, no bare tuning in `game.js` (audit 44); S-26 split byte-same ×8 scenes (45); Spire found once, breath, minimap mark, 320 bank (48).
- Every sound rendered offline: a full-hold deposit is loud 0.35 s (was 4.4 s); no square-wave buzz (audit 24).

## Session 50 — Build: S-22 Relays (v0.4.54, #55)
- **What:** Craft row Relay (40◆ + 12▲, carry 1, ≤ 3); B / ✦ places `craft.last` if carried, else the other item (the
  button shows ⊕ or ✦ and its count). Refusals: d < 24 "Too near the Nexus", < 16 cells from a Relay / vault centre /
  Spire footprint, rock or an occupied cell. Cargo within 64 px banks with the Nexus ticks + chime; no heal, no repel.
  ⊕ + dashed 64 px ring in the world, 100 px light + cyan floor glow (`lightSets[1]`), minimap ring. `SAVE_FORMAT` 11
  (`relays`, `craft.relay`, `craft.last`). M3 + M4 done → v0.4 (D-077). `05` v0.2.39–42 archived word for word (size cap).
- **Checks** (`tests/relay.cjs`, 16): cost exact, both costs needed; each refusal + good placement; vault / Spire gaps;
  banking ◆ ▲ ● with 9 ticks + chime and streaks toward the Nexus; Surge integrity stays 1 at a Relay; 20 px outside the
  radius nothing banks; `placeKind` order; reload; previous-format save; malformed saves clamp; cap 3; browser: Craft tab
  row + lock, B at d 30 places and banks, light at the Relay 1 / 237 dark 220 px off, minimap ring, reload; 320×568 tab
  fits + ⊕ tap places. New file, so each check failed on the old code (no `craftRelay` / `relays`).
- **Observed (screens viewed):** 1280×800 a cyan ⊕ in its own pool with a faint dashed ring; 320×568 both Craft rows fit,
  the Relay row reads "Banks your cargo where it stands … No healing". First run: the Relay toast queued behind "Entering
  the Veil" (D-073 working as meant); the test now marks rings seen. `game.js` bare `200` caught by audit 44's tuning check.
- **Parity (D-002):** `tools/relayrun.mjs` 20 seeds: 10▲ from d 60 → 6.95 s home, 1.42 s with a Relay at d 50 (2 seeds
  refused: a vault or Spire within 16 cells of d 50). Surge start build 9.64 → 1.80 s, 0 deaths either way. Equal gain
  in both modes; in Surge it cuts the cargo-carrying exposure ~5× but never heals. No bugs found.

