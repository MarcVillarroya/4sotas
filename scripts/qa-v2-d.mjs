import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
// Reutiliza las herramientas QA instaladas sin cambiar dependencias del sitio.
const require = createRequire(resolve(process.env.QA_PACKAGE ?? '../design/qa/package.json'));
const { chromium } = require('playwright');
const { default: AxeBuilder } = await import(require.resolve('@axe-core/playwright'));
const root = resolve('dist');
const out = resolve('qa/v2-d');
await mkdir(out, { recursive: true });
const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!path.startsWith('/4sotas/')) throw Error('base');
    path = path.slice('/4sotas'.length);
    if (path.endsWith('/')) path += 'index.html';
    const file = resolve(root, '.' + path);
    if (!file.startsWith(root + '/')) throw Error('path');
    const body = await readFile(file);
    res.setHeader('Content-Type', ({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2','.json':'application/json'})[extname(file)] || 'application/octet-stream');
    res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/4sotas`;
const browser = await chromium.launch({ headless: true });
const report = { pages: [], interactions: [], browser: browser.version() };
const check = (name, pass) => { report.interactions.push({ name, pass }); assert.ok(pass, name); };
try {
  for (const width of [1440, 768, 390, 320]) {
    for (const [name, path] of [['home','/'], ['oros','/oros/']]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + path);
      await page.evaluate(() => document.fonts.ready);
      // Load all deferred images before checking their real network result.
      await page.locator('img').evaluateAll(imgs => imgs.forEach(i => i.loading = 'eager'));
      await page.waitForFunction(() => [...document.images].every(i => i.complete));
      const dom = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, h1: document.querySelectorAll('h1').length, broken: [...document.images].filter(i => !i.naturalWidth).map(i => i.src), topics: document.querySelectorAll('.v2-topics li').length, guides: document.querySelectorAll('.v2-guides li').length, videos: document.querySelectorAll('.v2-videos li').length, canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href'), jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map(e => JSON.parse(e.textContent)) }));
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
      const violations = axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) }));
      report.pages.push({ name, width, ...dom, errors, violations });
      if ([1440, 390].includes(width)) await page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: true });
      if (width <= 768) {
        check(`${name}-${width}-channel-visible`, await page.locator('.header-channel').isVisible());
        await page.locator('.mobile-nav summary').focus();
        await page.keyboard.press('Enter');
        check(`${name}-${width}-menu-keyboard`, await page.locator('.mobile-nav nav').isVisible());
        await page.keyboard.press('Escape');
        check(`${name}-${width}-escape`, await page.locator('.mobile-nav').evaluate(e => !e.hasAttribute('open')) && await page.locator('.mobile-nav summary').evaluate(e => e === document.activeElement));
      }
      await context.close();
    }
  }
  for (const width of [1440, 390]) {
    for (const path of ['/sobre-4-sotas/', '/metodologia/', '/privacidad/', '/oros/videos/', '/oros/guias/bruto-a-neto/', '/oros/herramientas/interes-compuesto/']) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const response = await page.goto(base + path);
      check(`shell-http-${path}-${width}`, response.status() === 200);
      check(`shell-overflow-${path}-${width}`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const axe = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
      check(`shell-axe-${path}-${width}`, axe.violations.length === 0);
      await context.close();
    }
  }
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(base + '/');
    await page.getByRole('link', { name: 'Explora Sota de Oros', exact: true }).click();
    check(`home-oros-1-click-${width}`, page.url() === base + '/oros/');
    await page.getByRole('link', { name: 'Abrir la calculadora', exact: true }).first().click();
    check(`oros-calculadora-1-click-${width}`, page.url() === base + '/oros/herramientas/interes-compuesto/');
    await page.goto(base + '/');
    await page.getByRole('link', { name: 'Ver vídeos', exact: true }).click();
    check(`home-videos-1-click-${width}`, page.url() === base + '/oros/videos/');
    await page.goto(base + '/');
    await page.locator('.v2-feature > a').click();
    check(`home-ficha-1-click-${width}`, /\/oros\/videos\/.+\/$/.test(page.url()));
    check(`footer-canal-${width}`, await page.locator('footer a[href*="youtube.com/channel"]').count() === 1);
    if (width === 390) {
      await page.locator('.mobile-nav summary').focus(); await page.keyboard.press('Enter');
      check('no-js-menu', await page.locator('.mobile-nav nav').isVisible());
    }
    await context.close();
  }
} finally {
  report.failures = report.pages.filter(p => p.overflow || p.h1 !== 1 || p.broken.length || p.errors.length || p.violations.length || p.guides !== 3 || p.videos !== 3 || (p.name === 'oros' && p.topics !== 7)).length + report.interactions.filter(i => !i.pass).length;
  await writeFile(out + '/report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ browser: report.browser, pages: report.pages.length, interactions: report.interactions.length, failures: report.failures, violations: report.pages.flatMap(p => p.violations) }, null, 2));
  await browser.close(); server.close();
}
assert.equal(report.failures, 0);
