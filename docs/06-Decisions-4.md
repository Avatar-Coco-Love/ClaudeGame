# 06 — Decisions log, part 4

Continues `06-Decisions-3.md` (same rules: supersede, never edit; list rejected alternatives). D-037 on.

### D-037 — Recorded audio: measured shortlist, owner picks by ear (2026-11-23, inbox session 23, supersedes D-014)
The owner's first play-test called the beam hum "very annoying" (B-016). D-014 kept synthesized audio because a session can't listen;
that still holds, but the owner can. So: sessions **measure**, the owner **chooses among options**, never designs.
- **Now:** the synth beam is fixed by measurement (`tests/audio.cjs` renders it offline and holds a loudness/harshness ceiling).
- **When the owner drops a pack** into `docs/inbox/` (suggested: Kenney "Sci-Fi Sounds" + "Digital Audio", already .ogg, CC0):
  a session measures every file (RMS, peak, spectral centroid, energy > 2 kHz, attack/decay, loop seam), shortlists 2–3 per game
  sound, and ships a small audition page (`audition.html`, not linked from the game). The owner's picks then land in one Build PR.
- **Licence:** CC0 only. Each file's pack, original name and URL go in `assets/audio/CREDITS.md`. Nothing else ships.
- **Budget:** ≤ 1.5 MB for all of `assets/audio/`, ≤ 200 KB per file, mono, 44.1 kHz. A smoke check enforces both once the folder exists.
- **Format:** .ogg only (Vorbis). Older Safari (iOS before 17-18) can't decode Ogg Vorbis, so each sound keeps its synth version:
  if `fetch` + `decodeAudioData` fails, that sound plays the synth tone. No .m4a/.mp3 copies (doubles the binary size for a shrinking
  set of devices). Loading is plain `fetch`, so no runtime dependency and no build step.
- **Sessions never download audio** themselves: the files come from the owner, so the licence trail starts with a person.
- Rejected: keeping D-014 as is (the owner has ears and offered them); a session picking files by numbers alone (loud/soft can be
  measured, "annoying" can't); shipping .ogg + .m4a pairs (2× size, two files per sound to keep in sync); CC-BY packs (attribution
  UI and per-file licence drift for little gain over CC0).

### D-038 — The beam hum is a quiet bed, not a drone (2026-11-23, inbox session 23, B-016)
The hum is a low-passed triangle (2× the ring pitch, 700 Hz cut, no vibrato) that swells for 40 ms, then settles to a bed at
gain 0.004, or 0.007 while the beam touches a cell or Glitch (`BEAM_HUM` in `config.js`). The S-4 switch-on sweep stays.
- Rejected: no hum at all (the beam loses its "on" cue between break sounds); keeping the sawtooth and only turning it down
  (its buzz is what the 2 kHz measure flags); a noise-based crackle per hit (busier, and the break sounds already mark progress).

### D-039 — Sounds that repeat fade; no square waves (2026-11-23, audit 24, B-017/B-018; refines D-021's tick)
A deposit run's ticks each play at 0.8× the last and stop below gain 0.015 (~10 ticks, ~0.7 s), at most one per 70 ms; a gap of
0.3 s starts a new run. The bank still counts up per unit and the closing arpeggio still plays. Hurt and Glitch death use
triangles. `tests/audio.cjs` holds every one-shot to peak ≤ −20 dBFS, < 1 % energy above 4 kHz, ≤ 0.5 s above −45 dBFS.
- Rejected: dropping the tick entirely (a small deposit loses its feedback); a fixed cap of N ticks at full level (ends abruptly
  mid-stream); low-pass filters on every tone (more nodes per sound; a triangle already removes the buzz); one tick per resource
  kind (the bank's count-up already shows that, D-021).

### D-040 — The ping's cache tone is timed by game time, not scheduled audio (2026-11-23, build 25, S-12)
`updateScan` plays `audio.scanCache()` (784 Hz sine, 0.16 s, gain 0.07: peak −32.4 dBFS, 15 % of the ping's energy, 0 % > 2 kHz)
on the frame the ring's age passes a cache mark, only if that cache is still unopened. Reduced motion (no ring) plays it at once.
- Rejected: scheduling the tone with an audio delay at ping time (it would still play while paused or after the cache was mined
  before the ring arrived); replaying the full cache chord (it is the kit's loudest sound and means "opened", not "found").

### D-041 — Beam modes live in `src/beam.js`; rays dedupe per cell and per Glitch (2026-11-23, build 26, S-13)
`BEAM_MODES` in config holds each mode's ray offsets, range and damage multipliers; `castBeam` casts every ray from the core's
centre shifted sideways (so a Wide side ray beside a wall cuts that wall: the hall really is 3 cells wide) and applies damage once
per cell and once per Glitch per frame. `beam.ex/ey/target/enemy` stay the centre ray's. Q / ⟂ cycles unlocked modes only, with a
1-word toast and a 520 Hz 0.06 s click (peak −33.7 dBFS, the kit's quietest). A saved mode that isn't unlocked loads as Focus.
- Rejected: side rays starting at the nose (they skip the cells beside the core, leaving a ragged 1–3 cell hall); summing damage
  when two rays hit one cell (diagonal aim would beat Focus on single cells, against D-036); a mode label on the ⟂ button (the toast
  and the 3 beams already say it; the button stays narrow at 320 px). _(Superseded by D-065: ⟂ names the mode since S-17.)_

### D-042 — Wide stays as tuned; Pulse trades throughput for reach (2026-11-23, design 27, Q-011 first look; retunes D-036's S-14)
Measured per mode (`MODE=` on the probes, `09` session 27): Focus reaches Lumen ~1.9× faster and hunts Prisms 1.6× faster; Wide
harvests crystal ground +12 % ◆/min and picks up more side ore; Surge kills are about equal (Wide slightly worse). Neither wins
everywhere, so Wide is not retuned. S-14 as written (burst ×1.3, no recovery) would tunnel at 1.3× Focus with 1.5× reach and pierce,
winning everywhere, so `PULSE_MUL` is 1.0 and a 0.3 s `PULSE_RECOVER_S` follows each release (~0.8× Focus sustained). Q-011 stays
open until Pulse is measured.
- Rejected: buffing Wide (it already wins its niche; more would push Focus out of ore fields); keeping ×1.3 and shortening Pulse's reach
  instead (reach is Pulse's identity: Surge players hit from farther away); a heat/overcharge meter (a second system for one mode).

### D-043 — Beacons are the first Crafting item: Prisms, placed light, same in both modes (2026-11-23, design 27, S-16)
A Beacon costs 5▲ (spare Prisms after Core Matrix + Radiance are ~1100▲; 20 beacons = 100▲), is crafted into a stock of 3 and
placed on the core's open cell, ≥ 4 cells apart, outside the Nexus ring, at most 20. It lights 140 px for good and shows on the
minimap. Glitches ignore it. It follows the throttled perf check (S-15), which prices 20 extra light holes first.
- Rejected: Shards as the cost (the Core Matrix already takes ~90 % of a world's ◆); beacons that repel Glitches (a Surge-only perk,
  D-002); a Nexus Development upgrade instead (Nexus upgrades grow the hub; placed items are Crafting, `01`); pick-up/move in v1 (needs
  a hold gesture on touch; cheap to add later if play-tests miss it).

### D-044 — Projects page card: a real frame, served from this site, dark neon in both themes (2026-11-24, session 28, inbox; file pointer corrected by D-111)
The share image is `og.png` (1200×630): a real frame of seed 7 (the Nexus, an east tunnel, the beam cutting), HUD hidden, no paint-over.
It lives here and is this page's `og:image`; the Projects card links to it, so a better frame later updates both. `tests/share.cjs`
checks the meta and the size. The card (`docs/projects-card.html`) is `.card.core`: near-black, cyan title, violet `.go`, in both page
themes; text says what it is and that it is in progress. Session 28 could not reach the Projects repo, so applying it is in `04` (M8).
- Rejected: a drawn or composed poster (not a real frame; the note asked for one); the Prism-field frame (busier, no Nexus to read
  as "home"); following the page's light theme (a pale card hides neon geometry, pillar 1); a copy of the image in the Projects repo (two
  files to keep in sync).
