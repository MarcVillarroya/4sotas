// Captura de la variante `informacion.estado: pendiente` (build de fixtures, ficha temporal).
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const require = createRequire(resolve('../design/qa/package.json'));
const { chromium } = require('playwright');
const root = resolve('dist-fixtures');
const out = resolve('/home/mvf/4sotas/v2.2/qa');
const server = createServer(async (req, res) => {
  try {
    let p = new URL(req.url, 'http://x').pathname.slice('/4sotas'.length);
    if (p.endsWith('/')) p += 'index.html';
    const f = resolve(root, '.' + decodeURIComponent(p));
    res.setHeader('Content-Type', { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[extname(f)] || 'application/octet-stream');
    res.end(await readFile(f));
  } catch { res.writeHead(404); res.end('x'); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/4sotas`;
const b = await chromium.launch();
const path = '/oros/videos/qa-pendiente-fixture/';
const res = [];
for (const width of [1440, 390]) {
  const ctx = await b.newContext({ viewport: { width, height: width === 1440 ? 900 : 844 }, isMobile: width === 390, hasTouch: width === 390, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(base + path, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const d = await page.evaluate(() => {
    const sec = document.querySelector('#contexto');
    const honest = [...sec.querySelectorAll('p.honest')].map((p) => p.innerText.replace(/\s+/g, ' ').trim());
    return {
      contexto: sec.innerText.replace(/\s+/g, ' ').trim(),
      honest,
      listas: [...sec.querySelectorAll('ul li')].length,
      h3: [...sec.querySelectorAll('h3')].map((h) => h.textContent.trim()),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });
  await page.screenshot({ path: `${out}/pendiente-${width}.png`, fullPage: true });
  res.push({ width, ...d });
  await ctx.close();
}
console.log(JSON.stringify(res, null, 1));
await b.close(); server.close();
