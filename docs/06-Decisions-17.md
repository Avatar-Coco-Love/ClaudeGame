# 06 — Decisions log, part 17

Continues `06-Decisions-16.md` (same rules: supersede, never edit; list rejected alternatives). D-119 on.

### D-119 — The game grows: M10–M14 (owner's ask, 2026-11-25, session 87, Design; supersedes D-045's and D-108's "finished" end state and D-045's "no standalone bosses")
- **Ask (chat):** "This project is not even close to being done." The owner gives feedback; Claude decides what is built
  and how. Approved order, one milestone at a time, each closing its own loop before the next starts (pillar 4):
  - **M10 World and biomes** (pillars 3, 4): a 256×256 world for new games, two rings past Deep, each a biome with its
    own look, rock behaviour, hazard and music layer (D-120). The foundation for the rest.
  - **M11 Economy** (pillar 4): one new resource per biome, a new upgrade tier, new things to craft and buy. Each item
    lives in exactly one layer (`01`): no layer unlocks what another already does.
  - **M12 Enemies and tools** (pillars 2, 5): Swarm and Burrower (from "Later"), one native foe per biome; Drift gets
    biome hazards of equal weight; new ways to mine / defend / attack (beam modes, placeable nodes such as a pylon).
  - **M13 Events and puzzles** (pillars 2, 3): world events beyond weather (cave-in, Lumen bloom, a brief rift, roaming
    elites), new Vault / Spire puzzle types, one puzzle per biome.
  - **M14 Bosses** (pillar 2), built last: one per biome, **two forms**: in Surge you fight it, in Drift you take it
    apart as a puzzle (e.g. cut its shell in the right order). Same reward either way, so Drift = Surge still holds.
- **Unchanged:** every pillar in `01`, the five progression layers, the v1.0 arc (Spires, ending, New Cycle) and
  D-045's out-of-scope list (multiplayer, telemetry, accounts, monetisation, story text).
- **VERSION (D-046 / D-108 style):** M10 → 1.5, M11 → 1.6, M12 → 1.7, M13 → 1.8, M14 → 1.9; patch keeps counting (D-105).
- **New milestones after M14** still need a design-session D-xxx naming the pillar served (D-045's rule kept).
- Rejected: **Surge-only bosses** (makes Surge the "real" game, breaks pillar 2); **bosses first, on the current map**
  (no biome to belong to, and M14's rewards need M11's resources); **keep the game finished** (the owner's ask);
  **a new layer for biome gear** (Crafting and Research already cover placeables and new kinds; a sixth layer invites double unlocks).

### D-120 — M10 world plan: 256×256 for new worlds, built eagerly; old saves keep 160×160; biomes are rings (session 87, Design)
- **Measured** (headless Chromium, CPU throttled 4×, 6 seeds; `09` session 87): `new World` 160 = 36 ms median /
  65 max, 256 = 65 / 112, 320 = 85 / 151; whole `new Game` 42 / 67 / 142 ms. Save JSON 9.5 KB (160) → 22.8 KB (256).
  Frames at 1280×800 4×: no change at 256 (the chunk paint cache is already lazy, D-116). So **eager generation stays**;
  lazy chunk generation is not needed until a world passes 320 (Q-025).
- **Size is saved data:** the save gets `size` (format 18); every pre-M10 save upgrades to `size: 160` and keeps its
  exact world: same cells, rings, vaults, Spires, Anomaly sites. New worlds and every New Cycle are 256, so an old player
  reaches the big map through New Cycle or New World, never by a rewrite of the save.
- **Rings past Deep:** Deep becomes d 48–80 (Spires stay at d 64–74: the v1.0 arc is unchanged), **Shoal** d 80–104,
  **Kiln** d ≥ 104 (to the edge, corners to ~180). A 160 world keeps three rings (its corners stay Deep).
- **Sites append:** new vault and Anomaly sites for the outer rings are drawn after the existing lists with their own
  salts, so a 160 world's lists (and saved indices) are identical.
- **Minimap:** shows a 160-cell window centred on the core (clamped to the world), so scale and marks read as today.
- **Biomes:** Shoal = brittle glass (a break cracks one neighbour) + Undertow currents that push the core;
  Kiln = slag that heats the beam until it vents + flare vents that shove the core. No damage, no cargo loss: both
  hazards weigh the same in Drift and Surge. Each adds a music progression. Resources wait for M11.
- Rejected: **lazy chunk generation now** (measured unnecessary; it would touch every reader of `world.cells`);
  **grow old saves to 256 with an offset** (re-indexes ~10 saved fields, each a stranding risk; noise is absolute, so
  the old map wouldn't match anyway); **384+** (151 ms at 320 already; long empty hauls before M11 gives them a
  purpose); **biomes as angular sectors** (would cut through Veil/Deep and the Spire band; rings reuse `world.rings`, the
  ring toast, hp and music by ring).

### D-122 — S-46 ships in two slices; outer vaults start at d 86 (session 90, amends S-46)
- **S-46a** (this PR): `RINGS` Shoal (r0 80, hp ×2.2) / Kiln (r0 104, hp ×2.6) with `colours.cjs`-held edges; profile
  256 = 5 rings, 6 + 4 vaults, Anomalies `[3, 5, 8, 6, 6]`; the new lists use salts `vault-outer`, `anomaly-outer`,
  `anomaly-outer-kind`. 256 stays dev-only. **S-46b**: minimap window, ending map frame, perf budget, then
  `WORLD_SIZE_NEW = 256` (flipping before the window would ship a 256 world on a whole-map minimap).
- Outer vaults draw at d **86**–118, not 82: `SPIRE_D[1] + SPIRE_VAULT_GAP` = 86, so no outer vault can change the
  Spire choice (at 82 it moved the Spires, and so the inner Anomalies, of 1 seed in 40). A check pins the inequality.
- Rejected: flipping to 256 in one PR (too big for one session's smoke + perf work); making Spires ignore outer vaults
  (a vault could then sit inside a Spire's gap); bright edges like the ore (mint ≈ Shard, ember ≈ Lumen / amber: ΔE < 25).

### D-121 — D-107's "every font size scales" has two exceptions (audit 89, docs drift; amends D-107)
- The title `h1` (`clamp(28px, 10.5vw, 76px)`, landscape `clamp(24px, 6.3vw, 46px)`) scales with the viewport, not
  `--ts`: it is already ≥ 24 px, so Large text adds nothing to readability there. The phone `.bank` stays 15 px
  (D-107 already says so). Every other `font-size` in `style.css` is `calc(Npx * var(--ts))`.
- Rejected: scaling the title too (a wider wordmark on small screens for no reading gain); rewording D-107 in place (supersede, never edit).
