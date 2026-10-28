// Métricas de layout del bloque informacion (jerarquía, densidad, saltos, posición).
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
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
const paginas = [
  '/oros/videos/sp500-4-de-cada-10-euros-a-10-posiciones/',
  '/oros/videos/crisis-de-2008-espana/',
  '/oros/videos/tres-cuentas-un-sueldo/',
  '/oros/videos/',
];
const out = [];
for (const path of paginas) {
  for (const width of [1440, 390]) {
    const ctx = await b.newContext({ viewport: { width, height: width === 1440 ? 900 : 844 }, isMobile: width === 390, hasTouch: width === 390, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(base + path, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const m = await page.evaluate(() => {
      const px = (v) => Math.round(parseFloat(v) * 10) / 10;
      const r = (el) => { const x = el.getBoundingClientRect(); return { top: Math.round(x.top + scrollY), left: Math.round(x.left), w: Math.round(x.width), h: Math.round(x.height) }; };
      const cs = (el) => { const s = getComputedStyle(el); return { fs: px(s.fontSize), lh: px(s.lineHeight), ls: s.letterSpacing, color: s.color, maxw: s.maxWidth }; };
      const sec = document.querySelector('#contexto');
      if (!sec) return { sinBloque: true };
      const resumen = sec.querySelector(':scope > p');
      const h2 = sec.querySelector('h2');
      const h3 = sec.querySelector('h3');
      const fac = document.querySelector('.v2-watch');
      const qnc = [...sec.querySelectorAll('p')].find((p) => /Qué no cubre/.test(p.textContent));
      const pq = [...sec.querySelectorAll('p')].find((p) => /Para quién/.test(p.textContent));
      const lineas = (el) => el ? Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)) : null;
      const charsPorLinea = resumen ? Math.round(resumen.textContent.trim().length / lineas(resumen)) : null;
      return {
        docH: Math.round(document.documentElement.scrollHeight),
        bloque: r(sec), video: fac ? r(fac) : null,
        h2: { ...r(h2), ...cs(h2), texto: h2.textContent.trim() },
        resumen: { ...r(resumen), ...cs(resumen), lineas: lineas(resumen), charsPorLinea, texto: resumen.textContent.trim().slice(0, 60) + '…' },
        h3: h3 ? { ...r(h3), ...cs(h3), texto: h3.textContent.trim() } : null,
        queNoCubre: qnc ? { ...r(qnc), ...cs(qnc), lineas: lineas(qnc) } : null,
        paraQuien: pq ? { ...r(pq), ...cs(pq), lineas: lineas(pq) } : null,
        lis: [...sec.querySelectorAll('li')].map((li) => ({ ...r(li), lineas: lineas(li), texto: li.textContent.trim().slice(0, 50) })),
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        palabrasBloque: sec.innerText.trim().split(/\s+/).length,
      };
    });
    out.push({ path, width, ...m });
    await ctx.close();
  }
}
await writeFile(resolve('qa/v2.2-d/layout.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
await b.close(); server.close();
