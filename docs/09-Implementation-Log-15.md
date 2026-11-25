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

## Session 108 — Build: S-52 Nexus Chart, M11 done (v1.6.49, format 21, D-143)
- `src/chart.js` (new, 86 lines): `drawChartMarks` from `hud.js` under the placed marks; Chart row in `NEXUS_UPGRADES`
  (`kiln` flag), `buyNexus` charges every kind, save step 20 → 21 (`nexus.chart: 0`), load clamp.
- `tests/chart.cjs` (7 checks, smoke): exact prices / no third / 160 refuses; arrows = explored flowing Shoal chunks in
  the window, along the flow, length ∝ speed, re-check after 0.5 s; vents only seen, tell dots larger; ≤ 3 draw calls;
  format 20 → 21 + clamp; browser: row in 256 (buy charges ≈24 ▲10), none in 160, charted minimap draws in play.
- Screenshot viewed (minimap ×3 at d 102): mint arrows in the Shoal band were faint at 0.85 alpha on its mint rock tint;
  raised to full alpha, 1.5 px. Warm vent dots read on the Kiln's brown. No bugs found.

## Session 109 — Audit: vent tell tone, Chart dev toggle, Shoal / Kiln in 08, 09 archive (v1.6.50, D-144)
- No subagent tool in this session: sweeps done in-session (correctness on S-50…S-52, phone sheets, docs drift).
- Fixed debt carried since audit 99: vents had no sound. A vent ≤ 5 cells away now plays `audio.ventTell` once per
  cycle at its tell, modes alike; `vent.cjs` check fails on the old code (proved: stash), `audio.cjs` measures it
  −33.7 dBFS peak, 0 % > 2 kHz, loud 0.1 s (ceiling −28).
- Chart: arrows ignored the dev `undertow.off` toggle (vents honour `vents.off`); now hidden too. No player impact.
- Phones (probe, 320×568, 360×640, 568×320, 640×360, touch): Nexus tab with the Chart row at L0 / L1 and the Craft
  tab with the Sink row: no row past the sheet, no page scroll. 320 Nexus shot viewed: `▲10 ⬟24` fits beside the text.
- **B-090** (fixed): full smoke read the d 100 / d 30 draw ratio 1.54× (alone 0.99, 1.03). New World's seed is random;
  6 pinned seeds read 0.72–0.99×. The test now pins 1073741824 (1.00–1.02× ×4); the 1.3× bound is unchanged.
- D-137…D-143 checked against the code: match (topLevel / matrixCost, `kiln` row clamp, `sinkMul` on gain only).
- Docs: Shoal / Kiln lines moved word for word from `02` (8185 B, at cap) to `08`; `09` sessions 99–103 archived
  word for word (part 13 removed). Workflow review (D-138): the last three audits had no subagent tool and the vent
  sound waited two audits, so `CLAUDE.md` says how to sweep in-session and to fix twice-carried debt first (D-144).
  Too much: the full smoke now runs > 10 min (logged as debt). Too little: perf re-measures (none since audit 94).
- Smoke 517/517 (+2: vent tell, its `audio.cjs` ceiling). A first full run read B-090; baseline on `main` 515 checks.
