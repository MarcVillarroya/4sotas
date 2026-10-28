// V2.2-D · QA de información de vídeo y regresión visual (local, sobre dist/)
// Uso: node qa/v2.2-d/qa.mjs
// Salidas: qa/v2.2-d/report.json y capturas en /home/mvf/4sotas/v2.2/qa/
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';

const require = createRequire(resolve(process.env.QA_PACKAGE ?? '../design/qa/package.json'));
const { chromium } = require('playwright');
const { default: AxeBuilder } = await import(require.resolve('@axe-core/playwright'));

const root = resolve('dist');
const out = resolve('/home/mvf/4sotas/v2.2/qa');
await mkdir(out, { recursive: true });

const TIPOS = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.ico': 'image/x-icon',
};
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!p.startsWith('/4sotas/')) throw Error('base');
    p = p.slice('/4sotas'.length);
    if (p.endsWith('/')) p += 'index.html';
    const file = resolve(root, '.' + p);
    if (!file.startsWith(root + '/')) throw Error('path');
    const body = await readFile(file);
    res.setHeader('Content-Type', TIPOS[extname(file)] || 'application/octet-stream');
    res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/4sotas`;

const eur = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.round(n * 100) / 100);
function capitalEsperado({ p, a, anios, meses, tasaAnual, periodosPorAnio, mesesPorPeriodo, inicio }) {
  const n = ((anios * 12 + meses) / mesesPorPeriodo) | 0;
  const i = Math.pow(1 + tasaAnual / 100, 1 / periodosPorAnio) - 1;
  const factor = Math.pow(1 + i, n);
  const aport = i === 0 ? a * n : a * ((factor - 1) / i) * (inicio ? 1 + i : 1);
  return p * factor + aport;
}

// Rutas: sitemap real del build + 404 propio
const sitemap = await readFile(resolve(root, 'sitemap-0.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
const rutas = urls.map((u) => new URL(u).pathname.replace(/^\/4sotas/, '') || '/');

const browser = await chromium.launch({ headless: true });
const report = { generado: new Date().toISOString(), browser: browser.version(), rutas: rutas.length, paginas: [], enlaces: {}, fichas: {}, calculadora: {}, js: {}, errores: [] };
const fallos = [];
const check = (c, m) => { if (!c) fallos.push(m); };

/* ── 1 · barrido de las 50 rutas + 404 ── */
const internos = new Map(); // href -> {desde:Set, ok:bool}
for (const path of rutas) {
  for (const width of [1440, 390]) {
    const ctx = await browser.newContext({
      viewport: { width, height: width === 1440 ? 900 : 844 },
      ...(width === 390 ? { isMobile: true, hasTouch: true, deviceScaleFactor: 1 } : {}),
      reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();
    const errs = [], bad = [], jsReq = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('favicon')) bad.push(`${r.url()}=${r.status()}`); });
    page.on('request', (r) => { if (r.resourceType() === 'script') jsReq.push(r.url()); });
    const resp = await page.goto(base + path, { waitUntil: 'load' });
    const status = resp?.status();
    await page.evaluate(() => document.fonts.ready);
    await page.locator('img').evaluateAll((imgs) => imgs.forEach((i) => { i.loading = 'eager'; }));
    await page.waitForFunction(() => [...document.images].every((i) => i.complete)).catch(() => {});
    const dom = await page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      lang: document.documentElement.lang,
      title: document.title,
      canon: document.querySelector('link[rel=canonical]')?.getAttribute('href') ?? null,
      imgsRotas: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
      iframes: document.querySelectorAll('iframe').length,
      ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { JSON.parse(s.textContent); return 'ok'; } catch { return 'PARSE_FAIL'; } }),
      anchors: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
    }));
    let violations = [];
    if (width === 390) {
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      violations = axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) }));
    }
    const overflow = dom.scrollWidth > dom.clientWidth + 1;
    if (path !== '/') {
      check(status === 200, `HTTP ${status} ${path} ${width}`);
      check(dom.h1 === 1, `h1=${dom.h1} ${path} ${width}`);
      check(!overflow, `overflow ${path} ${width}: ${dom.scrollWidth}>${dom.clientWidth}`);
      check(dom.imgsRotas.length === 0, `imagen rota ${path} ${width}: ${dom.imgsRotas.join(',')}`);
      check(errs.length === 0, `error JS ${path} ${width}: ${errs.join('|')}`);
      check(bad.length === 0, `HTTP>=400 ${path} ${width}: ${bad.join(',')}`);
      check(violations.length === 0, `axe ${path} ${width}: ${violations.map((v) => v.id).join(',')}`);
      check(dom.ld.every((x) => x === 'ok'), `JSON-LD no parsea ${path}`);
      check(dom.iframes === 0, `iframes en ${path}: ${dom.iframes}`);
    }
    for (const href of dom.anchors) {
      if (!href || /^(https?:|mailto:|tel:|#|javascript:)/.test(href)) continue;
      const u = new URL(href, 'http://x' + path);
      const key = u.pathname + u.search;
      if (!internos.has(key)) internos.set(key, { desde: new Set(), status: null });
      internos.get(key).desde.add(path);
    }
    report.paginas.push({ path, width, status, h1: dom.h1, overflow, violations: violations.map((v) => v.id), axeDetalle: violations, errs, bad, jsReq, title: dom.title, canon: dom.canon });
    if (width === 1440 && (path === '/' || path.includes('/videos/'))) report.js['page:' + path] = jsReq;
    await ctx.close();
  }
}

/* ── 2 · enlaces internos: se comprueban contra el build real ── */
for (const [key, info] of internos) {
  let file = decodeURIComponent(key.split('?')[0]);
  if (file.endsWith('/')) file += 'index.html';
  let status = 404;
  try {
    const st = await fetch(`http://127.0.0.1:${server.address().port}` + file, { method: 'GET' });
    status = st.status;
  } catch { status = 0; }
  info.status = status;
  check(status === 200, `enlace roto ${key} (status ${status}) desde ${[...info.desde].slice(0, 3).join(',')}`);
}
report.enlaces = {
  total: internos.size,
  rotos: [...internos].filter(([, v]) => v.status !== 200).map(([k, v]) => ({ href: k, status: v.status, desde: [...v.desde] })),
};

/* ── 3 · fichas de vídeo: qué pinta el bloque informacion ── */
const fichas = {
  'con-capítulos · crisis-de-2008-espana': '/oros/videos/crisis-de-2008-espana/',
  'sin-capítulos · tres-cuentas-un-sueldo': '/oros/videos/tres-cuentas-un-sueldo/',
  'nueva · sp500': '/oros/videos/sp500-4-de-cada-10-euros-a-10-posiciones/',
  'nomina · como-leer-una-nomina': '/oros/videos/como-leer-una-nomina/',
};
for (const [nombre, path] of Object.entries(fichas)) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(base + path, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const d = await page.evaluate(() => {
    const sec = document.querySelector('#contexto');
    const txt = (el) => (el?.innerText || '').replace(/\s+/g, ' ').trim();
    const eyebrow = txt(document.querySelector('.v2-watch-head .eyebrow'));
    const h3 = [...(sec?.querySelectorAll('h3') ?? [])].map((h) => txt(h));
    const aside = txt(document.querySelector('.v2-watch-aside'));
    return {
      eyebrow,
      h1: txt(document.querySelector('h1')),
      meta: txt(document.querySelector('.v2-meta')),
      contexto: txt(sec),
      subtitulos: h3,
      parrafos: [...(sec?.querySelectorAll(':scope > p') ?? [])].map((p) => txt(p)),
      lista: [...(sec?.querySelectorAll('li') ?? [])].map((li) => txt(li)),
      capitulos: [...document.querySelectorAll('#capitulos li')].map((li) => txt(li)),
      aside,
      secciones: [...document.querySelectorAll('h2')].map((h) => txt(h)),
      fuentesVisibles: /fuente/i.test(txt(document.querySelector('.v2-transcript'))),
      estadoLiteral: /pendiente|no tiene resumen|aún no/i.test(txt(document.querySelector('.v2-transcript'))),
      textoCompleto: txt(document.body),
    };
  });
  report.fichas[nombre] = { path, ...d };
  await ctx.close();
}

/* ── 4 · capturas 1440 / 390 de las superficies clave ── */
const capturas = [
  ['sp500-1440', '/oros/videos/sp500-4-de-cada-10-euros-a-10-posiciones/', 1440],
  ['sp500-390', '/oros/videos/sp500-4-de-cada-10-euros-a-10-posiciones/', 390],
  ['crisis-2008-1440', '/oros/videos/crisis-de-2008-espana/', 1440],
  ['crisis-2008-390', '/oros/videos/crisis-de-2008-espana/', 390],
  ['tres-cuentas-390', '/oros/videos/tres-cuentas-un-sueldo/', 390],
  ['videoteca-1440', '/oros/videos/', 1440],
  ['videoteca-390', '/oros/videos/', 390],
];
report.capturas = [];
for (const [nombre, path, width] of capturas) {
  const ctx = await browser.newContext({
    viewport: { width, height: width === 1440 ? 900 : 844 },
    ...(width === 390 ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  await page.goto(base + path, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('img').evaluateAll((imgs) => imgs.forEach((i) => { i.loading = 'eager'; }));
  await page.waitForFunction(() => [...document.images].every((i) => i.complete)).catch(() => {});
  const file = join(out, `${nombre}.png`);
  await page.screenshot({ path: file, fullPage: true });
  report.capturas.push({ nombre, path, width, file });
  await ctx.close();
}

/* ── 5 · calculadora intacta: dos juegos contra motor independiente ── */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const xhr = [];
  page.on('request', (r) => { if (['xhr', 'fetch', 'beacon'].includes(r.resourceType())) xhr.push(r.url()); });
  const errores = [];
  page.on('pageerror', (e) => errores.push(String(e)));
  await page.goto(base + '/oros/herramientas/interes-compuesto/', { waitUntil: 'networkidle' });
  const live = await page.evaluate(() => {
    const el = document.querySelector('#estado-calculo');
    return { existe: !!el, ariaLive: el?.getAttribute('aria-live'), role: el?.getAttribute('role') };
  });
  const casos = [
    { id: 'juego-1', capitalInicial: '2000', aportacionPeriodica: '150', anios: '15', meses: '0', rentabilidadAnual: '5', frecuencia: 'mensual', momentoAportacion: 'fin' },
    { id: 'juego-2', capitalInicial: '10000', aportacionPeriodica: '0', anios: '10', meses: '0', rentabilidadAnual: '7', frecuencia: 'anual', momentoAportacion: 'inicio' },
  ];
  const res = [];
  for (const c of casos) {
    await page.fill('#capitalInicial', c.capitalInicial);
    await page.fill('#aportacionPeriodica', c.aportacionPeriodica);
    await page.fill('#anios', c.anios);
    const sel = async (id, v) => { const s = page.locator('#' + id); if (await s.count()) await s.selectOption(v).catch(() => {}); };
    await sel('meses', c.meses);
    await page.fill('#rentabilidadAnual', c.rentabilidadAnual);
    await sel('frecuencia', c.frecuencia);
    await sel('momentoAportacion', c.momentoAportacion);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(300);
    const leido = await page.evaluate(() => document.querySelector('#capital-final')?.textContent.trim());
    const ppa = { anual: 1, semestral: 2, trimestral: 4, mensual: 12 }[c.frecuencia];
    const esperado = eur(capitalEsperado({
      p: +c.capitalInicial, a: +c.aportacionPeriodica, anios: +c.anios, meses: +c.meses,
      tasaAnual: +c.rentabilidadAnual, periodosPorAnio: ppa, mesesPorPeriodo: 12 / ppa,
      inicio: c.momentoAportacion === 'inicio',
    }));
    res.push({ caso: c.id, leido, esperado, coincide: leido === esperado });
  }
  check(res.every((r) => r.coincide), `calculadora: ${JSON.stringify(res)}`);
  check(live.ariaLive === 'polite' && live.role === 'status', `calculadora aria-live ${JSON.stringify(live)}`);
  check(xhr.length === 0, `calculadora XHR: ${xhr.join(',')}`);
  check(errores.length === 0, `calculadora errores JS: ${errores.join('|')}`);
  await page.screenshot({ path: join(out, 'calculadora-1440.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: join(out, 'calculadora-390.png'), fullPage: true });
  report.calculadora = { live, casos: res, xhr, errores };
  await ctx.close();
}

/* ── 6 · JS servido en el build ── */
async function walk(dir) {
  const out2 = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out2.push(...await walk(p));
    else if (e.name.endsWith('.js')) out2.push(p);
  }
  return out2;
}
const jsFiles = (await walk(root)).map((p) => p.replace(root + '/', ''));
report.js.archivos = jsFiles;
report.js.count = jsFiles.length;
check(jsFiles.length === 1 && jsFiles[0].includes('Calculadora'), `JS servido inesperado: ${jsFiles.join(',')}`);

report.fallos = fallos;
report.ok = fallos.length === 0;
await writeFile(resolve('qa/v2.2-d/report.json'), JSON.stringify(report, null, 1));
await browser.close();
server.close();
console.log(JSON.stringify({
  rutas: report.rutas,
  paginas: report.paginas.length,
  fallos: fallos.length,
  detalleFallos: fallos.slice(0, 30),
  enlaces: { total: report.enlaces.total, rotos: report.enlaces.rotos.length },
  axeRutas: report.paginas.filter((p) => p.width === 390 && p.violations.length).map((p) => p.path),
  overflow: report.paginas.filter((p) => p.overflow).map((p) => p.path + '@' + p.width),
  capturas: report.capturas.length,
  js: report.js.count,
  calculadora: report.calculadora.casos,
}, null, 1));
