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
