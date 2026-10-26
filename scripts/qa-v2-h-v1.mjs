/** QA V2-H · mismas métricas de jerarquía/rejillas sobre la V1 publicada (comparación). */
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const require = createRequire(resolve(process.env.QA_PACKAGE ?? '../design/qa/package.json'));
const { chromium } = require('playwright');
const ORIGEN = process.env.V1_URL ?? 'https://marcvillarroya.github.io/4sotas';
const RUTAS = { home: '/', oros: '/oros/', videos: '/oros/videos/', ficha: '/oros/videos/irpf-en-la-nomina/', guia: '/oros/guias/tramos-irpf-y-retencion/', calculadora: '/oros/herramientas/interes-compuesto/', glosario: '/oros/glosario/' };
const R = {};
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
for (const [k, path] of Object.entries(RUTAS)) {
  try {
    const resp = await page.goto(ORIGEN + path, { waitUntil: 'load', timeout: 45000 });
    await page.evaluate(() => document.fonts.ready);
    R[k] = await page.evaluate(() => {
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
      return {
        status: 200, doc: document.documentElement.scrollHeight,
        h1: fs('h1'), h2: fs('main h2'), h3: fs('main h3'), body: fs('main p'), lead: fs('.lead'),
        display: fam('h1'), cuerpo: fam('main p'),
        grids: [...grids.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
        secciones: document.querySelectorAll('main > *, main section').length,
        sombras: [...document.querySelectorAll('main *')].filter((e) => getComputedStyle(e).boxShadow !== 'none').length,
        radios: [...new Set([...document.querySelectorAll('main *')].map((e) => getComputedStyle(e).borderRadius))].slice(0, 5),
        h1text: document.querySelector('h1')?.textContent.replace(/\s+/g, ' ').trim(),
      };
    });
    R[k].status = resp.status();
  } catch (e) { R[k] = { error: String(e).slice(0, 120) }; }
}
await browser.close();
await writeFile('qa/v2-h/v1-comparativa.json', JSON.stringify(R, null, 2));
console.log(JSON.stringify(R, null, 1));
