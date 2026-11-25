# 05 — Changelog

One entry per merged PR, newest first. Version = `<major>.<minor>.<PR count>` (D-046: minor = milestones shipped; 1.0 = M5; D-105: patch = PRs since 1.0.0). `VERSION` in `src/config.js` must match the top entry
(`tests/docs.cjs` enforces it). Write for a player: what changed on screen, not how it was coded. Detail lives in `09`.

## v1.4.32 — 2026-11-25
- **Planning for the bigger world.** No change in play: the bigger world, the Shoal's currents and the Kiln's heat
  were measured and their plans tuned (gentler currents, fewer beam vents) before they are built.

## v1.4.31 — 2026-11-25
- **A minimap that follows you.** In the bigger world coming next, the minimap shows the 160 cells around your core
  (the Nexus always stays on it); today's worlds still fit whole. The ending's overview now frames everywhere you
  explored, not just the Spires.

## v1.4.30 — 2026-11-25
- **Two new depths, waiting past the Deep.** The Shoal (glassy mint and ice) and the Kiln (ember and rose) now exist,
  with tougher rock, their own vaults and Anomalies. They arrive in play with the bigger world in the next update;
  today's worlds are unchanged.

## v1.4.29 — 2026-11-25
- **Health check.** No change in play: tidier code under the hood before the bigger world arrives, with new checks that
  every vault, Spire and Anomaly stays clear of the world's edge.

## v1.4.28 — 2026-11-25
- **Groundwork for the bigger world.** Saves now remember how big their world is. Nothing changes in play: every world
  is still the same size, and your current world loads exactly as before. (Saves upgrade automatically.)

## v1.4.27 — 2026-11-25
- **The game keeps growing.** No change in play yet: this release sets the plan. Next comes a much bigger world for new
  games with two new regions past the Deep (Shoal and Kiln), then new resources and upgrades, new foes and tools, world
  events and puzzles, and finally one boss per region: fought in Surge, taken apart as a puzzle in Drift. Your current
  world stays exactly as it is; a New Cycle or New World will open the bigger map once it lands.

## v1.4.26 — 2026-11-25
- **Phones held sideways:** the Core Matrix fits twice as many upgrades on screen (the tabs, your bank and ✕ share
  one row), and Settings shows every option at once in two columns, no scrolling.

## v1.4.25 — 2026-11-25
- **Fix:** a storm or aurora that a Wake cut short no longer comes back when you reload the page in the next few
  seconds; the next one still arrives on time. (Saves upgrade automatically.)

## v1.4.24 — 2026-11-24 (#91)
- **Smoother frames:** the terrain is now drawn at screen size up front instead of being scaled every frame, which
  cuts the biggest per-frame cost (about a third faster on slower devices). Edges look a touch crisper.
- **Fixes:** muting and unmuting (or Music 0 → back) no longer stacks two clashing chords; after a core death the
  Echo blinks back to you instead of waiting where you fell; on landscape phones the bank panel no longer slides under
  ◎ and ⟂ when Anomaly chips show, and with Large text the death toast no longer touches the panel; a buff taken as
  another ends keeps its chip.

## v1.4.23 — 2026-11-24 (#90)
- **New: ambient music.** A quiet synthesized bed now plays under the game: soft pad chords that turn brighter in the
  Hearth, modal in the Veil and dark in the Deep, with a gentle bell in Drift or a low pulse in Surge (same loudness
  either way). A Spire Wake drops to a quickened pulse; the ending fades it out. New **Music** slider in Settings
  (default 50; 0 turns it off). This finishes the Polish & platform milestone: every planned milestone is now done.
