/** QA V2-H · métricas visuales deterministas: paleta, jerarquía tipográfica, rejillas y contraste. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';

const require = createRequire(resolve(process.env.QA_PACKAGE ?? '../design/qa/package.json'));
const { chromium } = require('playwright');
const root = resolve('dist');
const out = resolve('qa/v2-h');
const TIPOS = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (p.startsWith('/screens/')) { const b = await readFile(resolve(process.cwd(), '.' + p.replace('/screens', ''))); res.setHeader('Content-Type', 'image/png'); return res.end(b); }
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
const base = `http://127.0.0.1:${server.address().port}`;
const R = { paleta: {}, jerarquia: {}, rejillas: {}, contraste: {} };

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// ── paleta de capturas (canvas sobre las PNG ya generadas)
await page.goto(base + '/4sotas/', { waitUntil: 'load' });
const analizar = async (url) => page.evaluate(async (u) => {
  const img = new Image();
  img.src = u;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = Math.min(img.naturalWidth, 900);
  c.height = Math.round(img.naturalHeight * (c.width / img.naturalWidth));
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0, c.width, c.height);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  const hex = (r, gg, b) => '#' + [r, gg, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  const cuenta = new Map();
  let lum = 0, n = 0, bordes = 0;
  const prev = new Uint8ClampedArray(c.width * 3);
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      const r = d[i], gg = d[i + 1], b = d[i + 2];
      const q = hex(Math.round(r / 8) * 8, Math.round(gg / 8) * 8, Math.round(b / 8) * 8);
      cuenta.set(q, (cuenta.get(q) || 0) + 1);
      lum += 0.2126 * r + 0.7152 * gg + 0.0722 * b; n++;
      if (x > 0) { const p = (y * c.width + x - 1) * 4; bordes += Math.abs(r - d[p]) + Math.abs(gg - d[p + 1]) + Math.abs(b - d[p + 2]) > 40 ? 1 : 0; }
    }
  }
  const top = [...cuenta.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([c, v]) => ({ c, pct: Number(((v / n) * 100).toFixed(1)) }));
  return { w: img.naturalWidth, h: img.naturalHeight, colores: cuenta.size, luminancia: Math.round(lum / n), borde_pct: Number(((bordes / n) * 100).toFixed(1)), top };
}, url);

R.paleta.v2 = {};
for (const n of ['home', 'oros', 'videos', 'ficha', 'guia', 'calculadora', 'glosario', 'sobre', 'metodologia', 'privacidad']) {
  for (const w of [1440, 390]) R.paleta.v2[`${n}-${w}`] = await analizar(`${base}/screens/qa/v2-h/${n}-${w}.png`);
}
R.paleta.v1 = {};
for (const n of ['home', 'oros', 'articulo', 'calculadora', 'tema', 'watch']) {
  for (const w of [1440, 390]) {
    try { R.paleta.v1[`${n}-${w}`] = await analizar(`${base}/screens/qa/visual/v1/${n}-${w}.png`); } catch (e) { R.paleta.v1[`${n}-${w}`] = { error: String(e).slice(0, 80) }; }
  }
}

// ── jerarquía tipográfica, rejillas y contraste medidos
await page.setViewportSize({ width: 1440, height: 900 });
for (const [k, path] of [['home', '/'], ['oros', '/'], ['videos', '/oros/videos/'], ['ficha', '/oros/videos/tres-cuentas-un-sueldo/'], ['guia', '/oros/guias/tramos-irpf-y-retencion/'], ['calculadora', '/oros/herramientas/interes-compuesto/'], ['glosario', '/oros/glosario/'], ['sobre', '/sobre-4-sotas/'], ['metodologia', '/metodologia/'], ['privacidad', '/privacidad/']]) {
  await page.goto(base + '/4sotas' + path, { waitUntil: 'load' });
  R.jerarquia[k] = await page.evaluate(() => {
    const fs = (sel) => { const e = document.querySelector(sel); return e ? Math.round(parseFloat(getComputedStyle(e).fontSize)) : null; };
    const fam = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).fontFamily.split(',')[0].replace(/["']/g, '') : null; };
    const grids = new Map();
    for (const e of document.querySelectorAll('main *')) {
      const g = getComputedStyle(e).display;
      if (g === 'grid' || g === 'flex') {
        const key = `${g}:${g === 'grid' ? getComputedStyle(e).gridTemplateColumns : getComputedStyle(e).flexDirection}`;
        if (key.length < 90) grids.set(key, (grids.get(key) || 0) + 1);
      }
    }
    const parrafos = [...document.querySelectorAll('main p')].map((p) => {
      const s = getComputedStyle(p);
      const chars = p.textContent.trim().length;
      const w = p.getBoundingClientRect().width;
      return { chars, w: Math.round(w), porLinea: Math.round(chars / Math.max(1, Math.round(p.getBoundingClientRect().height / parseFloat(s.lineHeight)))) };
    });
    const secciones = document.querySelectorAll('main > *, main section').length;
    const sombras = [...document.querySelectorAll('main *')].filter((e) => getComputedStyle(e).boxShadow !== 'none').length;
    const radios = new Set([...document.querySelectorAll('main *')].map((e) => getComputedStyle(e).borderRadius));
    return {
      h1: fs('h1'), h2: fs('main h2'), h3: fs('main h3'), body: fs('main p'), lead: fs('.lead'),
      display: fam('h1'), cuerpo: fam('main p'),
      grids: [...grids.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
      parrafos: parrafos.filter((p) => p.chars > 120).map((p) => p.porLinea).sort((a, b) => a - b).slice(0, 3),
      secciones, sombras, radios: [...radios].slice(0, 5),
    };
  });
}

// ── contraste WCAG de textos clave (calculado con color computado y fondo efectivo)
const lum = (c) => { const [r, g, b] = c.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
for (const [k, path] of [['home', '/'], ['oros', '/'], ['videos', '/oros/videos/'], ['ficha', '/oros/videos/tres-cuentas-un-sueldo/'], ['guia', '/oros/guias/tramos-irpf-y-retencion/'], ['calculadora', '/oros/herramientas/interes-compuesto/'], ['glosario', '/oros/glosario/'], ['sobre', '/sobre-4-sotas/'], ['metodologia', '/metodologia/'], ['privacidad', '/privacidad/']]) {
  await page.goto(base + '/4sotas' + path, { waitUntil: 'load' });
  const muestras = await page.evaluate(() => {
    const fondo = (el) => { let n = el; while (n && n !== document.documentElement) { const b = getComputedStyle(n).backgroundColor; if (b && !/rgba?\(0, 0, 0, 0\)/.test(b)) return b; n = n.parentElement; } return getComputedStyle(document.body).backgroundColor; };
    const pick = [...document.querySelectorAll('main p, main li, main a, main h2, main h3, .lead, .metadata span, small')].filter((e) => e.textContent.trim().length > 8).slice(0, 120);
    return pick.map((e) => ({ t: e.textContent.trim().slice(0, 30), fg: getComputedStyle(e).color, bg: fondo(e), size: Math.round(parseFloat(getComputedStyle(e).fontSize)), weight: getComputedStyle(e).fontWeight }));
  });
  const parse = (s) => s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
  const peores = [];
  for (const m of muestras) {
    const fg = parse(m.fg), bg = parse(m.bg);
    if (fg.length < 3 || bg.length < 3) continue;
    const L1 = lum(fg), L2 = lum(bg);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const grande = m.size >= 24 || (m.size >= 18.66 && Number(m.weight) >= 700);
    const minimo = grande ? 3 : 4.5;
    if (ratio < minimo) peores.push({ t: m.t, fg: m.fg, bg: m.bg, size: m.size, ratio: Number(ratio.toFixed(2)), minimo });
  }
  R.contraste[k] = { muestras: muestras.length, fallos: peores.slice(0, 6), fallos_total: peores.length };
}

await browser.close();
server.close();
await writeFile(`${out}/visual.json`, JSON.stringify(R, null, 2));
console.log('paleta v2 home-1440', JSON.stringify(R.paleta.v2['home-1440']));
console.log('paleta v1 home-1440', JSON.stringify(R.paleta.v1['home-1440']));
console.log('jerarquia home', JSON.stringify(R.jerarquia.home));
console.log('jerarquia videos', JSON.stringify(R.jerarquia.videos));
console.log('contraste', JSON.stringify(Object.fromEntries(Object.entries(R.contraste).map(([k, v]) => [k, { muestras: v.muestras, fallos: v.fallos_total, peor: v.fallos[0] }]))));
