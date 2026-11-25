# 07 — Build Specs, part 13: M12 continued

Continues `07-Build-Specs-12.md` (part 12 neared the 8 KB cap at Design 112; same rules: one spec = one PR, numbers in
`src/config.js`). Build order: **S-53c → S-54 → S-55 → S-56** (S-54…S-56 in part 12).

## S-53c — Burrower retune to the gate (Design 112, D-147, Q-030) (M12)
**Save:** none. Supersedes S-53's Drift target and belly rules; Surge's lunge, tell, dodge and hp are unchanged.
- **Gap:** `BURROW_EVERY_S` 35–50 → **20–30** (first still 20 s).
- **Tunnels pay nothing:** an ore cell it digs through on the way is cleared with its yield lost (it no longer fills
  the belly). The belly is only the cell it breaks out of; a kill / drive-off pays that + the Glitch loot (unchanged).
- **Drift hunts the hold:** it heads for the core exactly as in Surge (same 2-cell tell, same 1.5-cell dodge). Surfacing
  undodged it **bites 4 cargo items**, most valuable first (≈ ⬟ before ▲ ● before ◆), and they are gone (digested,
  not in the belly). No damage, no knockback, no contact re-bite while up. Empty hold: it bites nothing. The S-53
  "nearest ore within 8 cells" target and the eat-after-2 s are removed (`BURROW_ORE_R` goes).
- **Feel:** the bite = the cargo bar flashes lilac + a soft crunch (a short low noise burst, `audio.cjs` ceiling row);
  the first bite of a session toasts "A Burrower bit your hold".
- **Measured (play-test 112, 8 / 16 seeds × 10 min):** Drift 0.885 / 0.928, Surge 0.906 / 0.889, gap 0.021 / 0.039: PASS.
  Bite 2 = 0.998, 6 = 0.826; a bite refunded on drive-off = 1.03 (the bot always kills it: it must not be refunded).
- Smoke: gap 20–30; tunnel ore pays nothing; Drift tell then bite 4 (most valuable first), dodged = 0, empty hold = 0,
  never damage; Surge unchanged; `biomefoe.mjs` gate PASS on 8 seeds (a smoke check of the ratio, or the tool's line
  in `09`); first-bite toast once. Screenshot of the lilac cargo flash, viewed.
- **Lesson for S-54 (gate first):** a top-build bot is never ore-limited and kills fast, so a creature costs only what
  it takes *unrefunded* at the moment it strikes. Build S-54, run its gate, and if it misses, use the same knob: a mote
  that touches a pickup or the core's hold takes 1 item for good; its beam loot stays (1 ◆ each, Glitch loot per swarm).
