import { defaultKeys, eventCode } from './keys.js';

// Input -> intent. Produces device-agnostic intent each frame:
//   move: {x,y} in [-1,1] (analog), aim: {x,y} unit vector or null, fire: bool, plus one-shot actions.
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, down: false, active: false };
    this.sticks = { move: null, aim: null }; // touch sticks: {id, ox, oy, x, y}
    this.pressed = new Set(); // one-shot actions consumed by game
    // A phone gets touch hints before its first touch (B-002); a mouse move or touch flips it later.
    this.usingTouch = !!globalThis.matchMedia?.('(pointer: coarse)').matches;

    // S-39 (D-106): bindings are physical codes (KeyW is Z on AZERTY), action -> code; main.js shares settings.keys here.
    this.bindings = defaultKeys();
    this.capture = null; // Settings "press a key": takes the next keydown's code instead of the game
    addEventListener('keydown', e => {
      if (e.target instanceof HTMLInputElement) return;
      const code = eventCode(e);
      if (this.capture) { e.preventDefault(); e.stopImmediatePropagation(); const f = this.capture; this.capture = null; f(code); return; }
      if (!this.keys.has(code)) {
        const act = Object.keys(this.bindings).find(a => this.bindings[a] === code);
        // Enter on a focused button is that button's click, not a Core Matrix toggle (B-003).
        if (act === 'matrix' || ((code === 'Enter' || code === 'NumpadEnter') && !(e.target instanceof HTMLButtonElement))) this.pressed.add('matrix');
        if (code === 'Escape') this.pressed.add('escape');
        // map (D-191); mute; scan (S-11, ignored until unlocked); beamMode (S-13); place (S-16, refused with a toast when there is none); echoOrder (S-43); call (S-63)
        if (act === 'mute' || act === 'scan' || act === 'beamMode' || act === 'place' || act === 'echoOrder' || act === 'call' || act === 'map') this.pressed.add(act);
      }
      this.keys.add(code);
      if (code === this.bindings.mine || code === 'Space' || code.startsWith('Arrow')) e.preventDefault();
    });
    addEventListener('keyup', e => this.keys.delete(eventCode(e)));
    // Leaving the page drops every held input, touch sticks included: a phone may never send touchend while hidden.
    addEventListener('blur', () => this.release());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.release(); });

    canvas.addEventListener('mousemove', e => {
      this.mouse.x = e.clientX; this.mouse.y = e.clientY; this.mouse.active = true; this.usingTouch = false;
    });
    canvas.addEventListener('mousedown', e => { if (e.button === 0) this.mouse.down = true; this.mouse.active = true; });
    addEventListener('mouseup', e => { if (e.button === 0) this.mouse.down = false; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    const opts = { passive: false };
    canvas.addEventListener('touchstart', e => this.onTouchStart(e), opts);
    canvas.addEventListener('touchmove', e => this.onTouchMove(e), opts);
    canvas.addEventListener('touchend', e => this.onTouchEnd(e), opts);
    canvas.addEventListener('touchcancel', e => this.onTouchEnd(e), opts);
  }

  onTouchStart(e) {
    e.preventDefault();
    this.usingTouch = true;
    this.mouse.active = false;
    for (const t of e.changedTouches) {
      const side = t.clientX < innerWidth / 2 ? 'move' : 'aim';
      if (!this.sticks[side]) this.sticks[side] = { id: t.identifier, ox: t.clientX, oy: t.clientY, x: t.clientX, y: t.clientY };
    }
  }
  onTouchMove(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      for (const s of Object.values(this.sticks)) {
        if (s && s.id === t.identifier) { s.x = t.clientX; s.y = t.clientY; }
      }
    }
  }
  onTouchEnd(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      for (const k of Object.keys(this.sticks)) {
        if (this.sticks[k] && this.sticks[k].id === t.identifier) this.sticks[k] = null;
      }
    }
    // S-17 second finger: a stick whose touch lifted adopts another live touch on its half (not the other stick's), from where it is now.
    for (const side of ['move', 'aim']) {
      if (this.sticks[side]) continue;
      const other = this.sticks[side === 'move' ? 'aim' : 'move'];
      for (const t of e.touches || []) {
        if (other && other.id === t.identifier) continue;
        if (t.target !== this.canvas) continue; // B-030: a finger on a HUD button lifts there; the canvas never hears it
        if ((t.clientX < innerWidth / 2 ? 'move' : 'aim') !== side) continue;
        this.sticks[side] = { id: t.identifier, ox: t.clientX, oy: t.clientY, x: t.clientX, y: t.clientY };
        break;
      }
    }
  }

  // B-032: a release is a cancel, not a let-go: the next read() says so, so a Pulse charge drops unfired (D-042).
  release() { this.keys.clear(); this.mouse.down = false; this.sticks.move = this.sticks.aim = null; this.dropped = true; }

  static STICK_RADIUS = 56;

  stickVector(s) {
    if (!s) return { x: 0, y: 0, mag: 0 };
    let dx = s.x - s.ox, dy = s.y - s.oy;
    const len = Math.hypot(dx, dy);
    const R = Input.STICK_RADIUS;
    if (len > R) { // drag the origin along so the stick never feels "stuck" at the rim
      s.ox = s.x - (dx / len) * R; s.oy = s.y - (dy / len) * R;
      dx = s.x - s.ox; dy = s.y - s.oy;
    }
    const mag = Math.min(1, Math.hypot(dx, dy) / R);
    return { x: dx / R, y: dy / R, mag };
  }

  /** screenPlayer: the core's screen position (for mouse aim). */
  read(screenPlayer) {
    let mx = 0, my = 0;
    const b = this.bindings, held = (a, arrow) => this.keys.has(b[a]) || this.keys.has(arrow);
    if (held('left', 'ArrowLeft')) mx -= 1;
    if (held('right', 'ArrowRight')) mx += 1;
    if (held('up', 'ArrowUp')) my -= 1;
    if (held('down', 'ArrowDown')) my += 1;
    const mv = this.stickVector(this.sticks.move);
    if (mv.mag > 0.12) { mx = mv.x; my = mv.y; }
    const mlen = Math.hypot(mx, my);
    if (mlen > 1) { mx /= mlen; my /= mlen; } // diagonals don't exceed cardinal speed

    let aim = null, fire = false;
    const av = this.stickVector(this.sticks.aim);
    if (this.sticks.aim && av.mag > 0.2) {
      const l = Math.hypot(av.x, av.y);
      aim = { x: av.x / l, y: av.y / l };
      fire = av.mag > 0.35;
    } else if (this.mouse.active && screenPlayer) {
      const dx = this.mouse.x - screenPlayer.x, dy = this.mouse.y - screenPlayer.y;
      const l = Math.hypot(dx, dy);
      if (l > 1) aim = { x: dx / l, y: dy / l };
      fire = this.mouse.down;
    }
    if (this.keys.has(b.mine)) fire = true;
    const cancel = !!this.dropped; this.dropped = false;
    return { move: { x: mx, y: my }, aim, fire, cancel };
  }

  consume(action) {
    if (this.pressed.has(action)) { this.pressed.delete(action); return true; }
    return false;
  }
}
