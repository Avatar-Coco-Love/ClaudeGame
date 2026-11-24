# 06 — Decisions log, part 5

Continues `06-Decisions-4.md` (same rules: supersede, never edit; list rejected alternatives). D-045 on.

### D-045 — v1.0 scope: M1–M5 is the game, M6–M8 is polish, then it is finished (2026-11-24, session 30, inbox; settles Q-003, Q-004)
The owner asked for a finish line so long unattended runs don't drift into feature creep. `01` "Scope and end state" holds it:
- **v1.0 ships when M5 ships:** Spires, an ending sequence, New Cycle. The win (Q-003) is relighting every dormant Spire in the
  Deep; each relight is a delivery plus a challenge in the current mode (Drift puzzle or Surge defence, equal, D-002). How many
  Spires and what each costs is the M5 design session's to measure, against a world's supply (`07` header).
- **Bosses:** only the Surge Spire defence (a wave that converges on the Spire you are relighting). No standalone boss.
- **Post-1.0:** M6–M8, same loop deeper. After M8 the game is finished; sessions fix, audit and tune, and invent no milestones.
- **Out of scope:** multiplayer (Q-004: no netcode before 1.0; co-op stays a design-only spike in `04` Later), telemetry/analytics,
  a standalone puzzle mode, accounts/cloud saves, monetisation, story text or characters.
- **New work:** anything outside M1–M8 needs a design-session D-xxx naming the pillar it serves and what it replaces.
- Rejected: v1.0 = M4 (no reason to go deep, so no end; the arc is the point of Spires); v1.0 = M8 (polish would gate the
  finish line and recorded audio waits on the owner, D-037); standalone bosses (a Surge-only climax would make Drift the lesser
  game, and a boss arena is a new system; the Spire defence reuses Glitches); an endless game with no win (Q-003's candidate already
  fits the rings); co-op in 1.0 (destructible terrain sync is the largest tech risk, for a player count nobody asked for);
  telemetry (no backend, static files, D-001, and bots already measure balance); a separate scope doc (`04` is the roadmap).

### D-046 — VERSION counts shipped milestones; 1.0.0 means M5 shipped (2026-11-24, session 30, inbox; refines D-003)
`VERSION` = `<major>.<minor>.<PR count>`. Before 1.0: major 0, minor = the highest N with M1…MN all ✅ in `04`. M5 done → `1.0`.
After 1.0: minor = post-1.0 milestones done (M6 → 1.1, M7 → 1.2, M8 → 1.3). The PR count never resets. Tooling and Debt
are not milestones. A conditional roadmap item ("only if…") doesn't hold a milestone open: it moves to Later.
M2's last item (larger world, only if rings feel short, D-022) moved to Later, so M2 is done: v0.1.33 → **v0.2.34**.
- Rejected: keeping minor = 1 forever (it was never bumped past M1, so it meant nothing); minor = the milestone being worked on
  (several are open at once: M3 S-14 and M4 Beacons); resetting the PR count per minor (breaks the one-entry-per-PR history in `05`).

### D-047 — Floor pickups: `kept` loot is uncapped, loose loot evicts its oldest (2026-11-24, session 31, B-022; refines B-005/B-014)
Pickups spawned with `force` (death scatter, vault caches) are tagged `kept`: never counted toward `PICKUP_CAP` (400), never
evicted. At 400 loose pickups a new one evicts the oldest loose one, so a break always yields. Saves store the tag (format 8);
a format-7 floor loads all kept, since its scattered cargo can't be told apart.
- Rejected: refusing new loose loot at the cap (the bug: a stuck floor in the save); evicting the oldest of any pickup (eats
  the player's own cargo, B-005); counting only untagged without eviction (a 400-ore floor still blocks yields).

### D-048 — Build order to v1.0's first Spire; build mode = placement; `08` folded into specs (2026-11-24, session 32, Design)
Order: **S-17** touch pass → **S-14** Pulse → **S-18** code split → **S-15** perf check → **S-16** Beacons → **S-19** Spires v1a;
then the Surge bot runner (it tunes the Spire defence), Relays (Design 37) and Spire relights. Touch goes first because session 32's
play-test reproduced it on screen (landscape title clipped, ◎/⟂ under the aim thumb, hint cut at 320 px) and phones are half the
audience. S-18 precedes Beacons/Spires so `render.js` (540) and `game.js` (484) stay under 600 lines as they grow.
- "Build mode UX" is cut as its own item: S-16's B / ✦ placement with refusal toasts is the build mode; Relays reuse it.
- ≡ keeps "save and go to the title" (Continue resumes): a pause sheet is a new UI system for the same job.
- Wording fix (D-021 not edited): hitstop fires on every yield cell (crystal, prism, Lumen) and caches, not crystal/prism only.
- No rebalance: the play-test found no number off; Q-011's Pulse probe comes after S-14.
- Rejected: Surge bot runner before Spires (it has nothing Spire-shaped to measure yet); Relays before Spires (M4 can't be
  judged without the destination that makes long routes matter); deleting the touch list to Debt (reproduced, user-facing).

### D-049 — Spires v1a: 5 seed-placed dormant Spires at d 64–74, saved once chosen (2026-11-24, session 32, Design; refines D-045)
Five, one per 72° sector, so every direction leads somewhere and the win is a tour, not one dig. d 64–74 sits past the vaults'
mean and inside the Lumen band, where session 32 measured ~648 prism cells per world beyond d 64 (deliveries can be mined nearby).
Sites are seed-only; an old save takes the first candidate with no explored cell (D-024), and chosen centres are saved so a
later generator change never moves a Spire. The core is unmineable so the goal can't be destroyed.
- Rejected: 3 Spires (too short an arc for the end of v1.0); 8 (crowds the ring with vaults, ~20 cells apart); random
  angles (could cluster on one side); Spires at the world corners (d > 90 exists only diagonally, unfair by direction);
  skipping seen sites like vaults (the win needs all of them); mineable Spires (a player could erase the ending).

### D-050 — Touch layout rules (2026-11-24, session 33, S-17)
Landscape phones (`max-height: 480px` + coarse pointer) put ◎ ⟂ ♪ ≡ in one row left of the minimap, all above y 90; portrait keeps
the column. Coarse-pointer HUD/sheet buttons are ≥ 44 px. A lifted stick adopts another live touch on its half from where it is now
(no jump). Probes exit 1 on an unknown `MODE` (`tools/mode.mjs`), so `MODE=pulse` fails until S-14 lands.
- Rejected: moving the buttons to the left edge (the move thumb lives there); a bottom bar (both thumbs); adopting with the old
  stick's origin (the core would lurch toward a stale offset); a separate pause sheet (cut in D-048).

### D-051 — Repeated glow shapes are sprites (2026-11-24, audit 34, B-027; supersedes D-032's rejected sprite)
Pickups and Scanner glyphs are baked once per kind into a glow sprite at the current zoom × DPR (`render.js` `glowSprite`) and
drawn with one `drawImage`; rebuilt only when that scale changes. Measured first (D-032 asked for it): each `shadowBlur` draw cost
≈ 3.4 ms on headless Chromium, 30 pickups took a frame from 22 to 120 ms; with sprites 300 cost 33 ms. Culling (D-032) stays.
`tests/audit34.cjs` counts shadowed draws so it stays this way. One-off glows (Nexus, core, beam, Glitches ≤ 9) keep `shadowBlur`.
- Rejected: dropping the glow (pillar 1 look); a lower pickup cap (eats saved loot, B-005/D-047); waiting for S-15's perf tool
  (the cost was already measured and the fix is local to `render.js`).
