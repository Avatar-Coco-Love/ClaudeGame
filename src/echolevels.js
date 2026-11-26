// S-70 (D-185): Echo upgrades Focus / Volley / Tether, bought in the Research tab with Lumen once the Echo is researched.
// `game.echoLevels` { focus, volley, tether } 0…2 is saved; `echoStat` is the one place the numbers are read (config.js ECHO_LEVELS).
import { ECHO_LEVELS, ECHO_LEVEL_COST } from './config.js';

export const ECHO_ROWS = Object.keys(ECHO_LEVELS);
export const ECHO_MAX = ECHO_LEVEL_COST.length;
const ROW_OF = Object.fromEntries(ECHO_ROWS.flatMap(r => Object.keys(ECHO_LEVELS[r].stats).map(k => [k, r])));

const lvl = n => (Number.isFinite(n) ? Math.max(0, Math.min(ECHO_MAX, Math.floor(n))) : 0);
/** A saved `echoLevels` made whole: each row a level 0…ECHO_MAX; anything else 0 (B-037). */
export const validEchoLevels = o => Object.fromEntries(ECHO_ROWS.map(r => [r, lvl(o && typeof o === 'object' ? o[r] : 0)]));

/** The Echo's number for `key` (dmg / guardS / reach / guardPx) at its row's level, or at `at` when given. */
export function echoStat(game, key, at) {
  const row = ROW_OF[key];
  return ECHO_LEVELS[row].stats[key][at ?? lvl(game.echoLevels?.[row])];
}

export const echoLevelCost = (game, row) => (game.echoLevels[row] >= ECHO_MAX ? null : ECHO_LEVEL_COST[game.echoLevels[row]]);
export function canBuyEchoLevel(game, row) {
  const c = ECHO_ROWS.includes(row) && game.research.echo ? echoLevelCost(game, row) : null;
  return c !== null && game.bank.lumen >= c;
}
export function buyEchoLevel(game, row) {
  if (!canBuyEchoLevel(game, row)) return false;
  game.bank.lumen -= echoLevelCost(game, row);
  game.echoLevels[row] += 1;
  game.stats.upgrades++;
  game.audio.upgrade();
  if (game.motionOn()) game.coreRing = 1;
  return true;
}

const FMT = { focus: l => `× ${ECHO_LEVELS.focus.stats.dmg[l]}`, volley: l => `${ECHO_LEVELS.volley.stats.guardS[l]} s`,
  tether: l => `${ECHO_LEVELS.tether.stats.reach[l]} cells / ${ECHO_LEVELS.tether.stats.guardPx[l]} px` };
/** A row for main.js's upgradeRow: level pips 0…ECHO_MAX and "now → next" (MAX at the top). */
export const echoRowDef = row => ({ id: `echo-${row}`, name: ECHO_LEVELS[row].name, desc: ECHO_LEVELS[row].desc, max: ECHO_MAX, value: l => l, fmt: FMT[row] });
