// S-75 (D-207): the thumb arc. On touch the action buttons sit on arcs round the bottom-right corner, where the aiming
// thumb rests, most used innermost. `arcSlots` is pure (node-tested by tests/thumbarc.cjs); `layoutArc` applies it to
// the DOM at layout time only (resize / rotate, a button shown or hidden), never per frame.
export const ARC = { rMin: 180, rMax: 215, step: 56, chord: 54, edge: 30, box: 44, sep: 6, clear: 8, grip: 140 };
// Innermost first: ⟂ beam mode, ◎ Scanner, ✦ place, ◇ Echo order, ❖ call (S-75).
export const ARC_ORDER = ['mode-btn', 'scan-btn', 'beacon-btn', 'echo-btn', 'call-btn'];

const near = (x, y, k, pad) => x + ARC.box / 2 + pad > k.l && x - ARC.box / 2 - pad < k.r && y + ARC.box / 2 + pad > k.t && y - ARC.box / 2 - pad < k.b;

/** Up to `n` slot centres {x, y} on arcs round (w, h): inner radius R = clamp(min(w, h) / 2, 180, 215), then R + 56,
 *  then R + 112 for a slot still missing. Each arc starts at its top where x = w − 30 and steps down and left by a 54 px
 *  chord (boxes ≥ 6 px apart, B-111) while x ≥ w / 2 + 24 and y ≤ h − 30; a slot whose 44 px box comes within 8 px of a `keep` rect
 *  ({l, t, r, b}) is skipped, not stopped at. */
export function arcSlots(w, h, n, keep = []) {
  const R = Math.min(ARC.rMax, Math.max(ARC.rMin, Math.min(w, h) / 2)), out = [];
  for (let a = 0; a < 3 && out.length < n; a++) {
    const r = R + a * ARC.step;
    // Walk the arc in 0.5° steps; take the first point at least a 54 px chord past every slot so far whose box also
    // clears theirs by `sep` (a diagonal 54 px chord alone lets two square boxes overlap, B-111).
    for (let t = Math.asin(ARC.edge / r); out.length < n; t += Math.PI / 360) {
      const x = w - r * Math.sin(t), y = h - r * Math.cos(t);
      if (x < w / 2 + 24 || y > h - ARC.edge) break;
      if (y - ARC.box / 2 < ARC.clear) continue; // off the top on a very short screen
      if (out.some(o => Math.hypot(o.x - x, o.y - y) < ARC.chord || Math.max(Math.abs(o.x - x), Math.abs(o.y - y)) < ARC.box + ARC.sep)) continue;
      if (keep.some(k => near(x, y, k, ARC.clear))) continue;
      out.push({ x: Math.round(x), y: Math.round(y) });
    }
  }
  return out;
}

const box = el => { const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };

/** The rects the arc keeps clear (S-75): the Core Matrix button (measured even while hidden), the minimap, ♪ ≡, the
 *  bank panel and a reserved two-line hint box (w / 2 ± 150, h − 76 … h − 22) so a later hint never collides. */
export function keepRects(doc, w, h) {
  const $ = id => doc.getElementById(id), m = $('matrix-btn'), hid = m.classList.contains('hidden');
  if (hid) { m.style.visibility = 'hidden'; m.classList.remove('hidden'); }
  const out = [box(m)];
  if (hid) { m.classList.add('hidden'); m.style.visibility = ''; }
  for (const el of [$('minimap'), doc.querySelector('.top-right .buttons'), doc.querySelector('.top-left')]) if (el) out.push(box(el));
  out.push({ l: w / 2 - 150, r: w / 2 + 150, t: h - 76, b: h - 22 });
  return out;
}

/** The right / bottom safe-area insets (notch, home bar; B-112, audit 169), read from a hidden probe padded with env().
 *  Tests set the probe's padding inline to stand in for a notched phone. */
export function safeInsets(doc) {
  let p = doc.getElementById('safe-probe');
  if (!p) { p = doc.createElement('div'); p.id = 'safe-probe';
    p.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
      'padding-right:env(safe-area-inset-right,0px);padding-bottom:env(safe-area-inset-bottom,0px)';
    doc.body.appendChild(p); }
  const cs = getComputedStyle(p);
  return { r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0 };
}

/** Place the visible action buttons on the arc (touch), or clear the inline placement (mouse / keyboard). The arc turns
 *  round the safe corner (w − right inset, h − bottom inset), so no button sits under a notch or the home bar (B-112). */
export function layoutArc(doc, touch, w = innerWidth, h = innerHeight) {
  const btns = ARC_ORDER.map(id => doc.getElementById(id));
  if (!touch) { for (const b of btns) { b.style.left = b.style.top = ''; } return []; }
  const shown = btns.filter(b => !b.classList.contains('hidden'));
  const ins = safeInsets(doc), slots = arcSlots(w - ins.r, h - ins.b, shown.length, keepRects(doc, w, h));
  shown.forEach((b, i) => { const s = slots[i] || slots[slots.length - 1] || { x: w - 60, y: h - 200 };
    b.style.left = `${s.x - ARC.box / 2}px`; b.style.top = `${s.y - ARC.box / 2}px`; });
  return slots;
}
