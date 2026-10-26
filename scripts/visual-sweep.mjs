import { createRequire } from 'node:module';
import { readdir, writeFile } from 'node:fs/promises';
const require = createRequire(process.env.VISUAL_QA_PACKAGE ?? '/home/mvf/4sotas/design/qa/package.json');
const { chromium } = require('playwright');
const base = process.env.VISUAL_QA_URL ?? 'http://127.0.0.1:4327/4sotas';
const files = (await readdir('dist-fixtures', { recursive: true })).filter(f => f.endsWith('.html'));
const browser = await chromium.launch({ headless: true });
const entries = [];
try {
  for (const width of [1440, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.route('**/*', route => route.request().url().startsWith(new URL(base).origin) ? route.continue() : route.abort());
    for (const file of files) {
      const path = '/' + file.replace(/index\.html$/, '');
      const response = await page.goto(base + path);
      await page.evaluate(() => document.fonts.ready);
      const layout = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, h1: document.querySelectorAll('h1').length }));
      entries.push({ path, width, status: response.status(), ...layout });
    }
    await page.close();
  }
} finally { await browser.close(); }
const failures = entries.filter(e => e.document > e.width || e.h1 !== 1 || e.status !== 200);
await writeFile('qa/visual/route-sweep.json', JSON.stringify({ pages: files.length, entries, failures }, null, 2));
console.log(JSON.stringify({ pages: files.length, views: entries.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
