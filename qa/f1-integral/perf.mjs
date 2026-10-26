// Medición de laboratorio (Chromium local, sin red real): LCP, CLS, peso y peticiones.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = process.argv[2] ?? 'dist';
const BASE = '/4sotas';
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!p.startsWith(BASE)) { res.writeHead(404).end('x'); return; }
  p = p.slice(BASE.length) || '/';
  let f = join(root, p);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) f = join(root, p + '/index.html');
  if (!existsSync(f)) { res.writeHead(404).end('x'); return; }
  res.writeHead(200, { 'content-type': TIPOS[extname(f)] ?? 'application/octet-stream' }).end(await readFile(f));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}${BASE}`;

const paginas = (process.argv[3] ?? '/,/oros/,/oros/herramientas/interes-compuesto/').split(',');
const browser = await chromium.launch({ executablePath: '/home/mvf/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome', args: ['--no-sandbox'] });
const salida = [];
for (const ancho of [390, 1440]) {
  for (const ruta of paginas) {
    const ctx = await browser.newContext({ viewport: { width: ancho, height: 900 } });
    const page = await ctx.newPage();
    const recursos = [];
    page.on('response', async (r) => {
      try { const h = r.headers(); recursos.push({ url: r.url(), type: h['content-type'] ?? '', size: Number(h['content-length'] ?? 0) }); } catch {}
    });
    await page.addInitScript(() => {
      window.__lcp = 0; window.__cls = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(origin + ruta, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const m = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] ?? {};
      const res = performance.getEntriesByType('resource').map((r) => ({ n: r.name.split('/').pop(), t: r.initiatorType, size: r.transferSize || r.encodedBodySize, dur: r.duration }));
      return { lcp: window.__lcp, cls: window.__cls, domContentLoaded: nav.domContentLoadedEventEnd, load: nav.loadEventEnd, ttfb: nav.responseStart, recursos: res, htmlBytes: new Blob([document.documentElement.outerHTML]).size };
    });
    const totalTransfer = m.recursos.reduce((a, r) => a + (r.size || 0), 0);
    salida.push({ ancho, ruta, lcp_ms: Math.round(m.lcp), cls: Number(m.cls.toFixed(4)), ttfb_ms: Math.round(m.ttfb), load_ms: Math.round(m.load), recursos: m.recursos.length, transfer_bytes: totalTransfer, js_bytes: m.recursos.filter((r) => r.n.endsWith('.js')).reduce((a, r) => a + r.size, 0), css_bytes: m.recursos.filter((r) => r.n.endsWith('.css')).reduce((a, r) => a + r.size, 0), font_bytes: m.recursos.filter((r) => r.n.endsWith('.woff2')).reduce((a, r) => a + r.size, 0) });
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log(JSON.stringify(salida, null, 1));
