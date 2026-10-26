import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
// Reuse isolated F0 browser tooling; no runtime or lockfile dependency added.
const require = createRequire(process.env.VISUAL_QA_PACKAGE ?? '/home/mvf/4sotas/design/qa/package.json');
const { chromium } = require('playwright');
const { default: AxeBuilder } = await import(require.resolve('@axe-core/playwright'));
const phase = process.argv[2] ?? 'after';
const base = process.env.VISUAL_QA_URL ?? 'http://127.0.0.1:4327/4sotas';
const routes = {
  home: '/', oros: '/oros/', tema: '/oros/temas/ahorro/',
  articulo: '/oros/guias/primeros-1000-euros/', watch: '/oros/videos/como-leer-una-nomina/',
  calculadora: '/oros/herramientas/interes-compuesto/',
};
const dir = `qa/visual/${phase}`;
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const entries = [];
try {
  for (const width of [1440, 768, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    // Audit must never contact third parties, including thumbnails in fixture catalogs.
    await context.route('**/*', route => route.request().url().startsWith(base.split('/4sotas')[0]) ? route.continue() : route.abort());
    for (const [name, path] of Object.entries(routes)) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(base + path);
      await page.evaluate(() => document.fonts.ready);
      const layout = await page.evaluate(() => ({
        viewport: innerWidth, document: document.documentElement.scrollWidth,
        h1: document.querySelectorAll('h1').length,
        fonts: document.fonts.check('18px Inter') && document.fonts.check('40px "Archivo Black"'),
        overflow: [...document.querySelectorAll('body *')].filter(e => {
          const r = e.getBoundingClientRect();
          return r.width && (r.right > innerWidth + 1 || r.left < -1) && !e.closest('.table-wrap') && getComputedStyle(e).position !== 'absolute';
        }).slice(0, 15).map(e => `${e.tagName}.${e.className}`),
      }));
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
      let file = null, sha256 = null;
      if (width !== 320) {
        file = `${dir}/${name}-${width}.png`;
        const bytes = await page.screenshot({ path: file, fullPage: true });
        sha256 = createHash('sha256').update(bytes).digest('hex');
      }
      entries.push({ name, path, width, status: response.status(), file, sha256, ...layout, errors,
        violations: axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })) });
      await writeFile(`${dir}/manifest.json`, JSON.stringify({ base, phase, entries }, null, 2));
      console.log(`${phase} ${name} ${width}: ${response.status()} overflow=${layout.document > width} axe=${axe.violations.length}`);
      await page.close();
    }
    await context.close();
  }
} finally { await browser.close(); }
const failures = entries.filter(e => e.status !== 200 || e.document > e.width || e.errors.length || e.violations.length || !e.fonts || e.h1 !== 1);
console.log(JSON.stringify({ views: entries.length, screenshots: entries.filter(e => e.file).length, failures: failures.length }));
if (phase === 'after' && failures.length) process.exitCode = 1;
