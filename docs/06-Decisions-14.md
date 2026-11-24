# 06 — Decisions log, part 14

Continues `06-Decisions-13.md` (same rules: supersede, never edit; list rejected alternatives). D-102 on.

### D-102 — S-37 Anomalies found as built; M7 ✅, v1.2.11 (2026-11-24, session 71, Build; implements D-098)
- **Seen** = the site's cell is set in `world.explored` (the minimap's own bit): derived, so no save change (format stays
  15). `siteMapState` → null / charged (filled dot, kind colour) / recharging (hollow); a void site never shows.
- **Ping:** `anomalyScanMarks` adds charged sites within `SCAN_RADIUS` to the ping's marks (`type: 'anomaly'`, upright
  hexagram glyph, kind-coloured minimap blip); `markAlpha` drops a mark once its site is taken. No cache tone for them.
- **End tone** `anomalyEnd()`: the take tone falling, 0.35 s after the deposit chime (peak -36 dBFS, 0 % > 2 kHz).
- **Hint:** the hint line (lowest priority, above "Cyan crystal veins"), not a toast: shown while a charged site is in
  the core's light, until the first take of the session. A toast (tried) queued in front of milestone toasts and broke
  the S-20 "Spire primed" check (`spirefeed.cjs`); a plain toast could still delay a milestone by up to 3 s.
- **VERSION 1.2.11:** minor 2 = M7 shipped; the PR count keeps counting (as 1.1.6 did), not "1.2.0" as `02` said.
- Rejected: a saved "seen" list per site (the explored bit already says it); pinging taken sites as hollow (the spec
  says the ping is for charged ones; the minimap already shows recharging ones).
