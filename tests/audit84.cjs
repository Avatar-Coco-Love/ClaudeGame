// Audit 84 checks (browser). smoke.cjs calls browserChecks.
// Chunk pre-scale: terrain chunks are painted at zoom·dpr and blitted 1:1 (a scaled blit cost ~25 ms a frame at 4× CPU).
// B-080: a buff taken on a deposit's last frame lost its chip (the fading chips' flash overwrote it and nothing redrew it).
async function browserChecks(browser, url, check, errors) {
  const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  pg.on('pageerror', e => errors.push('audit84: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(300);
  const ch = await pg.evaluate(() => {
    const { renderer: R, game: g } = window.__lumen; g.demo = true;
    const k = R.zoom * R.dpr, sizes = [...R.chunks.values()].map(c => c.canvas.width);
    return { k, want: Math.ceil(16 * 32 * k) + 1, sizes: [...new Set(sizes)], n: sizes.length, max: R.maxChunks };
  });
  const { CHUNK, CELL } = await pg.evaluate(async () => { const c = await import('/src/config.js'); return { CHUNK: c.CHUNK, CELL: c.CELL }; });
  const want = Math.ceil(CHUNK * CELL * ch.k) + 1;
  check('audit 84: chunk canvases are pre-scaled to ceil(CHUNK_PX·zoom·dpr)+1 and the cache cap covers a view',
    ch.n > 0 && ch.sizes.length === 1 && ch.sizes[0] === want && ch.max >= 16, JSON.stringify({ ...ch, want }));
  await pg.evaluate(() => { const g = window.__lumen.game; g.buffs = ['ballast']; g.endedBuffs = ['overclock']; g.notify('buffs-end'); });
  await pg.waitForTimeout(900);
  const chips = await pg.evaluate(() => [...document.querySelectorAll('#buffs .chip')].map(c => c.title + (c.classList.contains('gone') ? ' (gone)' : '')));
  check('audit 84: a buff taken as another ends keeps its chip after the fade (B-080)',
    chips.length === 1 && /Ballast/.test(chips[0]) && !/gone/.test(chips[0]), JSON.stringify(chips));
  await pg.close();
}
module.exports = { browserChecks };
