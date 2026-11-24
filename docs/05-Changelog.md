# 05 — Changelog

One entry per merged PR, newest first. Version = `<major>.<minor>.<PR count>` (D-046: minor = milestones shipped; 1.0 = M5; D-105: patch = PRs since 1.0.0). `VERSION` in `src/config.js` must match the top entry
(`tests/docs.cjs` enforces it). Write for a player: what changed on screen, not how it was coded. Detail lives in `09`.

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

## v1.2.22 — 2026-11-24 (#89)
- **Plan, no gameplay change.** A play-test of the Echo and the phone layout found nothing to fix; the Echo keeps its
  strength. The Echo milestone is marked done. Next up: a quiet ambient music bed that follows depth and mode, with its
  own Music slider. Recorded sound effects now wait for the audio pack without holding anything else back.

## v1.2.21 — 2026-11-24 (#88)
- **New: Echo orders.** Press R (or tap ◇ on a phone) to switch your Echo between **Gather** (mine exposed ore) and
  **Guard**: it stays at your side and fires a short bolt at the nearest Glitch or Spitter bolt within reach, about one
  shot a second (three bring down a near Glitch). A chip under your cargo shows the order; in Drift it reads "Guard (idle)".
  Your choice is saved; the key can be rebound in Settings → Keys.

## v1.2.20 — 2026-11-24 (#87)
- **New: the Echo** (Research, 30 ●). A small hollow diamond, a lesser core, follows you on a faint tether, finds its
  way round bends, and blinks back to your side if it gets stuck. While you move or aren't mining, it mines exposed
  Shard, Prism and Lumen cells near you (never rock) at half your beam's power; the yield drops for your Attractor.
  It rests inside the Nexus ring and stops while your cargo is full.

## v1.2.19 — 2026-11-24 (#86)
- **Fixes:** a damaged save no longer stops the game from starting (it now starts fresh instead of freezing on a black
  screen); the "NEXUS" label on the pointer is centred again; the Craft, Wide Beam and Scanner messages name the key you
  actually bound. **Auto graphics** no longer drops to Low on a phone in battery saver, where it couldn't help.
- **Large text on small phones:** the Core Matrix button stays on one line, the four Matrix tabs sit in two rows instead of
  spilling off the sheet, the hint wraps; the Volume slider is a full-size touch target.

## v1.2.18 — 2026-11-24 (#85)
- **Smoother on slow devices:** a new **Graphics** setting (Auto / High / Low). On Auto the game watches its own frame
  rate while you play and, if it struggles, draws at a lower resolution, then with half the spark particles, plainer
  pickups and a softer light edge; it steps back up once frames are quick again. High and Low hold one look. The game
  itself plays exactly the same at every setting.

## v1.2.17 — 2026-11-24 (#84)
- Planning only, nothing changes in play yet: a companion is coming. After this polish milestone the **Echo**, a small
  diamond that follows your core through the tunnels and takes one of two orders (gather ore or guard you), will be
  unlocked with Lumen in Research.

## v1.2.16 — 2026-11-24 (#82)
- **Easier to read:** no text during play is smaller than 12 px now (cargo and integrity numbers, labels, buff chips,
  key badges). Settings → **Large text** makes every word 20 % bigger and still fits on the smallest phones.
- Colours checked for colour-blind players: the three Anomaly kinds stay apart under every common type; Shards and
  Prisms, which look alike to some, keep their different shapes (◆ ▲).

## v1.2.15 — 2026-11-24 (#81)
- **Keys that fit your keyboard:** controls now follow key positions, so on AZERTY the move keys are Z Q S D where W A S D
  sit. Settings → Keys lets you rebind move, mine, Core Matrix, Scanner, beam mode, place and mute: tap a row, press a
  key (Esc cancels; taking a key another action uses swaps them). Badges, hints and the title line show your keys.

## v1.2.14 — 2026-11-24 (#80)
- **Fixes from a health check:** the installed app now opens offline even if you only ever visited through a shared
  link; an Anomaly beside a Relay no longer hands you a buff that the deposit you are making ends a moment later;
  floor loot draws faster when lots of it is on screen; on landscape phones messages no longer clip the bank panel
  when three Anomaly buffs show; the game fills the screen properly in mobile Safari; the hint now says "fly into it".

## v1.2.13 — 2026-11-24 (#79)
- **Install it, play it offline:** Lumen Core can be added to your home screen or installed as an app, with its own
  glowing Nexus icon. After one visit online it also opens and plays with no connection; online, you always get the
  newest version.

## v1.2.12 — 2026-11-24 (#78)
- **Behind the scenes:** a design pass. Anomalies were play-tested in both modes and on phones (no changes needed),
  and the last milestone is planned: play offline as an installed app, keys that work on any keyboard layout and can be
  rebound, larger readable text, and smoother frames on slower phones.

## v1.2.11 — 2026-11-24 (#77)
- **Anomalies, found:** once you've lit an Anomaly's cell it stays on the minimap as a dot in its colour (hollow while
  it recharges), and a Scanner ping now shows the charged ones within reach. A soft falling tone marks a buff ending at
  a deposit, and the first time one glows in your light the hint line says what to do. M7 is complete: v1.2.

Older entries: v1.0.0–v1.1.10 in `archive/changelog-v1.0.0-v1.1.10.md`, v0.4.59–v0.4.64 in `archive/changelog-v0.4.59-v0.4.64.md`, v0.4.54–v0.4.58 in `archive/changelog-v0.4.54-v0.4.58.md`, v0.2.48–v0.2.53 in `archive/changelog-v0.2.48-v0.2.53.md`, v0.2.43–v0.2.47 in `archive/changelog-v0.2.43-v0.2.47.md`, v0.2.39–v0.2.42 in `archive/changelog-v0.2.39-v0.2.42.md`, v0.2.34–v0.2.38 in `archive/changelog-v0.2.34-v0.2.38.md`, v0.1.27–v0.1.33 in `archive/changelog-v0.1.27-v0.1.33.md`, v0.1.22–v0.1.26 in `archive/changelog-v0.1.22-v0.1.26.md`, v0.1.17–v0.1.21 in `archive/changelog-v0.1.17-v0.1.21.md`, v0.1.10–v0.1.16 in `archive/changelog-v0.1.10-v0.1.16.md`, v0.1.1–v0.1.9 in `archive/changelog-v0.1.1-v0.1.9.md`.
