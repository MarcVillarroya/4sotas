/**
 * QA V2-H · verificación integral V2 con Chromium real sobre `dist/`.
 *
 * Secciones: barrido de 10 rutas × 4 anchos (capturas, overflow, axe, canonical,
 * JSON-LD, texto visible), 5 acciones del propietario con clics reales, navegación,
 * tap targets, teclado, rendimiento con caché desactivada, SEO y enlaces internos.
 *
 * Uso: node scripts/qa-v2-h.mjs   (requiere `npm run build` previo)
 * Salida: qa/v2-h/report.json + capturas qa/v2-h/*.png
 */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';

const require = createRequire(resolve(process.env.QA_PACKAGE ?? '../design/qa/package.json'));
const { chromium } = require('playwright');
const { default: AxeBuilder } = await import(require.resolve('@axe-core/playwright'));

const root = resolve('dist');
const out = resolve('qa/v2-h');
await mkdir(out, { recursive: true });

const TIPOS = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain',
};
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
    res.setHeader('Cache-Control', 'no-store');
    res.end(b);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/4sotas`;

const browser = await chromium.launch({ headless: true });
const report = { browser: browser.version(), generated_at: new Date().toISOString(), pages: [], actions: [], nav: [], perf: {}, seo: {}, internal_links: {}, checks: [] };

const PAGINAS = [
  ['home', '/'],
  ['oros', '/oros/'],
  ['videos', '/oros/videos/'],
  ['ficha', '/oros/videos/tres-cuentas-un-sueldo/'],
  ['guia', '/oros/guias/tramos-irpf-y-retencion/'],
  ['calculadora', '/oros/herramientas/interes-compuesto/'],
  ['glosario', '/oros/glosario/'],
  ['sobre', '/sobre-4-sotas/'],
  ['metodologia', '/metodologia/'],
  ['privacidad', '/privacidad/'],
];
const ANCHOS = [1440, 768, 390, 320];
const ALTO = (w) => (w >= 768 ? 900 : 844);
const Internos = [/^v1$/i, /^v2$/i, /\bapi\b/i, /fixture/i, /estado editorial/i, /plan editorial/i, /ficha contrastada/i, /publicadas?/i, /\bmetadata\b/i, /\bbuild\b/i, /\bslug\b/i, /noindex/i, /oembed/i, /frontmatter/i, /pipeline/i, /candidat/i, /borrador/i];

const axeAnalizar = async (page) =>
  (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations.map(
    (v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 4) }),
  );

const textoVisible = () => document.body.innerText.replace(/[\u00A0\u202F]/g, ' ');

// ───────────────────────── 1 · barrido de páginas ─────────────────────────
for (const width of ANCHOS) {
  const ctx = await browser.newContext({ viewport: { width, height: ALTO(width) }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  for (const [name, path] of PAGINAS) {
    const resp = await page.goto(base + path, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('img').evaluateAll((imgs) => imgs.forEach((i) => (i.loading = 'eager')));
    await page.waitForFunction(() => [...document.images].every((i) => i.complete)).catch(() => {});
    const dom = await page.evaluate(() => {
      const txt = document.body.innerText;
      const cans = [...document.querySelectorAll('link[rel="canonical"]')].map((l) => l.href);
      const robots = [...document.querySelectorAll('meta[name="robots"]')].map((m) => m.content);
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
        try { return { ok: true, data: JSON.parse(s.textContent) }; } catch { return { ok: false, raw: s.textContent.slice(0, 120) }; }
      });
      const tapTargets = [...document.querySelectorAll('a[href], button, summary, input, select, textarea')]
        .filter((el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; })
        .map((el) => { const r = el.getBoundingClientRect(); return { tag: el.tagName.toLowerCase(), text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height), inline: getComputedStyle(el).display === 'inline' }; });
      return {
        docHeight: document.documentElement.scrollHeight,
        overflow: document.documentElement.scrollWidth > innerWidth,
        h1: document.querySelectorAll('h1').length,
        h1text: document.querySelector('h1')?.textContent.replace(/\s+/g, ' ').trim(),
        broken: [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src),
        imgs: document.images.length,
        canonicos: cans,
        robots,
        ldParse: ld.every((l) => l.ok),
        ldTypes: ld.flatMap((l) => l.ok ? [].concat(l.data).map((d) => d['@type']) : ['PARSE_ERROR']),
        ldCount: ld.length,
        nodos: document.querySelectorAll('*').length,
        textos: txt,
        audit: document.documentElement.outerHTML.match(/<html[^>]*>/)?.[0] ?? '',
        tapTargets,
      };
    });
    const violations = await axeAnalizar(page);
    const internos = Internos.map((re) => {
      const m = new RegExp(re.source, 'i').exec(dom.textos);
      return m ? { term: re.source, contexto: dom.textos.slice(Math.max(0, m.index - 60), m.index + 80).replace(/\s+/g, ' ') } : null;
    }).filter(Boolean);
    const tapPequenos = width <= 390 ? dom.tapTargets.filter((t) => (t.h < 44 || t.w < 24) && !(t.inline && t.tag === 'a')) : [];
    await page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: true });
    report.pages.push({
      name, path, width, status: resp.status(), ...dom, textos: undefined, tapTargets: undefined,
      violaciones: violations, internos, tapPequenos: tapPequenos.slice(0, 12),
    });
    report.checks.push({ id: `${name}-${width}`, status: resp.status(), overflow: dom.overflow, h1: dom.h1, broken: dom.broken.length, axe: violations.length, internos, tapPequenos: tapPequenos.length });
    console.log(`PAGE ${name}@${width} ${resp.status()} ovf=${dom.overflow} h1=${dom.h1} axe=${violations.length} internos=${JSON.stringify(internos)} taps<44=${tapPequenos.length}`);
  }
  report.errores_consola = (report.errores_consola ?? []).concat(errores);
  await ctx.close();
}

// ───────────────────────── 2 · acciones (clics reales) ─────────────────────────
const abrirContexto = async (width) => {
  const ctx = await browser.newContext({ viewport: { width, height: ALTO(width) }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const externas = [];
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith(base) && !u.startsWith('data:')) externas.push(u); });
  return { ctx, page, externas };
};

/** Pulsa el primer elemento que cumpla el selector dentro de `locator`, midiendo si estaba en viewport. */
const abrirMenu = async (page) => {
  const summary = page.locator('header summary').first();
  if (!(await summary.count()) || !(await summary.isVisible())) return false;
  const abierto = await page.evaluate(() => Boolean(document.querySelector('header details')?.open));
  if (!abierto) { await summary.click(); await page.waitForTimeout(120); return true; }
  return false;
};

const elegirVisible = async (page, selector) => {
  const loc = page.locator(selector);
  const n = await loc.count();
  for (let i = 0; i < n; i++) {
    const el = loc.nth(i);
    if (await el.isVisible()) return el;
  }
  return null;
};

const pulsar = async (page, selector, etiqueta) => {
  let el = await elegirVisible(page, selector);
  let abrioMenu = false;
  if (!el) {
    abrioMenu = await abrirMenu(page);
    el = await elegirVisible(page, selector);
    if (!el) throw new Error(`sin elemento visible para ${selector}`);
  }
  const info = await el.evaluate((n) => {
    const r = n.getBoundingClientRect();
    return { text: (n.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60), href: n.getAttribute('href'), top: Math.round(r.top + scrollY), relTop: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), scrollY: Math.round(scrollY), vh: innerHeight };
  });
  const visibleSinScroll = info.relTop >= 0 && info.relTop + info.h <= info.vh && info.scrollY === 0;
  await el.scrollIntoViewIfNeeded();
  await Promise.all([page.waitForLoadState('load'), el.click()]);
  await page.waitForLoadState('load');
  return { etiqueta, ...info, visibleSinScroll, abrioMenu };
};

const acciones = async (width) => {
  const res = {};
  const vp = { width, height: ALTO(width) };

  // A · encontrar y reproducir un vídeo
  {
    const { ctx, page, externas } = await abrirContexto(width);
    await page.goto(base + '/', { waitUntil: 'load' });
    const pasos = [];
    pasos.push(await pulsar(page, 'header a[href*="/oros/videos/"]', 'header Vídeos'));
    pasos.push(await pulsar(page, 'main a[href*="/oros/videos/tres-cuentas-un-sueldo/"]', 'tarjeta destacada'));
    const ruta = new URL(page.url()).pathname.replace('/4sotas', '');
    const antes = externas.length;
    let reproduccion = null;
    const boton = page.locator('button:has-text("Reproducir"), a:has-text("Reproducir aquí")').first();
    if (await boton.count()) {
      await boton.scrollIntoViewIfNeeded();
      const visible = await boton.evaluate((n) => { const r = n.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; });
      await boton.click();
      await page.waitForTimeout(1200);
      reproduccion = await page.evaluate(() => {
        const f = document.querySelector('iframe');
        return { iframe: Boolean(f), src: f?.src ?? null, aviso: document.body.innerText.match(/no (se ha|está|puede)[^\n.]{0,120}/i)?.[0] ?? null };
      });
      reproduccion.visibleSinScroll = visible;
      reproduccion.peticiones_tras_pulsar = externas.length - antes;
      reproduccion.hosts = [...new Set(externas.slice(antes).map((u) => new URL(u).host))];
      pasos.push({ etiqueta: 'Reproducir aquí', href: null });
    }
    res.A = { clics: pasos.length + pasos.filter((p) => p.abrioMenu).length, pasos, ruta, reproduccion };
    await page.screenshot({ path: `${out}/accion-A-${width}.png`, fullPage: false });
    await ctx.close();
  }

  // A2 · vídeo con inserción deshabilitada (IRPF): estado degradado visible
  {
    const { ctx, page } = await abrirContexto(width);
    await page.goto(base + '/oros/videos/irpf-en-la-nomina/', { waitUntil: 'load' });
    res.A2 = await page.evaluate(() => {
      const txt = document.body.innerText;
      return {
        aviso: /no (está disponible|se puede reproducir|se reproduce)[^\n.]{0,140}/i.exec(txt)?.[0] ?? txt.match(/inserci[^\n.]{0,140}/i)?.[0] ?? null,
        boton_reproducir: Boolean([...document.querySelectorAll('a,button')].find((e) => /reproducir aquí/i.test(e.textContent || ''))),
        enlace_youtube: [...document.querySelectorAll('a')].filter((a) => /youtube\.com\/watch/.test(a.href)).map((a) => a.href),
      };
    });
    await ctx.close();
  }

  // B · canal de YouTube desde la home
  {
    const { ctx, page } = await abrirContexto(width);
    await page.goto(base + '/', { waitUntil: 'load' });
    res.B = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a')].filter((a) => /youtube\.com\/channel/.test(a.href));
      return links.map((a) => {
        const r = a.getBoundingClientRect();
        return { text: a.textContent.replace(/\s+/g, ' ').trim(), enHeader: Boolean(a.closest('header')), enFooter: Boolean(a.closest('footer')), top: Math.round(r.top + scrollY), visibleSinScroll: r.top >= 0 && r.bottom <= innerHeight, h: Math.round(r.height) };
      });
    });
    res.B.clics = 1;
    await ctx.close();
  }

  // C · calculadora desde la home
  {
    const { ctx, page } = await abrirContexto(width);
    await page.goto(base + '/', { waitUntil: 'load' });
    const pasos = [];
    const cta = page.locator('main a[href*="/oros/herramientas/interes-compuesto/"]').first();
    if (await cta.count()) {
      pasos.push(await pulsar(page, 'main a[href*="/oros/herramientas/interes-compuesto/"]', 'CTA Abrir la calculadora (home)'));
    } else {
      pasos.push(await pulsar(page, 'header a[href*="/oros/herramientas/"]', 'header Herramientas'));
      pasos.push(await pulsar(page, 'main a[href*="/oros/herramientas/interes-compuesto/"]', 'tarjeta calculadora'));
    }
    res.C = { clics: pasos.length + pasos.filter((p) => p.abrioMenu).length, pasos, ruta: new URL(page.url()).pathname.replace('/4sotas', '') };
    await ctx.close();
  }

  // D · aprender IRPF desde la home
  {
    const { ctx, page } = await abrirContexto(width);
    await page.goto(base + '/', { waitUntil: 'load' });
    const hints = await page.evaluate(() => ({
      irpf_en_home: (document.body.innerText.match(/IRPF/gi) || []).length,
      buscador: document.querySelectorAll('input[type=search], [role=search]').length,
      enlaces_irpf: [...document.querySelectorAll('a')].filter((a) => /irpf/i.test(a.href)).map((a) => a.getAttribute('href')),
    }));
    const pasos = [];
    pasos.push(await pulsar(page, 'main a[href$="/oros/"]', 'Sota de Oros'));
    const temaNomina = page.locator('main a[href*="/oros/temas/nomina/"]').first();
    if (await temaNomina.count()) pasos.push(await pulsar(page, 'main a[href*="/oros/temas/nomina/"]', 'tema Nómina'));
    const guiaIrpf = page.locator('main a[href*="/oros/guias/tramos-irpf-y-retencion/"]').first();
    if (await guiaIrpf.count()) pasos.push(await pulsar(page, 'main a[href*="/oros/guias/tramos-irpf-y-retencion/"]', 'guía IRPF'));
    res.D = { clics: pasos.length + pasos.filter((p) => p.abrioMenu).length, pasos, ruta: new URL(page.url()).pathname.replace('/4sotas', ''), hints, h1: await page.locator('h1').first().textContent().catch(() => null) };
    await ctx.close();
  }

  // E · de guía IRPF a vídeo/herramienta
  {
    const { ctx, page } = await abrirContexto(width);
    await page.goto(base + '/oros/guias/tramos-irpf-y-retencion/', { waitUntil: 'load' });
    const info = await page.evaluate(() => {
      const rel = document.querySelector('#relacionados') ?? document.querySelector('[id*="relacionad"]');
      const rect = rel?.getBoundingClientRect();
      const enlaces = [...(rel?.querySelectorAll('a') ?? [])].map((a) => ({ text: a.textContent.replace(/\s+/g, ' ').trim().slice(0, 60), href: a.getAttribute('href') }));
      const herramientas = [...document.querySelectorAll('a')].filter((a) => /herramientas/.test(a.getAttribute('href') || '')).map((a) => a.getAttribute('href'));
      return { top: rect ? Math.round(rect.top + scrollY) : null, doc: document.documentElement.scrollHeight, enlaces, herramientas, indice_sigue_aprendiendo: Boolean(document.querySelector('aside a[href="#relacionados"]')) };
    });
    const pasos = [];
    const destino = page.locator('#relacionados a[href*="/oros/videos/"]').first();
    if (await destino.count()) pasos.push(await pulsar(page, '#relacionados a[href*="/oros/videos/"], main a[href*="/oros/videos/"][style*="relac"]', 'Sigue aprendiendo → vídeo'));
    res.E = { clics: pasos.length + pasos.filter((p) => p.abrioMenu).length, pasos, ruta: new URL(page.url()).pathname.replace('/4sotas', ''), ...info };
    await ctx.close();
  }

  return res;
};

for (const width of [1440, 390]) report.actions.push({ width, ...(await acciones(width)) });

// ───────────────────────── 3 · navegación, teclado, menú ─────────────────────────
{
  // home→Oros y home→Vídeos: 1 clic desde elementos visibles (header/CTA)
  for (const width of [1440, 390]) {
    const { ctx, page } = await abrirContexto(width);
    await page.goto(base + '/', { waitUntil: 'load' });
    const home = await page.evaluate(() => {
      const out = {};
      for (const [k, sel] of [['orosHeader', 'header a[href$="/oros/"]'], ['videosHeader', 'header a[href*="/oros/videos/"]'], ['orosCTA', 'main a[href$="/oros/"]'], ['videosCTA', 'main a[href*="/oros/videos/"]']]) {
        const el = document.querySelector(sel);
        if (!el) { out[k] = null; continue; }
        const r = el.getBoundingClientRect();
        out[k] = { text: el.textContent.replace(/\s+/g, ' ').trim(), visibleSinScroll: r.top >= 0 && r.bottom <= innerHeight, top: Math.round(r.top) };
      }
      return out;
    });
    // home→ficha: coste mínimo en clics por BFS sobre enlaces internos
    const bfs = await page.evaluate(() => {
      const norm = (h) => { try { const u = new URL(h, location.origin); return u.pathname.replace('/4sotas', ''); } catch { return null; } };
      const links = [...document.querySelectorAll('a[href]')].map((a) => ({ h: norm(a.href), t: a.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) }));
      return links;
    });
    const fichas = bfs.filter((l) => /^\/oros\/videos\/[^/]+\/$/.test(l.h || ''));
    // menú móvil
    let menu = null;
    if (width === 390) {
      const summary = page.locator('header summary').first();
      menu = { existe: await summary.count() > 0 };
      if (menu.existe) {
        const rect = await summary.evaluate((n) => { const r = n.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), text: n.textContent.trim() }; });
        menu.summary = rect;
        await summary.click();
        await page.waitForTimeout(150);
        menu.abierto = await page.evaluate(() => {
          const det = document.querySelector('header details');
          const items = [...document.querySelectorAll('header details a')].map((a) => { const r = a.getBoundingClientRect(); return { text: a.textContent.replace(/\s+/g, ' ').trim(), w: Math.round(r.width), h: Math.round(r.height), visible: r.height > 0 }; });
          return { open: det?.open ?? false, items, altura: Math.round(det?.getBoundingClientRect().height ?? 0) };
        });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(150);
        menu.cerrado_con_escape = await page.evaluate(() => !document.querySelector('header details')?.open);
        menu.foco_devuelto = await page.evaluate(() => document.activeElement?.tagName.toLowerCase() + ':' + (document.activeElement?.textContent || '').trim().slice(0, 12));
      }
    }
    // teclado: primer Tab = skip link visible con outline
    await page.goto(base + '/', { waitUntil: 'load' });
    const teclado = [];
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      teclado.push(await page.evaluate(() => {
        const el = document.activeElement;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { tag: el.tagName.toLowerCase(), text: (el.textContent || '').trim().slice(0, 30), outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0, w: Math.round(r.width), h: Math.round(r.height) };
      }));
    }
    report.nav.push({ width, home, fichas_desde_home: fichas.length, ficha_ejemplo: fichas[0] ?? null, menu, teclado });
    await ctx.close();
  }
}

// ───────────────────────── 4 · rendimiento ─────────────────────────
for (const width of [1440, 390]) {
  const { ctx, page } = await abrirContexto(width);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await page.goto('about:blank');
  await page.goto(base + '/oros/videos/', { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('img').evaluateAll((imgs) => imgs.forEach((i) => (i.loading = 'eager')));
  await page.waitForFunction(() => [...document.images].every((i) => i.complete)).catch(() => {});
  await page.waitForTimeout(1200);
  const perf = await page.evaluate(() => {
    const res = performance.getEntriesByType('resource');
    const b = (re) => res.filter((r) => re.test(r.name)).reduce((s, r) => s + (r.transferSize || 0), 0);
    const nav = performance.getEntriesByType('navigation')[0];
    const lcp = performance.getEntriesByType('largest-contentful-paint').at(-1);
    const imgs = [...document.images].map((i) => ({ src: i.currentSrc, w: i.getAttribute('width'), nat: `${i.naturalWidth}x${i.naturalHeight}`, bytes: res.find((r) => r.name === i.currentSrc)?.transferSize ?? 0, loading: i.loading, sizes: i.getAttribute('sizes') }));
    return {
      peticiones: res.length + 1,
      transferido: res.reduce((s, r) => s + (r.transferSize || 0), 0),
      js: b(/\.js(\?|$)/),
      css: b(/\.css(\?|$)/),
      fuentes: b(/\.woff2/),
      miniaturas_ytimg: b(/i\.ytimg\.com/),
      peticiones_ytimg: res.filter((r) => /i\.ytimg\.com/.test(r.name)).length,
      webp: b(/\.webp/),
      imagenes: res.filter((r) => /\.(webp|jpg|png)$/.test(r.name)).length,
      lcp_ms: Math.round(lcp?.startTime ?? 0),
      dcl: Math.round(nav?.domContentLoadedEventEnd ?? 0),
      load: Math.round(nav?.loadEventEnd ?? 0),
      nodos: document.querySelectorAll('*').length,
      imgs: imgs.slice(0, 15),
      iframes: document.querySelectorAll('iframe').length,
    };
  });
  report.perf[`videos-${width}`] = perf;
  console.log(`PERF videos@${width}`, JSON.stringify({ p: perf.peticiones, bytes: perf.transferido, ytimg: perf.peticiones_ytimg, webp: perf.webp, js: perf.js }));
  // home y ficha para comparar peso base
  for (const [name, path] of [['home', '/'], ['ficha', '/oros/videos/tres-cuentas-un-sueldo/']]) {
    await page.goto('about:blank');
    await page.goto(base + path, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);
    report.perf[`${name}-${width}`] = await page.evaluate(() => {
      const res = performance.getEntriesByType('resource');
      const lcp = performance.getEntriesByType('largest-contentful-paint').at(-1);
      return { peticiones: res.length + 1, transferido: res.reduce((s, r) => s + (r.transferSize || 0), 0), js: res.filter((r) => /\.js(\?|$)/.test(r.name)).reduce((s, r) => s + (r.transferSize || 0), 0), fuentes: res.filter((r) => /\.woff2/.test(r.name)).reduce((s, r) => s + (r.transferSize || 0), 0), lcp_ms: Math.round(lcp?.startTime ?? 0), iframes: document.querySelectorAll('iframe').length };
    });
  }
  // CLS por observación durante la carga (contexto nuevo para no heredar estado)
  const ctx2 = await browser.newContext({ viewport: { width, height: ALTO(width) } });
  const p2 = await ctx2.newPage();
  await p2.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
  for (const [name, path] of [['home', '/'], ['videos', '/oros/videos/'], ['ficha', '/oros/videos/tres-cuentas-un-sueldo/'], ['calculadora', '/oros/herramientas/interes-compuesto/']]) {
    await p2.goto(base + path, { waitUntil: 'load' });
    await p2.evaluate(() => document.fonts.ready);
    await p2.waitForTimeout(800);
    report.perf[`cls-${name}-${width}`] = await p2.evaluate(() => Number(window.__cls.toFixed(4)));
  }
  await ctx2.close();
  await ctx.close();
}

// ───────────────────────── 5 · SEO y enlaces internos ─────────────────────────
{
  const canon = {};
  const ldTypes = {};
  const noindex = [];
  const internos = new Set();
  for (const [name, path] of PAGINAS) {
    const html = await readFile(resolve(root, '.' + (path === '/' ? '/index.html' : `${path}index.html`)), 'utf8');
    const cans = [...html.matchAll(/<link[^>]+rel="canonical"[^>]*>/g)].map((m) => m[0]);
    canon[name] = cans;
    ldTypes[name] = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => { try { const d = JSON.parse(m[1]); return (Array.isArray(d) ? d : [d]).map((x) => x['@type']); } catch { return 'PARSE_ERROR'; } });
    if (/name="robots"[^>]*noindex/.test(html)) noindex.push(name);
    for (const m of html.matchAll(/href="(\/4sotas\/[^"#?]*)/g)) internos.add(m[1]);
  }
  const sitemap = await readFile(resolve(root, 'sitemap-0.xml'), 'utf8').catch(() => '');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const robots = await readFile(resolve(root, 'robots.txt'), 'utf8').catch(() => null);
  const videoLd = await (async () => {
    const html = await readFile(resolve(root, 'oros/videos/tres-cuentas-un-sueldo/index.html'), 'utf8');
    const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const flat = blocks.flatMap((b) => (Array.isArray(b) ? b : b['@graph'] ?? [b]));
    return flat.filter((n) => n['@type'] === 'VideoObject').map((v) => ({ keys: Object.keys(v), contentUrl: v.contentUrl, embedUrl: v.embedUrl, thumbnailUrl: v.thumbnailUrl, uploadDate: v.uploadDate, name: Boolean(v.name), description: Boolean(v.description), duration: v.duration }));
  })();
  // comprobar HTTP de todos los enlaces internos
  const fallos = [];
  for (const href of [...internos].sort()) {
    let r;
    try { r = await fetch(base.replace(/\/4sotas$/, '') + href, { redirect: 'manual' }); } catch (e) { fallos.push({ href, error: e.message }); continue; }
    if (r.status >= 400) fallos.push({ href, status: r.status });
  }
  // 404
  const r404 = await fetch(`${base}/ruta-inexistente-de-prueba/`);
  report.seo = { canonical: canon, ldTypes, noindex, sitemap_urls: urls.length, sitemap_muestra: urls.slice(0, 3), robots_txt: robots ? { bytes: robots.length, primera_linea: robots.split('\n')[0], sitemap: /Sitemap:/.test(robots) } : null, video_ld: videoLd };
  report.internal_links = { total: internos.size, fallos };
  report.seo.status_404 = r404.status;
  console.log('SEO', JSON.stringify({ canon: Object.fromEntries(Object.entries(canon).map(([k, v]) => [k, v.length])), noindex, sitemap: urls.length, enlaces: internos.size, fallos: fallos.length, r404: r404.status, video: videoLd[0]?.keys }));
}

await browser.close();
server.close();
await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
console.log('\nRESUMEN', JSON.stringify({
  paginas: report.pages.length,
  axe_total: report.pages.reduce((s, p) => s + p.violaciones.length, 0),
  overflow: report.pages.filter((p) => p.overflow).length,
  internos: [...new Set(report.pages.flatMap((p) => p.internos))],
  tap_pequenos: report.pages.reduce((s, p) => s + p.tapPequenos.length, 0),
  errores_consola: (report.errores_consola ?? []).length,
}, null, 1));
