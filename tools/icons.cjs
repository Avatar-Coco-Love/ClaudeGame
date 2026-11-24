// S-38 app icons, rendered once like og.png (D-044): the Nexus's three hexagons and its white heart on the game's dark
// background, no text. icon-192 / icon-512 fill the square; icon-maskable-512 keeps everything inside the 80 % safe
// circle that launchers may crop to. Usage: node tools/icons.cjs  (writes icons/*.png; commit the result)
const path = require('path');
const { chromium } = require('playwright');

const OUT = path.resolve(__dirname, '..', 'icons');
const draw = (size, fill) => `
<canvas id="c" width="${size}" height="${size}"></canvas>
<script>
  const c = document.getElementById('c'), ctx = c.getContext('2d'), s = ${size}, k = s / 2 * ${fill} / 66;
  ctx.fillStyle = '#03040c'; ctx.fillRect(0, 0, s, s);
  ctx.translate(s / 2, s / 2); ctx.scale(k, k);
  ctx.globalCompositeOperation = 'lighter'; ctx.shadowBlur = 16 * k;
  const rings = [ // same rings as render.js drawNexus, cycle-0 hue, standing still
    { r: 46, rot: 0.26, col: 'rgb(46, 242, 255)', a: 0.95, w: 3.5 },
    { r: 32, rot: -0.3, col: '#8a5cff', a: 0.95, w: 3 },
    { r: 62, rot: 0.1, col: '#ff4fd8', a: 0.55, w: 2.5 },
  ];
  for (const g of rings) {
    ctx.save(); ctx.rotate(g.rot); ctx.globalAlpha = g.a; ctx.strokeStyle = ctx.shadowColor = g.col; ctx.lineWidth = g.w;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI * 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * g.r, Math.sin(a) * g.r); }
    ctx.stroke(); ctx.restore();
  }
  ctx.shadowBlur = 0;
  const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 26);
  grd.addColorStop(0, 'rgba(255,255,255,0.95)'); grd.addColorStop(0.4, 'rgba(46,242,255,0.6)'); grd.addColorStop(1, 'rgba(46,242,255,0)');
  ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();
</script>`;

(async () => {
  const browser = await chromium.launch();
  for (const [name, size, fill] of [['icon-192.png', 192, 0.9], ['icon-512.png', 512, 0.9], ['icon-maskable-512.png', 512, 0.7]]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<style>body{margin:0;background:#03040c}</style>${draw(size, fill)}`);
    await page.locator('#c').screenshot({ path: path.join(OUT, name) });
    await page.close();
    console.log('wrote icons/' + name);
  }
  await browser.close();
})();
