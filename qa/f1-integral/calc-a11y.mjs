// Verificación puntual de accesibilidad del estado de error de la calculadora (Chromium real).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = process.argv[2] ?? 'dist-fixtures';
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
const browser = await chromium.launch({ executablePath: '/home/mvf/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
await page.goto(origin + '/oros/herramientas/interes-compuesto/', { waitUntil: 'load' });

// sin JS: el contenido debe declararse (mensaje de ejemplo)
const sinJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } }).then(async (c) => {
  const p2 = await c.newPage();
  await p2.goto(origin + '/oros/herramientas/interes-compuesto/', { waitUntil: 'load' });
  const r = await p2.evaluate(() => ({ texto: document.querySelector('main').innerText.replace(/\s+/g, ' ').slice(0, 900), tablas: document.querySelectorAll('table').length }));
  await c.close();
  return r;
});

await page.fill('#capitalInicial', '-5');
await page.fill('#rentabilidadAnual', '5');
await page.fill('#anios', '10');
await page.click('form button[type="submit"]');
await page.waitForTimeout(200);
const invalido = await page.evaluate(() => {
  const el = document.querySelector('#capitalInicial');
  const err = document.querySelector('#error-capitalInicial');
  return {
    ariaInvalid: el.getAttribute('aria-invalid'),
    describedby: el.getAttribute('aria-describedby'),
    errorVisible: err && !err.hidden ? err.innerText.trim() : null,
    foco: document.activeElement?.id,
    status: document.querySelector('#estado-calculo')?.innerText.trim(),
  };
});

// valido con aportacion al inicio y periodo en 1 mes
await page.fill('#capitalInicial', '1000');
await page.fill('#aportacionPeriodica', '100');
await page.fill('#rentabilidadAnual', '12');
await page.fill('#anios', '0');
await page.selectOption('#frecuencia', 'mensual');
await page.check('#momento-inicio');
await page.selectOption('#meses', '1');
await page.click('form button[type="submit"]');
await page.waitForTimeout(200);
const valido = await page.evaluate(() => ({
  status: document.querySelector('#estado-calculo')?.innerText.trim(),
  ariaInvalid: document.querySelector('#capitalInicial')?.getAttribute('aria-invalid'),
  filasTabla: document.querySelectorAll('table tbody tr').length,
  cabecerasTabla: [...document.querySelectorAll('table thead th')].map((t) => t.innerText.trim()),
  captionTabla: document.querySelector('table caption')?.innerText.trim(),
  sumaTabla: document.querySelector('table tbody tr:last-child')?.innerText.replace(/\s+/g, ' ').trim(),
  prefersReduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
}));

// edicion posterior: el resultado debe invalidarse
await page.fill('#capitalInicial', '2000');
await page.waitForTimeout(120);
const trasEditar = await page.evaluate(() => document.querySelector('#estado-calculo')?.innerText.trim());

console.log(JSON.stringify({ sinJs, invalido, valido, trasEditar }, null, 1));
await browser.close();
server.close();
