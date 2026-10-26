// Fugas de fixtures, enlaces externos y JSON-LD engañoso en la salida pública.
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.argv[2] ?? 'dist';
function walk(dir, out = []) {
  for (const e of readdirSync(dir)) { const p = join(dir, e); statSync(p).isDirectory() ? walk(p, out) : out.push(p); }
  return out;
}
const files = walk(root);
const htmls = files.filter((f) => f.endsWith('.html'));

const fugas = [];
const externos = new Set();
const jsonld = [];
for (const f of htmls) {
  const h = readFileSync(f, 'utf8');
  if (/example\.org|fixture|demo-|termino-fixture|lorem ipsum/i.test(h)) fugas.push(relative(root, f));
  for (const m of h.matchAll(/href="(https?:\/\/[^"]+)"/g)) externos.add(m[1]);
  for (const m of h.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { jsonld.push({ f: relative(root, f), ...JSON.parse(m[1]) }); } catch {}
  }
}

const prohibidos = /aggregateRating|reviewRating|"rating"|priceCurrency|duration_claims|"offers"/i;
const conRating = jsonld.filter((j) => prohibidos.test(JSON.stringify(j))).map((j) => j.f);
const tipos = [];
for (const j of jsonld) {
  const lista = Array.isArray(j['@graph']) ? j['@graph'] : [j];
  for (const n of lista) if (n['@type']) tipos.push(n['@type']);
}
const conteo = tipos.reduce((a, t) => { a[t] = (a[t] ?? 0) + 1; return a; }, {});

// comprobacion HTTP real de enlaces externos (solo cabeceras, con IPv4)
const resultados = [];
for (const url of [...externos]) {
  try {
    const r = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) Chrome/131' } });
    resultados.push({ url, status: r.status });
  } catch (e) { resultados.push({ url, status: 0, error: e.message }); }
}
const malos = resultados.filter((r) => r.status >= 400 || r.status === 0);

console.log(JSON.stringify({ html: htmls.length, fugasFixture: fugas, externosUnicos: externos.size, jsonldNodos: jsonld.length, tiposJsonLd: conteo, conRatingOPrecios: conRating, externosNoOk: malos }, null, 1));
