# Archived decisions (word for word, superseded)

### D-015 — Glitches give up when rock blocks them (2026-11-23, S-6) — Superseded by D-017
A Glitch that hasn't gained 24 px on the core for 6 s fades out with no loot and frees its spawn slot. Measured: 37 of 38 live Glitches were stuck on rock and the spawn cap stayed full, so Surge went quiet.
- Rejected: A* pathing (costly per frame, and Glitches threading tunnels changes Surge's difficulty far more than one PR should); Glitches that bore through rock (that's M6's Burrower); a lower despawn distance (stuck Glitches sit 400–900 px away, inside any sane limit).

