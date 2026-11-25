# 07 — Build Specs, part 12: M12 Enemies and tools

Continues `07-Build-Specs-11.md` (same rules: one spec = one PR, numbers go in `src/config.js`). Design 107 (D-142).
Build order: **S-52 (part 11) → S-53 (a, b; c in part 13) → S-54 → S-55 → S-56** (M12 done = v1.7 with S-56). Each spec is usable alone (D-139).
**Measured basis (session 107, `09`):** an auto-aim bot standing in the open for 120 s in Surge takes **0 damage** at the
base max build and at max + 2, in the Deep and in the Kiln (4 seeds; mid build 32–184). Glitch tier stops at 3 (d 84),
so the Shoal / Kiln add no Surge threat today. M12's foes live in the two biomes and are tuned against the top build.
**One creature, two appetites (D-142):** each biome creature exists in both modes. In Surge it hunts the core; in Drift it
hunts ore (never touches the core). Beaming it off pays the same loot in both modes (Glitch kill loot: 2 + tier ◆, ▲ 50 %).
A 160 world sees none of M12's creatures. Weight gate for both: `tools/biomefoe.mjs` (new in S-53) runs a mining bot
10 min per seed in the biome with and without the creature; its ◆-equivalent haul ratio must be 0.85–0.95 in each mode
and the two modes within 0.05 of each other.

## S-53 — Burrower (Kiln creature) (M12)
**Save:** none (creatures are never saved; the tunnels it leaves are ordinary cleared cells in the map).
- **Spawn:** while the core is in the Kiln ring, one Burrower at a time, first after 20 s, then every 35–50 s
  (`rng['burrower']`). It starts in rock 10–14 cells from the core and moves cell by cell through ROCK / DENSE / ore
  (never vault, Spire, bedrock or the Nexus disc) at 1 cell / 0.5 s, **clearing each cell it leaves** (a free tunnel,
  no pickups: it eats the yield).
- **Surge:** heads for the core; from 2 cells out it shows a 0.8 s tell (the rock cell it is in glows Calx lilac with
  cracks, visible in the dark), then surfaces into the open cell next to the core and lunges: 22 dmg (contact rules of
  Glitches: knockback, re-hit 0.9 s). It stays surfaced 2 s (hp 6, the only time it can be hit), then burrows away 12 cells
  and returns. Dodging the tell (moving ≥ 1.5 cells) makes it surface into air: no hit.
- **Drift:** heads for the nearest unmined ore cell within 8 cells of the core; same 0.8 s tell, surfaces beside it, eats
  it after 2 s (the ore is lost) unless driven off (6 hp of beam). Driven off, it drops what it ate this trip plus the loot.
- Both: loot on kill / drive-off as above; music adds a low rumble while it is within 4 cells (held to `audio.cjs`
  ceilings, one new row). Look: a short segmented chevron, Calx lilac edge, hidden by rock except its tell glow.
- Smoke: spawn only in the Kiln and only in 256 worlds; tunnels are cleared cells; Surge lunge 22 with the tell first,
  dodged = 0; Drift never damages the core and eats only ore; drive-off pays the same as a Surge kill; nothing saved.
  `biomefoe.mjs` Kiln gate. Screenshot of the tell, viewed.

## S-54 — Mote swarm (Shoal creature) (M12)
**Save:** none.
- **Spawn:** while the core is in the Shoal ring, one swarm of 6 motes at a time, every 40–60 s (`rng['swarm']`),
  10–12 cells away in open floor. Motes: r 4 px, 0.5 hp, speed 150 px/s, **carried by the Undertow** (the chunk's flow
  is added to their velocity, so currents bend their paths) with a boids-lite pull to the swarm centre.
- **Surge:** they dart at the core: 4 dmg each on contact (knockback, re-hit 0.9 s), then scatter 3 cells and return.
- **Drift:** they dart at loose floor pickups within 6 cells of the core; a mote that touches one carries it (one each)
  and drifts off with the current; it drops it when beamed. Never touches the core; the Attractor still wins a race.
- Both: each mote beamed pays 1 ◆; the whole swarm the Glitch loot once (so a swarm = one Glitch kill + 6 ◆). Wide
  (3 rays) and Pulse (pierce) are the natural answers; Focus works. Look: tiny mint diamonds with a short trail.
- Smoke: Shoal only, 256 only; current adds to mote velocity (calm chunk: none); Surge contact 4; Drift carries a pickup
  and drops it on a hit; loot totals equal across modes; `biomefoe.mjs` Shoal gate. Screenshot of a swarm, viewed.

## S-55 — Arc beam mode (Research) (M12)
**Save:** none new (`research.arc`, the research object takes any id). **Cost:** 35 ● (Lumen ~500 a 256 world, 105 spent).
- A fourth mode in the Q / ⟂ cycle after Pulse: the ray deals ×0.8; whatever it hits arcs to up to 2 more targets of
  the **same kind** within 2 cells of the hit, ×0.35 each: a creature → the nearest other creatures (Glitch, Spitter,
  Burrower surfaced, mote); an ore cell → touching cells of the same cell type (a vein). Rock arcs to nothing.
- Target: on a ≥ 3-cell crystal cluster 1.3–1.5× Focus cells/s; on plain rock 0.8× (so Focus stays the digger);
  heat counts the arcs' Kiln damage like any beam damage. Drift = Surge (veins exist in both; swarms in both).
- Look: a thin jagged line, the beam's colour, flicking between targets; the mode icon a zigzag.
- Smoke: research 35 ●, cycle order, arcs only to the same kind within 2 cells, ×0.8 / ×0.35, cluster rate in band,
  rock 0.8×. Screenshot on a vein, viewed.

## S-56 — Ward node (Crafting) (M12 done → v1.7)
**Save:** format +1: `craft.ward` (carried) and `wards: [cell…]`. **Currency:** ▲ + ◆.
- `WARD_COST = { prism: 8, shard: 30 }`, carry 2, place 4, ≥ 6 cells apart, open floor anywhere but the Nexus disc;
  pick up on the Ward for a full refund (the Sink's rule, D-141).
- Every 0.8 s it bolts the creature nearest it within 4 cells with a clear line (1.2 hp; a Spitter bolt in one): Glitches
  and Spitters (Surge), Burrowers and motes (both modes). So it guards the core in Surge and ore in Drift: same tool,
  same numbers. No light, no stat. (Cut: the shield pylon / lens of `04`: a lens buffs beam damage, which the Core
  Matrix and Overclock already give: the same thing twice.)
- **Design 117 (D-153):** since S-53c / S-54 every biome creature hunts the core's hold in both modes, so a Ward guards
  the core (and the hold) in both. Gate: `biomefoe.mjs` with 2 Wards kept at the bot's dig site lifts the ratio but
  stays ≤ 1.00 in each mode (a Ward halves a creature's cost; it never turns one into income).
- **Close-out:** `VERSION` minor → 1.7 (D-108), `04-Roadmap-3` M12 ✅, `02` scope line.
- Smoke: craft price, placement rules, bolts only within 4 cells with a line, Drift = Surge rate, refund, format bump,
  old save loads with none. Screenshot of a Ward firing, viewed.
