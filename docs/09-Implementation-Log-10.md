# 09 — Implementation Log, part 10

Continues `09-Implementation-Log-9.md` (part 9 neared the 8 KB cap at session 77). Newest at the bottom; read the tail only.

## Session 78 — Build: S-41 adaptive graphics (v1.2.18, #85)
- `src/quality.js` (`Quality`: rolling p90 over 3 s of played frames, down > 24 ms, up < 18 ms for 10 s, bounce backoff
  ×2 ≤ 160 s; stalls > 1 s and paused frames reset). `renderer.setQuality(level)`: L1/L2 DPR 1 (canvas resized), L2
  draws every other particle (`q.rq`, fixed per particle), no-glow pickup sprites (`pn-`), unsmoothed light blit.
  Settings → Graphics cycles Auto / High / Low (`settings.graphics`, `clean()` → Auto). `window.__lumen.quality`.
- Measured: JS work per frame ~1 ms headless while the gap p90 was 33 ms (800×600 DSF 2), so the gap is sampled
  (D-109). Headless gaps: 1280×800 DSF 1 and 390×844 DSF 3 hold 16.7 ms; 800×600 DSF 2 p90 33 → 16.7 at L2.
- `tools/perf.cjs QUALITY=0|2` (Auto off), loot, 4× CPU, DSF 1: L0 mean 86.9 ms / p95 133 → L2 64.5 / 100;
  **L2 ÷ L0 = 0.74** (DPR saving not included at DSF 1).
- `tests/quality.cjs` (node + browser, in smoke): controller steps, p90 not mean, backoff, High/Low fixed; browser: title
  frames never step, slow draw → L1 (canvas 1600 → 800 px) → L2, fast → back up, button cycle saved, High holds under
  slow frames, saved Low / damaged value load, same seed + input at L0 and L2 → same stats / bank / position / enemies.
  Proved: with the sampling call removed, 3 browser checks fail.
- Observed: particles differ in count between runs by design (Math.random, D-025), so the determinism check leaves
  them out. Screenshots viewed: High vs Low at 640×400 DSF 2 (Low pickups plainer but read as ◆ / ▲).
