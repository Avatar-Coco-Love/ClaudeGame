# 05 — Changelog

One entry per merged PR, newest first. Version = `<major>.<minor>.<PR count>` (D-046: minor = milestones shipped; 1.0 = M5; D-105: patch = PRs since 1.0.0). `VERSION` in `src/config.js` must match the top entry
(`tests/docs.cjs` enforces it). Write for a player: what changed on screen, not how it was coded. Detail lives in `09`.

## v1.11.92 — 2026-11-26
- **M16 Echo minds is complete.** No change in play: the Echo's Auto order is now held to its promise by the game's own
  checks on every update — it gathers nearly as much as Mine and keeps you as safe as Defend, in Drift and Surge alike.

## v1.10.91 — 2026-11-26
- No change in play: the game's own tests now always start the same test world, so a rare unlucky map can no longer
  make a check fail for no reason (audit 150).

## v1.10.90 — 2026-11-26
- **Fixed (B-104):** on some phones, faint straight lines flickered along the right and bottom edges of a square
  around a Relay or Beacon light while you moved. The soft floor glow under a light pool now draws cleanly at every edge.

## v1.10.89 — 2026-11-26
- No change in play: a test bot now measures every Echo order in both modes over 48 worlds. It found the Echo adds a
  little more ore in Drift than in Surge (where it spends time shooting for you), so that balance is up for a decision.

## v1.10.88 — 2026-11-26
- No change in play: a design pass measured the Echo (it adds about a quarter to what you haul, and Auto mines as much
  as Mine while taking no more hits than Defend) and sharpened the plans for its test and for the coming hunters.

## v1.10.87 — 2026-11-26
- Echo upgrades in the Research tab, paid in Lumen ●: **Focus** (it mines faster), **Volley** (it shoots faster) and
  **Tether** (it mines and defends farther from you). Two levels each, ● 20 then ● 35; each helps in Drift and Surge.

## v1.10.86 — 2026-11-26
- The Echo has three orders now: **Mine**, **Defend** and **Auto**. A new Echo starts in Auto: it mines, turns to
  defend when something comes for you (a ring round it shows it), and goes back to mining 2 s after it is safe.
- Smarter in every order: it shoots an incoming bolt first, then whatever would reach you soonest, and mines the most
  valuable ore in reach rather than the nearest. Defend also works in Drift (Burrowers, Motes).

## v1.10.85 — 2026-11-26
- No change in play: a health check. The game's own tests got steadier (two that failed now and then under load), so
  new features reach you with fewer false alarms.

## v1.10.84 — 2026-11-26
- No change in play yet: your feedback shaped the next updates. The Echo gets Mine, Defend and a smart Auto mode
  plus its own upgrades, then new hunters arrive that follow you through the tunnels you dig, in Drift and Surge alike.
  World feats come after that.

## v1.10.83 — 2026-11-26
- No change in play yet: the next update is planned. Each world will keep a short list of feats (open every vault,
  chart a third of the map, empty five rifts and more) shown at the Nexus and on the ending card. They pay nothing
  and count the same in Drift and Surge.

## v1.10.82 — 2026-11-26
- **The Nexus reaches out (v1.10).** The Nexus now wears what you've built: a thin cyan ring for Radiance, a mint one for
  the Chart and a violet-white one for the Lens. The Lens ring dims while a call recharges and brightens when you can
  call again, and buying a Nexus upgrade sends a white ring out from the Nexus itself.

## v1.9.81 — 2026-11-26
- **Lens tuned:** a rift can be called once every 150 s (was 90 s). Tested over many runs in Deep, Shoal and Kiln:
  calling on every cooldown now earns at most about a quarter more ore than plain mining, and always costs more ▲
  than it brings back, the same in Drift and Surge. A call stays a choice, not the new way to mine.

## v1.9.80 — 2026-11-26
- **Clearer buttons:** the Lens's call-a-rift button is now ❖ (it used to be ✧, the same mark as the Lodestone
  Anomaly's chip). No other change in play; a health check behind the scenes (phone layouts re-checked with every
  button shown).

## v1.9.79 — 2026-11-26
- **New: the Lens.** A Nexus row for 40 ▲. Once built, press C (or tap ✧) anywhere outside the Nexus to spend 30 ▲
  and open a rift nearby right now: the same 45-second ore pocket as a natural rift, from your ring. One call every
  90 s; it won't open during weather, a Wake, an awake boss or while a rift is open, and a refused call costs nothing.

## v1.9.78 — 2026-11-26
- No change in play yet: the next update is planned. Late on, Prisms pile up with nothing to buy, so the Nexus will
  grow a Lens that calls a rift where you stand, for a Prism price, in both modes.

## v1.9.77 — 2026-11-26
- Smoother Gyre fight. The awake Gyre's rim warning now glows with layered lines instead of a costly blur, so frames
  near the whirlpool stay closer to the rest of the Shoal. It looks the same: a sparking mint outline.

## v1.9.76 — 2026-11-26
- **Bosses complete (v1.9).** The Chart's second level now marks each boss lair you haven't found as a faint octagon
  on the minimap. A low two-note sting sounds when a boss wakes in Surge or when its first plate breaks in Drift.
  On a large world the ending card adds "Bosses n / 2" (beating them is still optional).
