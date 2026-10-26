/** Exploración: inventario de enlaces y textos para diseñar los recorridos de QA V2-H. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';

const require = createRequire(resolve(process.env.QA_PACKAGE ?? '../design/qa/package.json'));
const { chromium } = require('playwright');
const root = resolve('dist');
const TIPOS = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!p.startsWith('/4sotas/')) throw Error('base');
    p = p.slice('/4sotas'.length);
    if (p.endsWith('/')) p += 'index.html';
    const f = resolve(root, '.' + p);
    if (!f.startsWith(root + '/')) throw Error('path');
    const b = await readFile(f);
    res.setHeader('Content-Type', TIPOS[extname(f)] || 'application/octet-stream');
    res.end(b);
  } catch { res.writeHead(404); res.end('nf'); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/4sotas`;
await mkdir(resolve('qa/v2-h'), { recursive: true });
const browser = await chromium.launch({ headless: true });
const rutas = ['/', '/oros/', '/oros/videos/', '/oros/videos/irpf-en-la-nomina/', '/oros/guias/tramos-irpf-y-retencion/', '/oros/herramientas/interes-compuesto/'];
for (const width of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
  const page = await ctx.newPage();
  for (const r of rutas) {
    await page.goto(base + r, { waitUntil: 'load' });
    const info = await page.evaluate(() => {
      const vis = (el) => { const b = el.getBoundingClientRect(); return { top: Math.round(b.top + scrollY), h: Math.round(b.height), w: Math.round(b.width) }; };
      const header = [...document.querySelectorAll('header a, header summary, header button')].map((a) => ({ t: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40), href: a.getAttribute('href'), ...vis(a) }));
      const footer = [...document.querySelectorAll('footer a')].map((a) => ({ t: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40), href: a.getAttribute('href'), ...vis(a) }));
      const body = [...document.querySelectorAll('main a')].map((a) => ({ t: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50), href: a.getAttribute('href'), ...vis(a) }));
      const doc = document.documentElement.scrollHeight;
      return { doc, header, footer, body, h1: document.querySelector('h1')?.textContent.trim().slice(0, 80) };
    });
    console.log(`\n=== ${width} ${r} · doc=${info.doc} · h1=${JSON.stringify(info.h1)}`);
    console.log('HEADER', JSON.stringify(info.header));
    if (r === '/') console.log('FOOTER', JSON.stringify(info.footer));
    console.log('MAIN', JSON.stringify(info.body.slice(0, 40)));
  }
  await ctx.close();
}
await browser.close();
server.close();
