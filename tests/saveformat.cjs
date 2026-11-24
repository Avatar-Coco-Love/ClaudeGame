// Save-format guard (audit 49, H5). Pinning SAVE_FORMAT to a number in a test broke twice (craft.cjs at audit 44,
// spire.cjs at audit 49): the next format bump fails an unrelated check. Rule (CLAUDE.md "a rule broken twice gets a check"):
// tests and tools compare against SAVE_FORMAT, never a literal; and save.js holds one upgrade step per format.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// `SAVE_FORMAT === 10`, `10 === SAVE_FORMAT`, `up.v === 10`, `.v == 9`: a pinned current format. `{ v: 9 }` (an OLD save) is fine. (pin-ok)
const PIN = /SAVE_FORMAT\s*[!=]==?\s*\d|\d\s*[!=]==?\s*SAVE_FORMAT|\.v\s*[!=]==?\s*\d/;

function pins() {
  const files = ['tests', 'tools'].flatMap(d => fs.readdirSync(path.join(ROOT, d)).filter(f => /\.(c|m)?js$/.test(f)).map(f => d + '/' + f));
  const hits = [];
  for (const f of files) fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n').forEach((l, i) => {
    if (PIN.test(l) && !l.includes('pin-ok')) hits.push(`${f}:${i + 1}`);
  });
  return { files: files.length, hits };
}

async function nodeChecks(check) {
  const p = pins();
  check('no test or tool pins SAVE_FORMAT to a number (H5, audit 49)', p.hits.length === 0 && p.files > 10, p.hits.join(', ') || `${p.files} files`);

  const { upgradeSave, SAVE_FORMAT, STEPS } = await import('../src/save.js');
  const { Game } = await import('../src/game.js');
  const audio = new Proxy({}, { get: () => () => {} });
  // The oldest save shape (format 1: no `v`, no later fields) walks every step to the current format and loads.
  const s = new Game({ seed: 5, mode: 'drift', audio }).toSave(), old = { seed: s.seed, mode: s.mode, explored: s.explored, broken: s.broken,
    bank: s.bank, cargo: s.cargo, upgrades: s.upgrades, player: s.player };
  let up = null, err = '';
  try { up = upgradeSave(JSON.parse(JSON.stringify(old))); new Game({ seed: 5, mode: 'drift', audio, save: up }); } catch (e) { err = e.message; }
  check('one upgrade step per format; a format-1 save upgrades to SAVE_FORMAT and loads (D-005, H5)',
    STEPS.length === SAVE_FORMAT - 1 && !err && up && up.v === SAVE_FORMAT, `${STEPS.length} steps, format ${SAVE_FORMAT}, upgraded to ${up && up.v} ${err}`);
}

module.exports = { nodeChecks, PIN };
