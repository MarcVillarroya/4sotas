/** QA V2-H · vectores por la interfaz, fuentes externas y higiene de dist. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';

const require = createRequire(resolve(process.env.QA_PACKAGE ?? '../design/qa/package.json'));
const { chromium } = require('playwright');
const root = resolve('dist');
const out = resolve('qa/v2-h');
const TIPOS = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!p.startsWith('/4sotas/')) throw Error('base');
    p = p.slice('/4sotas'.length);
    if (p.endsWith('/')) p += 'index.html';
    const f = resolve(root, '.' + p);
    const b = await readFile(f);
    res.setHeader('Content-Type', TIPOS[extname(f)] || 'application/octet-stream');
    res.end(b);
  } catch { res.writeHead(404); res.end('nf'); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/4sotas`;
const R = { vectores: [], fuentes: {}, higiene: {} };

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
await page.goto(base + '/oros/herramientas/interes-compuesto/', { waitUntil: 'load' });

const rellenar = async (vals) => {
  for (const [name, value] of Object.entries(vals)) {
    const el = page.locator(`form input[name="${name}"]`).first();
    if (!(await el.count())) throw new Error(`campo ausente ${name}`);
    await el.fill(String(value));
  }
};
const enviar = async () => {
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForTimeout(350);
  return page.evaluate(() => ({
    estado: document.querySelector('#estado-calculo')?.textContent.replace(/\s+/g, ' ').trim(),
    capital: document.querySelector('[data-metrica="capital-final"], .metrics dd')?.textContent.replace(/\s+/g, ' ').trim(),
    metricas: [...document.querySelectorAll('.metrics dd')].map((d) => d.textContent.replace(/\s+/g, ' ').trim().slice(0, 80)),
    filas: document.querySelectorAll('table tbody tr').length,
    foco: document.activeElement?.tagName,
    errores: [...document.querySelectorAll('[role=alert], .aviso-error, [aria-invalid=true]')].map((n) => n.textContent.replace(/\s+/g, ' ').trim().slice(0, 80)),
  }));
};

// V6 · 0 € iniciales, 200 €/mes, 20 años, 5 % EA → 81.160,90 €
await rellenar({ capitalInicial: 0, aportacionPeriodica: 200, anios: 20, rentabilidadAnual: 5, inflacionAnual: '' });
R.vectores.push({ id: 'V6', esperado: '81160,90', ...(await enviar()) });
await page.screenshot({ path: `${out}/vector-v6-1440.png`, fullPage: false });

// V13 · mismo caso con inflación 3 % → valor real 44.936,82 €
await rellenar({ inflacionAnual: 3 });
R.vectores.push({ id: 'V13', esperado: '44936,82', ...(await enviar()) });
await page.screenshot({ path: `${out}/vector-v13-1440.png`, fullPage: false });

// Error de plazo: años por encima del límite
await rellenar({ anios: 999 });
R.vectores.push({ id: 'error-plazo', ...(await enviar()) });

await ctx.close();
await browser.close();
server.close();

// ── fuentes externas citadas
const htmls = (await readdir(root, { recursive: true })).filter((f) => f.endsWith('.html'));
const externos = new Set();
for (const f of htmls) {
  const html = await readFile(join(root, f), 'utf8');
  for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    const u = m[1];
    if (/youtube\.com|youtu\.be|marcvillarroya\.github\.io|schema\.org|googleapis|gstatic/.test(u)) continue;
    externos.add(u.replace(/&amp;/g, '&'));
  }
}
const lista = [...externos].sort();
const resultados = [];
for (const u of lista) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(u, { redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0 Safari/537.36' } });
    clearTimeout(t);
    resultados.push({ url: u, status: r.status });
  } catch (e) { resultados.push({ url: u, error: e.name }); }
}
R.fuentes = { total: lista.length, caidas: resultados.filter((r) => r.error || r.status >= 400), muestra: resultados.slice(0, 5) };

// ── higiene: secretos y borradores en dist
const textos = [];
for (const f of (await readdir(root, { recursive: true })).filter((f) => /\.(html|json|xml|txt|js|css)$/.test(f))) {
  const p = join(root, f);
  const s = await stat(p);
  if (s.size > 3_000_000) continue;
  textos.push({ f, t: await readFile(p, 'utf8') });
}
const patrones = { literal: /(fixture|draft|borrador)/i, token_gh: /gh[pousr]_[A-Za-z0-9]{20,}/, aws: /AKIA[0-9A-Z]{16}/, pem: /BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/, yt_token: /yt_token|refresh_token|client_secret/ };
R.higiene = Object.fromEntries(Object.entries(patrones).map(([k, re]) => [k, textos.filter((x) => re.test(x.t)).map((x) => x.f).slice(0, 8)]));
R.higiene.total_archivos = textos.length;

await writeFile(`${out}/supplement2.json`, JSON.stringify(R, null, 2));
console.log(JSON.stringify(R, null, 1));
