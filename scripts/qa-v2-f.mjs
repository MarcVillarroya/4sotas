/**
 * QA V2-F · calculadora protagonista y conexiones contextuales.
 *
 * Comprueba con Chromium real sobre `dist/`:
 * - calculadora: formulario agrupado, aria-live, métricas, tabla, gráfico, enlaces educativos,
 *   recálculo con los vectores publicados (V6), estado vacío/erróneo, foco tras enviar,
 *   envío con Enter, cero peticiones externas, overflow y axe en 1440/390/320.
 * - guía `dca-interes-compuesto`: bloque «Calcula tu caso» y módulo «Sigue aprendiendo».
 * - home y portal Oros: el módulo de la calculadora apunta a la herramienta.
 *
 * Uso: node scripts/qa-v2-f.mjs   (requiere `npm run build` previo)
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
const out = resolve('qa/v2-f');
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

const texto = (s) => (s ?? '').replace(/[\u00A0\u202F]/g, ' ').trim();

const medir = async (page, name, width) => {
  const dom = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    h1: document.querySelectorAll('h1').length,
    broken: [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src),
    live: document.querySelectorAll('[aria-live]').length,
  }));
  const violations = await axe(page);
  const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  report.pages.push({ name, width, ...dom, violations });
  if ([1440, 390].includes(width)) await page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: true });
  return { dom, violations, graves };
};

try {
  const paginas = [
    ['calculadora', '/oros/herramientas/interes-compuesto/'],
    ['guia-dca', '/oros/guias/dca-interes-compuesto/'],
    ['home', '/'],
    ['oros', '/oros/'],
  ];

  for (const width of [1440, 390, 320]) {
    for (const [name, path] of paginas) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errores = [];
      const externas = [];
      page.on('pageerror', (e) => errores.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') errores.push(m.text());
      });
      page.on('request', (r) => {
        const u = r.url();
        if (!u.startsWith(base) && !u.startsWith('data:')) externas.push(u);
      });
      const respuesta = await page.goto(base + path, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.locator('img').evaluateAll((imgs) => imgs.forEach((i) => (i.loading = 'eager')));
      await page.waitForFunction(() => [...document.images].every((i) => i.complete));

      const { dom, graves } = await medir(page, name, width);
      check(`${name}-${width}-http`, respuesta.status() === 200);
      check(`${name}-${width}-sin-overflow`, !dom.overflow);
      check(`${name}-${width}-un-h1`, dom.h1 === 1);
      check(`${name}-${width}-sin-imagenes-rotas`, dom.broken.length === 0, dom.broken);
      check(`${name}-${width}-axe-sin-graves`, graves.length === 0, graves);
      check(`${name}-${width}-sin-terceros`, externas.length === 0, externas);
      check(`${name}-${width}-sin-errores-js`, errores.length === 0, errores);

      if (name === 'calculadora') {
        check(`${name}-${width}-cuatro-grupos`, (await page.locator('fieldset.v2-calc-group').count()) === 4);
        check(`${name}-${width}-aria-live`, (await page.locator('#estado-calculo[aria-live]').count()) === 1);
        check(`${name}-${width}-cuatro-metricas`, (await page.locator('.metrics dd [id]').count()) === 4);
        check(`${name}-${width}-tabla-10-anios`, (await page.locator('#tabla-evolucion-cuerpo tr').count()) === 10);
        check(`${name}-${width}-grafico`, (await page.locator('#grafico svg').count()) === 1);
        const cajaForm = await page.locator('.calc-form').boundingBox();
        const cajaResultado = await page.locator('.calc-result').boundingBox();
        if (width >= 1000) {
          check(
            `${name}-${width}-dos-columnas`,
            cajaResultado.x >= cajaForm.x + cajaForm.width - 2,
            { form: cajaForm, resultado: cajaResultado },
          );
        } else {
          check(
            `${name}-${width}-una-columna`,
            cajaResultado.y >= cajaForm.y + cajaForm.height - 2,
            { form: cajaForm, resultado: cajaResultado },
          );
        }
        check(`${name}-${width}-sin-jerga`, !/vector V\d+|build/i.test(await page.locator('main').innerText()));
        for (const [etiqueta, href] of [
          ['guia', '/4sotas/oros/guias/dca-interes-compuesto/'],
          ['video', '/4sotas/oros/videos/deuda-o-inversion-1000/'],
          ['tae', '/4sotas/oros/glosario/tae/'],
          ['dca', '/4sotas/oros/glosario/dca-aportacion-periodica/'],
        ]) {
          check(
            `${name}-${width}-enlace-${etiqueta}`,
            (await page.locator(`.v2-calc-learn a[href="${href}"]`).count()) >= 1,
          );
        }

        // Recálculo con un vector publicado (V6: 200 €/mes, 20 años, 5 % = 81.160,90 €).
        await page.fill('#capitalInicial', '0');
        await page.fill('#aportacionPeriodica', '200');
        await page.fill('#anios', '20');
        check(`${name}-${width}-editar-retira`, texto(await page.locator('#capital-final').innerText()) === '—');
        check(`${name}-${width}-aviso-neutro`, await page.locator('#aviso-resultado').isVisible());
        await page.click('button[type=submit]');
        check(
          `${name}-${width}-vector-v6`,
          texto(await page.locator('#capital-final').innerText()) === '81.160,90 €',
          await page.locator('#capital-final').innerText(),
        );
        check(
          `${name}-${width}-tabla-20`,
          (await page.locator('#tabla-evolucion-cuerpo tr').count()) === 20,
        );
        check(
          `${name}-${width}-foco-resultado`,
          await page.evaluate(() => document.activeElement?.id === 'resultado-herramienta'),
        );
        check(`${name}-${width}-aviso-oculto`, !(await page.locator('#aviso-resultado').isVisible()));

        // Estado erróneo: plazo cero. El aviso es visible, accesible y no inventa cifras.
        await page.fill('#anios', '0');
        await page.click('button[type=submit]');
        check(`${name}-${width}-error-aviso`, await page.locator('#aviso-resultado[data-tono="error"]').isVisible());
        check(`${name}-${width}-error-mensaje`, /No se puede calcular todavía: /.test(await page.locator('#aviso-resultado').innerText()));
        check(`${name}-${width}-error-campo`, await page.locator('#error-plazo').isVisible());
        check(
          `${name}-${width}-aria-invalid`,
          (await page.locator('#anios').getAttribute('aria-invalid')) === 'true',
        );
        check(`${name}-${width}-error-sin-cifras`, texto(await page.locator('#capital-final').innerText()) === '—');

        // Teclado: Enter en un campo calcula sin ratón.
        await page.fill('#anios', '10');
        await page.fill('#capitalInicial', '1000');
        await page.fill('#aportacionPeriodica', '100');
        await page.locator('#anios').press('Enter');
        check(
          `${name}-${width}-enter-calcula`,
          texto(await page.locator('#capital-final').innerText()) === '17.065,21 €',
          await page.locator('#capital-final').innerText(),
        );

        // Inflación: el valor real deja de ser «Sin inflación».
        await page.fill('#inflacionAnual', '3');
        await page.locator('#inflacionAnual').press('Enter');
        const real = texto(await page.locator('#valor-real').innerText());
        check(`${name}-${width}-valor-real`, real !== 'Sin inflación' && /€/.test(real), real);
      }

      if (name === 'guia-dca') {
        const banda = page.locator('.v2-calc-band');
        check(`${name}-${width}-banda-calc`, await banda.isVisible());
        check(
          `${name}-${width}-banda-enlace`,
          (await banda.locator(`a[href="/4sotas/oros/herramientas/interes-compuesto/"]`).count()) === 1,
        );
        check(
          `${name}-${width}-sigue-aprendiendo`,
          (await page.locator('#relacionados h2').innerText()).startsWith('Sigue aprendiendo'),
        );
        const tarjetas = await page.locator('#relacionados .v2-learn > li').count();
        check(`${name}-${width}-tarjetas-4`, tarjetas === 4, tarjetas);
        check(
          `${name}-${width}-aside-sigue`,
          (await page.locator('.route-map a[href="#relacionados"]').innerText()).startsWith('Sigue aprendiendo'),
        );
      }

      if (name === 'home' || name === 'oros') {
        check(
          `${name}-${width}-modulo-calculadora`,
          (await page.locator(`a[href="/4sotas/oros/herramientas/interes-compuesto/"]`).count()) >= 1,
        );
      }

      await context.close();
    }
  }

  // Sin JavaScript: la calculadora mantiene el ejemplo, la tabla y los enlaces educativos.
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(base + '/oros/herramientas/interes-compuesto/');
    check(`sin-js-${width}-capital`, texto(await page.locator('#capital-final').innerText()) === '17.065,21 €');
    check(`sin-js-${width}-tabla`, (await page.locator('#tabla-evolucion-cuerpo tr').count()) === 10);
    check(`sin-js-${width}-enlaces`, (await page.locator('.v2-calc-learn a').count()) === 4);
    check(`sin-js-${width}-noscript`, await page.locator('noscript').count());
    await page.goto(base + '/oros/guias/dca-interes-compuesto/');
    check(`sin-js-guia-${width}-banda`, await page.locator('.v2-calc-band').isVisible());
    await context.close();
  }
} finally {
  report.failures =
    report.pages.filter((p) => p.overflow || p.h1 !== 1 || p.broken.length || p.violations.some((v) => ['serious', 'critical'].includes(v.impact)))
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
