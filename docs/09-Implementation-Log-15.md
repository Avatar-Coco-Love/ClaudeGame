# 09 — Implementation Log, part 15

Continues `09-Implementation-Log-14.md` (part 14 neared the 8 KB cap at session 106). Newest at the bottom; read the tail only.

## Session 107 — Design: Kiln play-test, M12 specs S-53…S-56 (v1.5.48, D-142)
- Kiln dig probe (scratch, 3 seeds, 3-wide DENSE strip, Drift = Surge): 60 s at beam 8: 39 cells, 16 % overheat; with
  one Sink at the start 39–40 cells, 14 %; at max + 2 (beam 10) 43 cells; + Sink 43, 12–14 %. Overdrive pays ~+10 %
  cells in a dig (beam is not the only limit: moving into each cleared cell). The Sink barely helps a straight dig (the
  core leaves its 5 cells in ~15 s); in place it holds the spec's 16 → ~7 % (session 106). No tune; noted in D-142.
- Surge probe (auto-aim bot standing in an 11×11 room, 120 s, 4 seeds): damage taken at mid build 128–184 (Deep) and
  32–184 (Kiln) with 0–1 deaths; at base max and max + 2: **0 in both rings**. Glitch tier caps at 3 (d 84) → Q-029.
- Browser play (1000×700, Surge, max + 2, Sink placed, 25 s firing in the Kiln): heat rose 5 %/s in the Sink's field
  (0.4 / 8 s, as specced), 2–3 Glitches around, integrity stayed 340/340, no page errors. Screenshot viewed: lilac Sink
  pentagon under the core with its dashed 5-cell ring, 288 px beam down a 9-cell tunnel, Calx ⬟ cells clearly lilac.
- Specs: `07-Build-Specs-12.md` (S-53 Burrower, S-54 Mote swarm, S-55 Arc beam, S-56 Ward node; M12 → v1.7), `04-Roadmap-3`
  M12 rewritten, Q-029 added. No spec split (D-139 rule 2: each is usable alone). Next: S-52 (session 108, Build).
