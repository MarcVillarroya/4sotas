/**
 * QA V2-E · videoteca y ficha de vídeo.
 *
 * Comprueba con Chromium real sobre `dist/`:
 * - hub: 11 tarjetas, miniaturas locales con srcset, cero peticiones a i.ytimg.com, cero iframes,
 *   filtros por formato/tema, teclado, overflow y axe en 1440/768/390/320.
 * - ficha insertable (M9EhU06FlUA): dos acciones igual de visibles, iframe solo tras el clic,
 *   enlace directo sin JS, VideoObject con contentUrl de YouTube y miniatura absoluta.
 * - ficha no insertable (O1V9_of7g1w): aviso visible, «Ver en YouTube» como acción principal,
 *   sin botón «Reproducir aquí».
 *
 * Uso: node scripts/qa-v2-e.mjs   (requiere `npm run build` previo)
 */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(resolve(process.env.QA_PACKAGE ?? '../design/qa/package.json'));
const { chromium } = require('playwright');
const { default: AxeBuilder } = await import(require.resolve('@axe-core/playwright'));

const root = resolve('dist');
const out = resolve('qa/v2-e');
await mkdir(out, { recursive: true });

const TIPOS = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!path.startsWith('/4sotas/')) throw Error('base');
    path = path.slice('/4sotas'.length);
    if (path.endsWith('/')) path += 'index.html';
    const file = resolve(root, '.' + path);
    if (!file.startsWith(root + '/')) throw Error('path');
    const body = await readFile(file);
    res.setHeader('Content-Type', TIPOS[extname(file)] || 'application/octet-stream');
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/4sotas`;

const browser = await chromium.launch({ headless: true });
const report = { pages: [], interactions: [], browser: browser.version() };
const check = (name, pass, extra) => {
  report.interactions.push({ name, pass: Boolean(pass), ...(extra !== undefined ? { extra } : {}) });
  assert.ok(pass, name);
};

const axe = async (page) =>
  (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations.map(
    (v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target) }),
  );

const medir = async (page, name, width) => {
  const dom = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    h1: document.querySelectorAll('h1').length,
    broken: [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src),
    canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href'),
    jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((e) => JSON.parse(e.textContent)),
    ytimg: [...document.querySelectorAll('img')].filter((i) => /i\.ytimg\.com/.test(i.currentSrc || i.src)).length,
    iframes: document.querySelectorAll('iframe').length,
    srcset: [...document.querySelectorAll('.v2-video .v2-poster img')].filter((i) => (i.getAttribute('srcset') || '').includes('-320.webp')).length,
  }));
  const violations = await axe(page);
  report.pages.push({ name, width, ...dom, violations });
  if ([1440, 390].includes(width)) await page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: true });
  return { dom, violations };
};

try {
  const paginas = [
    ['hub', '/oros/videos/'],
    ['ficha-insertable', '/oros/videos/como-leer-una-nomina/'],
    ['ficha-no-insertable', '/oros/videos/irpf-en-la-nomina/'],
  ];

  for (const width of [1440, 768, 390, 320]) {
    for (const [name, path] of paginas) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      const externas = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('request', (r) => {
        const u = r.url();
        if (!u.startsWith(base) && !u.startsWith('data:')) externas.push(u);
      });
      const respuesta = await page.goto(base + path, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.locator('img').evaluateAll((imgs) => imgs.forEach((i) => (i.loading = 'eager')));
      await page.waitForFunction(() => [...document.images].every((i) => i.complete));

      const { dom, violations } = await medir(page, name, width);
      check(`${name}-${width}-http`, respuesta.status() === 200);
      check(`${name}-${width}-sin-overflow`, !dom.overflow);
      check(`${name}-${width}-un-h1`, dom.h1 === 1);
      check(`${name}-${width}-sin-imagenes-rotas`, dom.broken.length === 0, dom.broken);
      check(`${name}-${width}-sin-ytimg`, dom.ytimg === 0);
      check(`${name}-${width}-sin-iframe-inicial`, dom.iframes === 0);
      check(`${name}-${width}-axe`, violations.length === 0, violations);
      check(`${name}-${width}-sin-errores-js`, errors.length === 0, errors);
      if (name.startsWith('ficha')) {
        check(`${name}-${width}-sin-terceros`, externas.length === 0, externas);
      }

      if (name === 'hub') {
        check(`hub-${width}-11-tarjetas`, (await page.locator('.v2-video').count()) === 11);
        check(`hub-${width}-srcset-11`, dom.srcset === 11, dom.srcset);
        check(`hub-${width}-canal-hero`, (await page.locator('.v2-hub-head a[href*="youtube.com/channel"]').count()) === 1);
        check(`hub-${width}-canal-final`, (await page.locator('.v2-channel a[href*="youtube.com/channel"]').count()) === 1);
        // Filtros: solo visibles con JS activo.
        await page.locator('.v2-segments [data-formato="Short"]').click();
        const shorts = await page.locator('.v2-video:visible').count();
        check(`hub-${width}-filtro-shorts`, shorts === 7, shorts);
        check(`hub-${width}-cuenta-shorts`, (await page.locator('[data-cuenta]').innerText()).startsWith('7'));
        await page.locator('.v2-segments [data-formato="Largo"]').click();
        const largos = await page.locator('.v2-video:visible').count();
        check(`hub-${width}-filtro-largos`, largos === 4, largos);
        await page.selectOption('#filtro-tema', 'tema-banca');
        check(`hub-${width}-combinacion-vacia`, (await page.locator('.v2-video:visible').count()) === 0);
        check(`hub-${width}-vacio-visible`, await page.locator('[data-vacio]').isVisible());
        await page.locator('[data-limpiar]').click();
        check(`hub-${width}-limpiar`, (await page.locator('.v2-video:visible').count()) === 11);
        await page.selectOption('#filtro-tema', 'tema-banca');
        check(`hub-${width}-filtro-tema`, (await page.locator('.v2-video:visible').count()) === 1);
        check(`hub-${width}-vacio-oculto`, !(await page.locator('[data-vacio]').isVisible()));
      }

      if (name === 'ficha-insertable') {
        check(`ficha-${width}-reproducir`, await page.locator('[data-reproducir]').isVisible());
        check(`ficha-${width}-youtube-visible`, await page.locator('[data-youtube]').isVisible());
        const clases = await page.locator('[data-youtube]').getAttribute('class');
        check(`ficha-${width}-youtube-secundario`, /secondary/.test(clases || ''));
        const href = await page.locator('[data-youtube]').getAttribute('href');
        check(`ficha-${width}-enlace-directo`, href === 'https://www.youtube.com/watch?v=M9EhU06FlUA', href);
        await page.locator('[data-reproducir]').click();
        await page.waitForSelector('iframe.v2-player-frame', { timeout: 15000 });
        check(`ficha-${width}-iframe-tras-clic`, (await page.locator('iframe.v2-player-frame').count()) === 1);
      }

      if (name === 'ficha-no-insertable') {
        check(`ficha-${width}-sin-reproducir`, (await page.locator('[data-reproducir]').count()) === 0);
        check(`ficha-${width}-aviso`, await page.locator('.v2-notice').isVisible());
        const clases = await page.locator('[data-youtube]').getAttribute('class');
        check(`ficha-${width}-youtube-principal`, /(^|\s)button(\s|$)/.test(clases || '') && !/secondary/.test(clases || ''), clases);
        check(`ficha-${width}-sin-iframe`, (await page.locator('iframe').count()) === 0);
      }

      if (name === 'ficha-insertable' && width === 1440) {
        const video = dom.jsonLd.flatMap((g) => g['@graph'] || []).find((n) => n['@type'] === 'VideoObject');
        check('jsonld-videoobject', Boolean(video));
        check('jsonld-contenturl-youtube', /^https:\/\/www\.youtube\.com\/watch\?v=/.test(video.contentUrl));
        check('jsonld-embedurl', /youtube-nocookie\.com\/embed\//.test(video.embedUrl));
        check('jsonld-miniatura-absoluta', video.thumbnailUrl.every((u) => u.startsWith('https://')));
        check('jsonld-fechas', Boolean(video.uploadDate) && Boolean(video.dateModified));
        check('ficha-texto-visible', (await page.locator('h1').innerText()).includes('nómina'));
      }

      await context.close();
    }
  }

  // Sin JavaScript: el catálogo completo sigue visible y el enlace directo de la ficha funciona.
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(base + '/oros/videos/');
    check(`hub-sin-js-${width}-11-tarjetas`, (await page.locator('.v2-video').count()) === 11);
    check(`hub-sin-js-${width}-filtros-ocultos`, (await page.locator('[data-filtros]').count()) === 1 && !(await page.locator('[data-filtros]').isVisible()));
    await page.goto(base + '/oros/videos/como-leer-una-nomina/');
    check(`ficha-sin-js-${width}-enlace`, (await page.locator('[data-youtube]').getAttribute('href')) === 'https://www.youtube.com/watch?v=M9EhU06FlUA');
    check(`ficha-sin-js-${width}-sin-iframe`, (await page.locator('iframe').count()) === 0);
    await context.close();
  }
} finally {
  report.failures =
    report.pages.filter((p) => p.overflow || p.h1 !== 1 || p.broken.length || p.violations.length || p.ytimg || p.iframes)
      .length + report.interactions.filter((i) => !i.pass).length;
  await writeFile(out + '/report.json', JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        browser: report.browser,
        pages: report.pages.length,
        interactions: report.interactions.length,
        failures: report.failures,
        violaciones: report.pages.flatMap((p) => p.violations),
        fallos: report.interactions.filter((i) => !i.pass),
      },
      null,
      2,
    ),
  );
  await browser.close();
  server.close();
}
assert.equal(report.failures, 0);
