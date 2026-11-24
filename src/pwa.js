// S-38 (D-103): register the offline worker (sw.js, network first). Skipped on file: (no service workers there) and on
// ?dev (a dev session always wants the files on disk, never a cached copy).
import { VERSION } from './config.js';

export function registerOffline() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:' || new URLSearchParams(location.search).has('dev')) return;
  navigator.serviceWorker.register(`sw.js?v=${VERSION}`).then(() => navigator.serviceWorker.ready).then(reg => {
    // Everything this page loaded came before the worker: hand it the list so it caches them now (same-origin only).
    const urls = [location.href, ...performance.getEntriesByType('resource').map(r => r.name)]
      .filter(u => new URL(u).origin === location.origin);
    reg.active && reg.active.postMessage({ warm: [...new Set(urls)] });
  }).catch(() => {}); // no worker = the game still runs online, exactly as before
}
