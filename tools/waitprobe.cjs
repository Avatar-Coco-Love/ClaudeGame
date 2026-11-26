// Audit 134 wait probe (not in smoke): a preload that logs every page.waitForFunction that times out, with its caller
// line, so a swallowed wait (`.catch(() => {})`) that can never pass shows up (B-097: touch.cjs lost 59 s to one).
// Usage: node -r ./tools/waitprobe.cjs tests/<x>.cjs   (or node tests/smoke.cjs with the same -r), then grep WAITTIMEOUT.
const pw = require('playwright');
const orig = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = async (...a) => {
  const b = await orig(...a);
  const wrapCtx = ctx => { const np = ctx.newPage.bind(ctx); ctx.newPage = async () => wrapPage(await np()); return ctx; };
  const wrapPage = pg => { const wf = pg.waitForFunction.bind(pg); pg.waitForFunction = (...x) => { const at = (new Error().stack.split('\n')[2] || '').trim(); const t = Date.now();
    return wf(...x).catch(e => { console.log(`WAITTIMEOUT ${Date.now() - t} ms ${at}`); throw e; }); }; return pg; };
  const nc = b.newContext.bind(b); b.newContext = async (...o) => wrapCtx(await nc(...o));
  const npb = b.newPage.bind(b); b.newPage = async (...o) => wrapPage(await npb(...o));
  return b;
};
