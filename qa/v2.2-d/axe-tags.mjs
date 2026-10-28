// axe con el juego de tags de la QA V2.1 en las 3 rutas afectadas.
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
    res.setHeader('Content-Type', { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[extname(f)] || 'application/octet-stream');
    res.end(await readFile(f));
  } catch { res.writeHead(404); res.end('x'); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/4sotas`;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const out = [];
for (const path of ['/', '/oros/', '/oros/videos/']) {
  await page.goto(base + path, { waitUntil: 'load' });
  const a = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  const c = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  out.push({ path, tagsV21: a.violations.map((v) => v.id), tagsAmpliado: c.violations.map((v) => v.id + ':' + v.nodes.length) });
}
console.log(JSON.stringify(out, null, 1));
await b.close(); server.close();
