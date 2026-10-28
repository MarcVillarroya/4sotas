// Peticiones externas de la ficha nueva y de la videoteca (privacidad y fachada).
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const require = createRequire(resolve('../design/qa/package.json'));
const { chromium } = require('playwright');
const root = resolve('dist');
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
const out = [];
for (const path of ['/oros/videos/sp500-4-de-cada-10-euros-a-10-posiciones/', '/oros/videos/']) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const ext = [];
  page.on('request', (r) => { if (!r.url().startsWith(base) && !r.url().startsWith('data:')) ext.push(r.url()); });
  await page.goto(base + path, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  out.push({ path, externas: ext, iframes: await page.locator('iframe').count(), imagenes: await page.locator('img').count() });
  await ctx.close();
}
console.log(JSON.stringify(out, null, 1));
await b.close(); server.close();
