// Sonda: ¿el hallazgo label-content-name-mismatch de .v2-poster es nuevo o preexistente?
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const require = createRequire(resolve('../design/qa/package.json'));
const { chromium } = require('playwright');
const { default: AxeBuilder } = await import(require.resolve('@axe-core/playwright'));
const root = resolve('dist');
const server = createServer(async (req, res) => {
  try {
    let p = new URL(req.url, 'http://x').pathname.slice('/4sotas'.length);
    if (p.endsWith('/')) p += 'index.html';
    const f = resolve(root, '.' + decodeURIComponent(p));
    res.setHeader('Content-Type', { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' }[extname(f)] || 'application/octet-stream');
    res.end(await readFile(f));
  } catch { res.writeHead(404); res.end('x'); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/4sotas`;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
const page = await ctx.newPage();
await page.goto(base + '/oros/videos/', { waitUntil: 'load' });
const sets = {
  previo_QA: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
  con_wcag21a: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
};
for (const [k, tags] of Object.entries(sets)) {
  const a = await new AxeBuilder({ page }).withTags(tags).analyze();
  console.log(k, a.violations.map((v) => v.id + ':' + v.nodes.length));
}
const node = await page.evaluate(() => {
  const el = document.querySelector('.v2-poster');
  return { outer: el.outerHTML.slice(0, 700), name: el.getAttribute('aria-label'), text: el.innerText.replace(/\s+/g, ' ').slice(0, 200), role: el.getAttribute('role'), tag: el.tagName };
});
console.log(JSON.stringify(node, null, 1));
await b.close(); server.close();
