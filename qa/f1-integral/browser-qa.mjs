// QA de navegador (Chromium real) sobre la salida construida: axe-core, overflow por ancho,
// calculadora interactiva, facade de vídeo, reduced-motion y red observada.
// Uso: NODE_PATH=/home/mvf/.hermes/hermes-agent/node_modules node qa/f1-integral/browser-qa.mjs <dir-dist> <outdir>
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const AXE = '/home/mvf/4sotas/design/qa/node_modules/axe-core/axe.min.js';

const root = process.argv[2];
const outdir = process.argv[3] ?? 'qa/f1-integral/evidence';
const BASE = '/4sotas';
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };

await mkdir(outdir, { recursive: true });

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!p.startsWith(BASE)) { res.writeHead(404).end('fuera de base'); return; }
  p = p.slice(BASE.length) || '/';
  const isDir = (f) => { try { return statSync(f).isDirectory(); } catch { return false; } };
  let f = join(root, p);
  if (isDir(f)) f = join(f, 'index.html');
  if (!existsSync(f)) f = join(root, p.endsWith('/') ? p + 'index.html' : p + '/index.html');
  if (!existsSync(f) || isDir(f)) {
    res.writeHead(404, { 'content-type': TIPOS['.html'] }).end(await readFile(join(root, '404.html'), 'utf8'));
    return;
  }
  res.writeHead(200, { 'content-type': TIPOS[extname(f)] ?? 'application/octet-stream' }).end(await readFile(f));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const url = (ruta) => origin + BASE + ruta;

const PAGINAS = [
  ['home', '/'],
  ['oros', '/oros/'],
  ['tema', '/oros/temas/vivienda-y-hipoteca/'],
  ['guia', '/oros/guias/bruto-a-neto/'],
  ['video', '/oros/videos/como-leer-una-nomina/'],
  ['herramienta', '/oros/herramientas/interes-compuesto/'],
  ['glosario', '/oros/glosario/tae/'],
  ['catalogo', '/oros/videos/'],
  ['404', '/no-existe/'],
];
const ANCHOS = [390, 768, 1440];

const browser = await chromium.launch({ executablePath: '/home/mvf/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome', args: ['--no-sandbox'] });
const resultados = [];
let fallosCriticos = 0;
let warnings = 0;

async function nuevaPagina(ancho) {
  const ctx = await browser.newContext({ viewport: { width: ancho, height: 900 }, locale: 'es-ES', timezoneId: 'Europe/Madrid', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const externas = [];
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith(origin) && !u.startsWith('data:') && !u.startsWith('about:')) externas.push(u); });
  const errores = [];
  page.on('pageerror', (e) => errores.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errores.push('console: ' + m.text()); });
  return { ctx, page, externas, errores };
}

// 1) Matriz página x ancho: overflow, axe, consola
for (const ancho of ANCHOS) {
  for (const [nombre, ruta] of PAGINAS) {
    const { ctx, page, externas, errores } = await nuevaPagina(ancho);
    const status = (await page.goto(url(ruta), { waitUntil: 'load' })).status();
    await page.addScriptTag({ path: AXE });
    const axe = await page.evaluate(async () => {
      const r = await window.axe.run(document, { resultTypes: ['violations'], runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } });
      return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, ayuda: v.help }));
    });
    const dims = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    const overflow = dims.sw - dims.cw;
    const h1 = await page.locator('h1').count();
    await page.screenshot({ path: join(outdir, `${nombre}-${ancho}.png`), fullPage: true });
    const rec = { ancho, nombre, ruta, status, h1, overflowPx: overflow, axe, erroresConsola: errores, peticionesExternas: externas };
    if (status !== 200 && ruta !== '/no-existe/') { fallosCriticos += 1; rec.bloqueante = 'status != 200'; }
    if (ruta === '/no-existe/' && status !== 404) { fallosCriticos += 1; rec.bloqueante = `404 esperado, obtenido ${status}`; }
    if (overflow > 1) { fallosCriticos += 1; rec.bloqueante = `overflow horizontal ${overflow}px`; }
    if (h1 !== 1) { fallosCriticos += 1; rec.bloqueante = `H1 count=${h1}`; }
    if (axe.some((v) => ['critical', 'serious'].includes(v.impact))) { fallosCriticos += 1; rec.bloqueante = 'axe critical/serious'; }
    else if (axe.length) warnings += 1;
    if (externas.length) { warnings += 1; rec.aviso = 'peticiones externas en carga inicial'; }
    resultados.push(rec);
    await ctx.close();
  }
}

// 2) Calculadora interactiva (390 y 1440)
for (const ancho of [390, 1440]) {
  const { ctx, page, externas, errores } = await nuevaPagina(ancho);
  await page.goto(url('/oros/herramientas/interes-compuesto/'), { waitUntil: 'load' });
  const campos = await page.evaluate(() => [...document.querySelectorAll('input,select')].map((e) => ({ id: e.id, type: e.type, name: e.name })));
  const calc = { ancho, campos };
  const rellenar = async (v) => {
    await page.fill('#capitalInicial', v.capital).catch(() => {});
    await page.fill('#aportacionPeriodica', v.aportacion).catch(() => {});
    await page.fill('#rentabilidadAnual', v.tasa).catch(() => {});
    await page.fill('#anios', v.anios).catch(() => {});
    await page.selectOption('#frecuencia', v.frecuencia).catch(() => {});
    await page.check(v.momento === 'inicio' ? '#momento-inicio' : '#momento-fin').catch(() => {});
  };
  const enviar = async () => {
    const btn = page.locator('form button[type="submit"]').first();
    await btn.click();
    await page.waitForTimeout(150);
    return page.evaluate(() => ({
      texto: document.querySelector('main').innerText.slice(0, 1200),
      anuncio: [...document.querySelectorAll('[role="status"], [aria-live]')].map((e) => e.innerText.trim()).filter(Boolean),
      errores: [...document.querySelectorAll('.error')].filter((e) => !e.hidden && e.innerText.trim()).map((e) => e.innerText.trim()),
    }));
  };
  // caso valido conocido: 10000 al 5% 10 anos mensual fin => 16470.09
  await rellenar({ capital: '10000', aportacion: '0', tasa: '5', anios: '10', frecuencia: 'mensual', momento: 'fin' });
  const r1 = await enviar();
  calc.valido = { ...r1, esperado: '16.288,95 (10000 x 1,05^10, tasa efectiva anual)' };
  calc.valido.ok = /16\.288,95/.test(r1.texto + r1.anuncio.join(' '));
  // tasa cero: 1000 + 100/mes 5 anos => 7000,00
  await rellenar({ capital: '1000', aportacion: '100', tasa: '0', anios: '5', frecuencia: 'mensual', momento: 'fin' });
  const r2 = await enviar();
  calc.tasaCero = { ...r2, ok: /7000,00|7\.000,00/.test(r2.texto + r2.anuncio.join(' ')) };
  // invalido: capital negativo
  await rellenar({ capital: '-5', aportacion: '0', tasa: '5', anios: '10', frecuencia: 'mensual', momento: 'fin' });
  const r3 = await enviar();
  const invalid = await page.evaluate(() => {
    const el = document.querySelector('#capital-inicial');
    return { ariaInvalid: el?.getAttribute('aria-invalid'), describedby: el?.getAttribute('aria-describedby'), errorVis: [...document.querySelectorAll('[role="alert"], .error, [id*="error"]')].map((e) => e.innerText.trim()).filter(Boolean), foco: document.activeElement?.id };
  });
  calc.invalido = { ...r3, ...invalid, ok: /entre 0 y 1\.000\.000/i.test(r3.texto + r3.anuncio.join(' ')) };
  // teclado: tabulacion alcanza los controles
  await page.goto(url('/oros/herramientas/interes-compuesto/'), { waitUntil: 'load' });
  const tab = [];
  for (let i = 0; i < 22; i += 1) { await page.keyboard.press('Tab'); tab.push(await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)); }
  calc.tabulacion = tab;
  calc.peticionesExternas = externas;
  calc.erroresConsola = errores;
  await page.screenshot({ path: join(outdir, `calculadora-${ancho}.png`), fullPage: true });
  if (!calc.valido.ok) { fallosCriticos += 1; calc.bloqueante = 'resultado valido no coincide con 16.470,09'; }
  if (!calc.tasaCero.ok) { fallosCriticos += 1; calc.bloqueante = (calc.bloqueante ?? '') + ' tasa cero'; }
  if (!calc.invalido.ok) { fallosCriticos += 1; calc.bloqueante = (calc.bloqueante ?? '') + ' invalido sin mensaje'; }
  if (externas.length) { warnings += 1; calc.aviso = 'peticiones externas: ' + externas.join(','); }
  resultados.push({ tipo: 'calculadora', ...calc });
  await ctx.close();
}

// 3) Facade de video: sin iframe hasta la intencion, sin autoplay, id real
{
  const { ctx, page, externas } = await nuevaPagina(768);
  await page.goto(url('/oros/videos/como-leer-una-nomina/'), { waitUntil: 'load' });
  const antes = await page.evaluate(() => ({ iframes: document.querySelectorAll('iframe').length, botones: [...document.querySelectorAll('button')].map((b) => b.innerText.trim()).slice(0, 6) }));
  const btn = page.locator('[data-cargar]').first();
  let tras = null;
  if (await btn.count()) {
    await btn.click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(1500);
    tras = await page.evaluate(() => [...document.querySelectorAll('iframe')].map((f) => ({ src: f.getAttribute('src'), allow: f.getAttribute('allow'), title: f.getAttribute('title') })));
  }
  resultados.push({ tipo: 'facade', antes, tras, externas: externas.slice(0, 5) });
  if (antes.iframes !== 0) { fallosCriticos += 1; resultados[resultados.length - 1].bloqueante = 'iframe presente antes de la interaccion'; }
  if (tras && tras.some((f) => /autoplay=1/.test(f.src ?? ''))) { fallosCriticos += 1; resultados[resultados.length - 1].bloqueante = 'autoplay en iframe'; }
  await ctx.close();
}

// 4) prefers-reduced-motion: ninguna animacion CSS activa
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(url('/'), { waitUntil: 'load' });
  const anim = await page.evaluate(() => [...document.querySelectorAll('*')].filter((e) => { const s = getComputedStyle(e); return s.animationName !== 'none' && parseFloat(s.animationDuration) > 0.01; }).map((e) => `${e.tagName}.${e.className}: ${getComputedStyle(e).animationName} ${getComputedStyle(e).animationDuration}`));
  resultados.push({ tipo: 'reduced-motion', animacionesActivas: anim });
  if (anim.length) { warnings += 1; }
  await ctx.close();
}

await browser.close();
server.close();
const salida = { root, originServidor: origin, total: resultados.length, fallosCriticos, warnings, resultados };
await writeFile(join(outdir, 'browser-qa.json'), JSON.stringify(salida, null, 1));
const resumen = resultados.filter((r) => r.tipo).map((r) => ({ tipo: r.tipo, ...(r.bloqueante ? { bloqueante: r.bloqueante } : {}), ok: r.valido?.ok ?? r.tasaCero?.ok ?? r.invalido?.ok ?? undefined }));
console.log(JSON.stringify({ total: resultados.length, fallosCriticos, warnings, resumen, paginas: resultados.filter((r) => r.nombre).map((r) => ({ ancho: r.ancho, nombre: r.nombre, status: r.status, overflow: r.overflowPx, h1: r.h1, axe: r.axe.length, crit: r.axe.filter((v) => ['critical', 'serious'].includes(v.impact)).length, externas: r.peticionesExternas.length, err: r.erroresConsola.length })) }, null, 1));
process.exit(fallosCriticos === 0 ? 0 : 1);
