import { createRequire } from 'node:module';
import { writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(process.env.VISUAL_QA_PACKAGE ?? '/home/mvf/4sotas/design/qa/package.json');
const { chromium } = require('playwright');
const base = process.env.VISUAL_QA_URL ?? 'http://127.0.0.1:4327/4sotas';
const browser = await chromium.launch({ headless: true });
const results = [];
const check = (name, value) => { assert.ok(value, name); results.push({ name, pass: true }); };
await mkdir('qa/visual/states', { recursive: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
  const external = [];
  await context.route('**/*', route => {
    if (!route.request().url().startsWith(new URL(base).origin)) { external.push(route.request().url()); return route.abort(); }
    return route.continue();
  });
  const page = await context.newPage();
  await page.goto(`${base}/oros/herramientas/interes-compuesto/`);
  await page.locator('#capitalInicial').fill('2000');
  check('editar retira capital, gráfico y tabla anteriores', await page.locator('#capital-final').textContent() === '—' && await page.locator('#tabla-evolucion-cuerpo tr').count() === 0 && await page.locator('#grafico svg').count() === 0);
  await page.locator('#aportacionPeriodica').fill('0');
  await page.locator('#rentabilidadAnual').fill('0');
  await page.getByRole('button', { name: 'Calcular', exact: true }).click();
  check('submit calcula tasa cero sin enviar datos', (await page.locator('#capital-final').textContent()).includes('2000,00') && external.length === 0);
  await page.locator('#capitalInicial').fill('incorrecto');
  await page.getByRole('button', { name: 'Calcular', exact: true }).click();
  check('inválido retira resultado y enfoca campo con aria-invalid', await page.locator('#capital-final').textContent() === '—' && await page.locator('#capitalInicial').getAttribute('aria-invalid') === 'true' && await page.evaluate(() => document.activeElement.id) === 'capitalInicial');
  await page.screenshot({ path: 'qa/visual/states/calculadora-error-390.png' });
  await page.locator('#capitalInicial').fill('1000');
  await page.getByRole('button', { name: 'Calcular', exact: true }).click();
  const table = page.getByRole('region', { name: 'Evolución anual de la simulación' });
  await table.focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(150);
  check('tabla tiene foco y scroll horizontal propio por teclado', await table.evaluate(e => e.scrollLeft > 0));
  check('documento móvil no desborda con tabla', await page.evaluate(() => document.documentElement.scrollWidth === innerWidth));
  await page.goto(base + '/');
  await page.keyboard.press('Tab');
  check('skip link primero y visible al recibir foco', await page.evaluate(() => document.activeElement.classList.contains('skip') && document.activeElement.getBoundingClientRect().top >= 0));
  await page.keyboard.press('Enter');
  check('skip llega al main', await page.evaluate(() => document.activeElement.id === 'contenido'));
  const button = page.locator('.actions .button').first();
  await button.focus();
  check('foco visible 3px en CTA', await button.evaluate(e => getComputedStyle(e).outlineWidth === '3px'));
  await button.hover();
  check('hover ámbar y reduced-motion sin transición', await button.evaluate(e => getComputedStyle(e).backgroundColor === 'rgb(240, 168, 72)' && getComputedStyle(e).transitionDuration === '0s' && getComputedStyle(document.documentElement).scrollBehavior === 'auto'));
  await page.screenshot({ path: 'qa/visual/states/home-focus-390.png' });
  await context.close();

  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  const staticPage = await nojs.newPage();
  await staticPage.goto(`${base}/oros/herramientas/interes-compuesto/`);
  check('sin JS identifica ejemplo estático', await staticPage.locator('noscript').innerText().then(s => s.includes('únicamente el ejemplo inicial')));
  await nojs.close();

  // Controlled UI fixture: verifies states, not availability or playback on YouTube.
  const videoContext = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const video = await videoContext.newPage();
  const watch = `${base}/oros/videos/como-leer-una-nomina/`;
  let connections = 0;
  await videoContext.route('https://www.youtube-nocookie.com/**', async () => {
    connections++;
    // Deliberately hold the frame until the UI timeout; never contact YouTube.
  });
  await video.clock.install();
  await video.goto(watch);
  check('facade no conecta ni crea iframe antes de clic', connections === 0 && await video.locator('iframe').count() === 0);
  await video.locator('[data-cargar]').click();
  check('carga real solicitada: busy y mensaje legible', await video.locator('[data-facade]').getAttribute('aria-busy') === 'true' && (await video.locator('[data-estado]').innerText()).includes('Conectando'));
  await video.screenshot({ path: 'qa/visual/states/watch-loading-390.png' });
  await video.clock.fastForward(13000);
  check('timeout recuperable con enlace directo', await video.getByRole('button', { name: 'Reintentar la carga' }).isEnabled() && await video.locator('iframe').count() === 0 && await video.getByRole('link', { name: 'Ver el vídeo directamente en YouTube' }).isVisible());
  await video.screenshot({ path: 'qa/visual/states/watch-error-390.png' });
  await videoContext.unroute('https://www.youtube-nocookie.com/**');
  await videoContext.route('https://www.youtube-nocookie.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Controlled UI fixture; not YouTube playback</title>' }));
  await video.getByRole('button', { name: 'Reintentar la carga' }).click();
  await video.locator('.player.loaded').waitFor();
  const frame = video.locator('iframe');
  check('iframe visible, titulado, sin autoplay, proporción 16:9', await frame.isVisible() && !(await frame.getAttribute('src')).includes('autoplay') && await frame.evaluate(e => Math.abs(e.getBoundingClientRect().width / e.getBoundingClientRect().height - 16 / 9) < .01));
  await video.screenshot({ path: 'qa/visual/states/watch-loaded-fixture-390.png' });
  await videoContext.close();
} finally {
  await writeFile('qa/visual/states/results.json', JSON.stringify({ scope: 'Chromium UI; iframe load uses controlled fixture, no live playback assertion', results }, null, 2));
  await browser.close();
}
console.log(`${results.length} UI checks passed`);
