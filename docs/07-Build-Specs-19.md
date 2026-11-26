# 07 — Build Specs, part 19: M16 Echo minds (D-181)

Plan in D-181 (owner inbox, session 143). One slice per PR (D-063), each usable end to end (D-139). VERSION: M16 → 1.11.
**Why:** the owner wants Echo upgrades and a clear Mine / Defend choice plus an Auto that does both and acts smart.
Today the Echo (S-42/43, `echo.js`) has Gather / Guard, fixed numbers and picks the nearest ore.

## S-69 — Echo modes: Mine / Defend / Auto (M16)
**Save:** none. `echoOrder` ids stay `gather` / `guard` (old saves load as Mine / Defend; malformed → Mine, B-037);
`auto` is added to `ECHO_ORDERS`. A newly researched Echo starts in Auto; R / ◇ cycles Mine → Defend → Auto.
- Labels (chip, Research text, toasts): **Mine**, **Defend**, **Auto · Mine** / **Auto · Defend** (what it is doing
  now). "Guard (idle)" goes: Defend shoots `beamFoes` in Drift too (Burrower up, Motes; later Tracers).
- **Auto** (`autoPick(game, e)`, every `ECHO_AUTO_S` 0.25 s): a **threat** is a Spitter bolt within 1.5 ×
  `ECHO_GUARD_PX` of the core and closing on it (velocity · to-core > 0), or a foe within `ECHO_GUARD_PX` of the core the
  Echo can see. Threat → Defend; no threat for `ECHO_AUTO_HOLD` 2 s → Mine (hysteresis: no flicker at the range edge).
  Cargo full and no threat: it Defends nothing and Mines nothing (as Mine does now), the chip says Auto · Mine.
- **Smarter picks (all orders):** Defend shoots a closing bolt before any foe, then the foe with the least time to reach
  the core (distance / its speed), not just the nearest. Mine scores ore cells by `ORE_WORTH[kind] / (cells away + 2)`
  (`ORE_WORTH` in `config.js` = eventrun's `VALUE`: ◆ 1, ▲ 3, ● 4, ≈ / ⬟ 12) instead of the nearest.
- Tell: a 1 px ring round the Echo while it defends (any order), its beam while it mines; unblurred (D-160).
- Smoke (`echoorder.cjs`): 3-order cycle; old 'gather' / 'guard' and a malformed order load; a new Echo is Auto; a stub
  Glitch at 100 px with a line → Auto · Defend within 0.25 s, back to Mine 2 s after it dies; a foe oscillating across
  the range edge for 10 s gives ≤ 2 switches; a closing bolt is shot before a nearer Glitch; a ▲ 3 cells away beats a ◆
  1 cell away; Drift: Defend hits a Mote. One screenshot (Surge, Auto · Defend ring and chip).

## S-70 — Echo upgrades: Focus, Volley, Tether (M16)
**Save:** `echoLevels` { focus, volley, tether } 0…2 → format 25 (upgrade: all 0; malformed → 0, clamped; `saveformat.cjs`).
- Research tab, under the Echo row once researched: three rows, ● 20 for level 1, ● 35 for level 2 (● 165 in all).
  | Row | Changes | 0 → 1 → 2 |
  |-----|---------|-----------|
  | Focus | Mine dps, × the core's Beam Power (`ECHO_DMG`) | 0.5 → 0.7 → 0.9 |
  | Volley | Defend interval (`ECHO_GUARD_S`, 0.8 hp a hit) | 0.8 → 0.6 → 0.45 s |
  | Tether | Mine reach (`ECHO_REACH` cells) and Defend range (`ECHO_GUARD_PX`) | 5 / 140 → 6 / 170 → 7 / 200 |
  Numbers in `config.js` (`ECHO_LEVELS`); `echoStat(game, key)` reads them, nothing else does. Rows show level pips
  (·· / ●· / ●●) and the next number; maxed rows read "max". Same in Drift and Surge (each helps both).
- Phones: the three rows fit at 320 × 568 Large text (the tab scrolls; the Echo row itself stays visible at 360 × 640).
- Smoke: costs and levels; `echoStat` per level; Focus changes the Echo's dps on a stub cell, Volley its shot count in
  10 s, Tether the cells it may pick; no Core Matrix stat moves; old save loads levels 0; a 3rd buy is refused. One
  screenshot (Research tab, Focus 2 / Volley 1).

## S-71 — Echo gate: Auto earns its name (M16; refined Design 147, D-186)
**Save:** none.
- `tools/echobot.mjs --orders`: surgebot's `deep` route (Spitter depth), mid build, 2 × `GATE_SEEDS` (16) seeds, 5 min.
  Runs: Surge no Echo / Mine / Defend / Auto, Drift no Echo / Auto, each at Echo levels 0 and 2 (all rows), ~60 s.
  Reports gain / min (banked + carried), **mean** damage / min (an 8-seed median swung 17 → 10), Auto's switches / min.
- **Echo share = 1 − (no-Echo gain / with-Echo gain)**, not the ore it broke: the core's beam goes mostly into rock
  while it tunnels, so ore credit reads 55–77 % for an Echo that adds ~25 %.
- **Gate (PASS), Surge:** Auto gain ≥ 0.9 × Mine's; Auto damage ≤ 1.1 × Defend's. **Both:** Auto gain Drift / Surge
  and the Echo's added gain Drift / Surge in 0.8–1.25 (D-158's band); level-2 share in 15–35 % (the core stays the
  miner; under 15 % reopens Q-039). On a fail tune `ECHO_AUTO_HOLD`, then Focus (log each try in `09`). In `gates.cjs`.
- Design 147 probe (16 seeds, before any tuning) already passes: Auto 0.97–0.99 × Mine, damage 1.02 / 0.83 × Defend;
  share Drift 23 / 29 %, Surge 17 / 22 % (L0 / L2). So S-71 is likely a gate with no tuning.
- Session 148 (D-187): split. S-71a = the measure (48 seeds, built); S-71b = the gate in smoke, after Q-040.
- **M16 done** after S-71b passes. Session 151 (D-189): Q-040 settled (added gain ≤ 1.5, band on Auto gain); built.

## Cut (D-181)
An Attack order, a second Echo (Q-039), upgrades past level 2, a learning Auto or weight sliders, an Echo that leaves
its leash, Echo upgrades on the Core Matrix or the Nexus.
