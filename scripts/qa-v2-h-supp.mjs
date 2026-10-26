/** QA V2-H · comprobaciones complementarias: JSON-LD, LCP, contenido, texto público, calculadora UI. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';

const require = createRequire(resolve(process.env.QA_PACKAGE ?? '../design/qa/package.json'));
const { chromium } = require('playwright');
const root = resolve('dist');
const out = resolve('qa/v2-h');
await mkdir(out, { recursive: true });
const TIPOS = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
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
const R = {};

// ── JSON-LD por página: tipos tras aplanar @graph y campos mínimos
const PAGINAS = {
  home: '/index.html', oros: '/oros/index.html', videos: '/oros/videos/index.html',
  ficha: '/oros/videos/tres-cuentas-un-sueldo/index.html',
  ficha_no_insertable: '/oros/videos/irpf-en-la-nomina/index.html',
  guia: '/oros/guias/tramos-irpf-y-retencion/index.html',
  calculadora: '/oros/herramientas/interes-compuesto/index.html',
  glosario: '/oros/glosario/index.html', sobre: '/sobre-4-sotas/index.html',
  metodologia: '/metodologia/index.html', privacidad: '/privacidad/index.html',
};
R.jsonld = {};
for (const [k, rel] of Object.entries(PAGINAS)) {
  const html = await readFile(resolve(root, '.' + rel), 'utf8');
  const bloques = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const parsed = [];
  const errors = [];
  for (const b of bloques) {
    try { const d = JSON.parse(b); parsed.push(...(Array.isArray(d) ? d : d['@graph'] ? d['@graph'] : [d])); }
    catch (e) { errors.push(e.message); }
  }
  R.jsonld[k] = { bloques: bloques.length, parse_ok: errors.length === 0, tipos: parsed.map((n) => n['@type']), errors };
}
// VideoObject completo en dos fichas
R.videoobject = {};
for (const [k, rel] of [['insertable', '/oros/videos/tres-cuentas-un-sueldo/index.html'], ['no_insertable', '/oros/videos/irpf-en-la-nomina/index.html']]) {
  const html = await readFile(resolve(root, '.' + rel), 'utf8');
  const nodes = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => { const d = JSON.parse(m[1]); return Array.isArray(d) ? d : d['@graph'] ?? [d]; });
  R.videoobject[k] = nodes.filter((n) => n['@type'] === 'VideoObject').map((v) => ({ contentUrl: v.contentUrl, embedUrl: v.embedUrl, thumbnailUrl: v.thumbnailUrl, uploadDate: v.uploadDate, duration: v.duration, name: v.name, description: (v.description ?? '').slice(0, 60), publisher: v.publisher?.['@type'] }));
}

// ── Texto público: términos internos sobre texto plano de todo dist (sin atributos)
const htmls = (await readdir(root, { recursive: true })).filter((f) => f.endsWith('.html'));
const TERMINOS = [/\bV1\b/, /\bV2\b/, /\bAPI\b/, /fixture/i, /estado editorial/i, /plan editorial/i, /ficha contrastada/i, /publicadas/i, /metadata/i, /\bbuild\b/i, /\bslug\b/i, /oembed/i, /frontmatter/i, /pipeline/i, /candidat/i, /noindex/i, /\bvector\b/i];
const hallazgos = [];
for (const f of htmls) {
  let html = await readFile(join(root, f), 'utf8');
  html = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
  const txt = html.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  for (const re of TERMINOS) {
    const m = re.exec(txt);
    if (m) hallazgos.push({ file: f, term: re.source, contexto: txt.slice(Math.max(0, m.index - 70), m.index + 90).trim() });
  }
}
R.terminos = hallazgos;

// ── Categorías/aliases crudos en glosario
const gloss = await readFile(resolve(root, 'oros/glosario/index.html'), 'utf8');
R.glosario = { categorias: [...gloss.matchAll(/Categoría:\s*([a-z-]+)/g)].map((m) => m[1]), tambien: [...gloss.matchAll(/También:\s*([^<]+)/g)].map((m) => m[1]).slice(0, 5) };

// ── robots.txt y documentación del límite de Pages
R.robots = await readFile(resolve(root, 'robots.txt'), 'utf8');
const docs = await readdir(resolve('docs')).catch(() => []);
R.docs = docs;

const browser = await chromium.launch({ headless: true });
// ── LCP/CLS por observador real
R.vitals = {};
for (const width of [1440, 390]) {
  for (const [k, path] of [['home', '/'], ['videos', '/oros/videos/'], ['ficha', '/oros/videos/tres-cuentas-un-sueldo/'], ['guia', '/oros/guias/tramos-irpf-y-retencion/'], ['calculadora', '/oros/herramientas/interes-compuesto/']]) {
    const ctx = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      window.__m = { lcp: 0, cls: 0 };
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.lcp = Math.max(window.__m.lcp, e.startTime); }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(base + path, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(900);
    R.vitals[`${k}-${width}`] = await page.evaluate(() => ({ lcp_ms: Math.round(window.__m.lcp), cls: Number(window.__m.cls.toFixed(4)) }));
    await ctx.close();
  }
}

// ── Calculadora: vector publicado por la interfaz y resultado visible
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const externas = [];
  page.on('request', (r) => { if (!r.url().startsWith(base) && !r.url().startsWith('data:')) externas.push(r.url()); });
  await page.goto(base + '/oros/herramientas/interes-compuesto/', { waitUntil: 'load' });
  const campos = await page.evaluate(() => [...document.querySelectorAll('form input')].map((i) => ({ name: i.name, type: i.type, value: i.value, id: i.id })));
  const rellenar = async (nombre, valor) => {
    const el = page.locator(`form input[name="${nombre}"]`).first();
    if (await el.count()) { await el.fill(String(valor)); return true; }
    return false;
  };
  const usados = {};
  for (const [n, v] of [['inicial', 5000], ['mensual', 200], ['anios', 10], ['rentabilidad', 6]]) usados[n] = await rellenar(n, v);
  const boton = page.locator('form button[type="submit"]').first();
  await boton.click();
  await page.waitForTimeout(400);
  R.calculadora = await page.evaluate(() => ({
    estado: document.querySelector('#estado-calculo')?.textContent.replace(/\s+/g, ' ').trim().slice(0, 200),
    metrics: [...document.querySelectorAll('.metrics dd [id], [class*=metric] dd')].map((n) => n.textContent.replace(/\s+/g, ' ').trim().slice(0, 40)).slice(0, 8),
    foco: document.activeElement?.tagName + ':' + (document.activeElement?.textContent || '').trim().slice(0, 30),
    filas_tabla: document.querySelectorAll('table tbody tr').length,
    aria_live: document.querySelector('[aria-live]')?.getAttribute('aria-live'),
  }));
  R.calculadora.campos = campos;
  R.calculadora.usados = usados;
  R.calculadora.peticiones_externas = externas;
  await page.screenshot({ path: `${out}/calculadora-vector-1440.png`, fullPage: false });

  // prefers-reduced-motion: comprobar que no hay animaciones infinitas activas
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p2 = await ctx2.newPage();
  await p2.goto(base + '/', { waitUntil: 'load' });
  R.reduced_motion = await p2.evaluate(() => [...document.querySelectorAll('*')].map((n) => getComputedStyle(n)).filter((s) => s.animationName !== 'none' && s.animationIterationCount === 'infinite').length);
  await ctx2.close();
  await ctx.close();
}

// ── Ficha no insertable: texto exacto del aviso
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(base + '/oros/videos/irpf-en-la-nomina/', { waitUntil: 'load' });
  R.ficha_no_insertable = await page.evaluate(() => {
    const t = document.body.innerText;
    const idx = t.toLowerCase().indexOf('youtube');
    return {
      parrafos_aviso: [...document.querySelectorAll('p, [role=note], .aviso, [class*=notice], [class*=aviso]')].map((p) => p.textContent.replace(/\s+/g, ' ').trim()).filter((s) => /inserci|disponible|reproducir|youtube/i.test(s)).slice(0, 6),
      acciones: [...document.querySelectorAll('main a, main button')].slice(0, 14).map((a) => ({ t: a.textContent.replace(/\s+/g, ' ').trim().slice(0, 45), href: a.getAttribute('href'), h: Math.round(a.getBoundingClientRect().height) })),
    };
  });
  await ctx.close();
}
await browser.close();
server.close();
await writeFile(`${out}/supplement.json`, JSON.stringify(R, null, 2));
console.log(JSON.stringify(R, null, 1).slice(0, 12000));
