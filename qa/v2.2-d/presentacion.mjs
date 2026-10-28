// Comprobaciones objetivas de presentación (recorte, contraste, palabras partidas).
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const require = createRequire(resolve('../design/qa/package.json'));
const { chromium } = require('playwright');
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
const res = [];
for (const path of ['/oros/videos/sp500-4-de-cada-10-euros-a-10-posiciones/', '/oros/videos/crisis-de-2008-espana/', '/oros/videos/']) {
  for (const width of [1440, 390]) {
    const ctx = await b.newContext({ viewport: { width, height: width === 1440 ? 900 : 844 }, isMobile: width === 390, hasTouch: width === 390, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(base + path, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const m = await page.evaluate(() => {
      const parse = (c) => c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
      const lum = ([r, g, bl]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl); };
      const bgOf = (el) => { let n = el; while (n) { const c = getComputedStyle(n).backgroundColor; if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return parse(c); n = n.parentElement; } return [0, 0, 0]; };
      const ratio = (el) => { const fg = parse(getComputedStyle(el).color); const bg = bgOf(el); const [a, c] = [lum(fg), lum(bg)].sort((x, y) => y - x); return Math.round(((a + 0.05) / (c + 0.05)) * 100) / 100; };
      const sec = document.querySelector('#contexto');
      const scope = sec ?? document.body;
      const clipped = [...scope.querySelectorAll('*')].filter((el) => el.children.length === 0 && el.scrollHeight > el.clientHeight + 1 && el.clientHeight > 0).map((el) => el.tagName + '.' + el.className);
      const texts = [...scope.querySelectorAll('p, li, h2, h3')].map((el) => ({ sel: el.tagName + (el.className ? '.' + el.className : ''), ratio: ratio(el), fs: parseFloat(getComputedStyle(el).fontSize) }));
      const peor = texts.sort((a, b) => a.ratio - b.ratio).slice(0, 4);
      const palabraPartida = [...scope.querySelectorAll('p, li')].filter((el) => /[a-záéíóúñ]-$/.test(el.innerText.trim())).length;
      return { recortados: clipped, contraste: peor, palabraPartida, honest: [...document.querySelectorAll('p.honest')].map((p) => ({ ratio: ratio(p), texto: p.innerText.slice(0, 40) })) };
    });
    res.push({ path, width, ...m });
    await ctx.close();
  }
}
console.log(JSON.stringify(res, null, 1));
await b.close(); server.close();
