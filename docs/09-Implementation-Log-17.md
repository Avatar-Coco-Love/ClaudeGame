# 09 — Implementation Log, part 17

Continues `09-Implementation-Log-16.md` (part 16 neared the 8 KB cap at session 117). Newest at the bottom; read the tail only.

## Session 118 — Build: S-56 Ward, M12 done (v1.7.59, D-154)
- `ward.js` (craft / place / pick up / `updateWards` / draw / minimap); `craft.js` place kind `ward` (⌖), Craft row,
  pick-up hint, save `craft.ward` + `wards` (format 22). `updateWards` runs after the beam, before the creatures'
  passes, so a Ward kill is processed the same frame. Lime sight ring + range ring near the core + shot line.
- As specced, `biomefoe.mjs --wards=2` (new flag: Wards hop to stay round the dig site) failed in the Kiln: Surge 1.066
  (a Ward finished each surfaced Burrower, its loot made the creature income). D-154: a Ward's kill pays no loot, only
  what was carried / eaten. After (8 seeds): Kiln 0.833 / 0.876, Shoal 0.889 / 0.883: PASS (≤ 1.00 each).
- Seen: the base Kiln gate on 4 seeds reads 0.800 / 0.916 (FAIL) on `main` too; the gate is defined on 8 seeds, where it
  still passes 0.866 / 0.905. The 4-seed Kiln sample is too small to gate on (not a bug; Ward test uses ≤ 1.00 only).
- Screenshot viewed: ⌖ sight in lime with its 4-cell dashed ring, a shot line to a mote, "Ward placed" toast.
- Smoke 562/562 (+15, `ward.cjs`: price, placement, refund, save + format, rate, range / line, nearest,
  bolt one-shot, Ward kill no loot, 160 world, Kiln Ward gate, Craft row, live place + shot; `relay.cjs` row list adds `ward`).
