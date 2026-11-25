// One static server + standalone runner for every test file (session 101; was pasted into 11 files, audit 99).
// createServer(): serves the repo (404 outside it). serve(): listens on a free port → { url, close }.
// runStandalone({ nodeChecks, browserChecks, browser, shot, pageErrors }): what `node tests/<x>.cjs` does alone:
// node checks, then (if `browser`) Chromium + browserChecks(browser, url, check, errors, shot), then exit 0/1.
// tests/docs.cjs fails if any other tests/*.cjs calls http.createServer, so the copies don't grow back.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

function createServer(root = ROOT) {
  return http.createServer((req, res) => {
    let p;
    try { p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html')); } catch { p = ''; }
    if (!p || !p.startsWith(root) || !fs.existsSync(p) || !fs.statSync(p).isFile()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  });
}

async function serve(root = ROOT) {
  const server = createServer(root);
  await new Promise(r => server.listen(0, r));
  return { server, url: `http://localhost:${server.address().port}/`, close: () => new Promise(r => server.close(r)) };
}

/** Same PASS/FAIL line format as smoke.cjs. Returns { check, failed() }. */
function reporter() {
  let failed = 0;
  const check = (name, ok, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
  return { check, failed: () => failed };
}

async function runStandalone({ nodeChecks, browserChecks, browser = true, shot, pageErrors = true } = {}) {
  const { check, failed } = reporter();
  try {
    if (nodeChecks) await nodeChecks(check);
    if (browser && browserChecks) {
      const { chromium } = require('playwright');
      const srv = await serve(), b = await chromium.launch(), errors = [];
      try { await browserChecks(b, srv.url, check, errors, shot); }
      finally { await b.close(); await srv.close(); }
      if (pageErrors) check('no page errors', errors.length === 0, errors.join(' | '));
    }
  } catch (e) { check('standalone run finished', false, e.stack || e.message); }
  process.exit(failed() ? 1 : 0);
}

module.exports = { ROOT, TYPES, createServer, serve, reporter, runStandalone };
