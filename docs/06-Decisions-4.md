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
