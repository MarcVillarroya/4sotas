// QA integral F1 - comprobaciones sobre la salida construida (sin dependencias).
// Uso: node qa/f1-integral/check-html.mjs <dir-dist> [<dir-fixtures-comparacion>]
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.argv[2];
if (!root) { console.error('falta dir'); process.exit(2); }
const SITE = 'https://marcvillarroya.github.io';
const BASE = '/4sotas';

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
const files = walk(root);
const htmls = files.filter((f) => f.endsWith('.html'));
const rels = htmls.map((f) => '/' + relative(root, f).replace(/index\.html$/, ''));

const issues = [];
const stats = { html: htmls.length, h1: {}, lang: new Set(), canonicals: [], jsonld: 0, jsonldBad: 0, iframes: 0, nojsContent: [], imgs: 0, imgsNoAlt: 0, forms: 0, labels: 0, inputs: 0, skip: 0 };

function routeForFile(f) {
  const r = relative(root, f).replace(/\\/g, '/');
  if (r === 'index.html') return '/';
  if (r.endsWith('/index.html')) return '/' + r.slice(0, -'index.html'.length);
  return '/' + r;
}

const linkTargets = new Set();

for (const f of htmls) {
  const route = routeForFile(f);
  const html = readFileSync(f, 'utf8');
  const h1s = html.match(/<h1\b/gi) || [];
  stats.h1[route] = h1s.length;
  if (h1s.length !== 1) issues.push(`H1=${h1s.length} en ${route}`);
  const lang = (html.match(/<html[^>]*\blang="([^"]+)"/i) || [])[1];
  if (!lang) issues.push(`sin lang en ${route}`); else stats.lang.add(lang);
  if (lang !== 'es-ES') issues.push(`lang="${lang}" (esperado es-ES) en ${route}`);
  const canonical = (html.match(/<link[^>]+rel="canonical"[^>]*href="([^"]+)"/i) || [])[1];
  const canonicalCount = (html.match(/rel="canonical"/gi) || []).length;
  stats.canonicals.push([route, canonical, canonicalCount]);
  if (canonicalCount !== 1) issues.push(`canonical count=${canonicalCount} en ${route}`);
  if (canonical && !canonical.startsWith(SITE + BASE)) issues.push(`canonical fuera de origen/base: ${canonical} en ${route}`);
  if (canonical && new URL(canonical).origin.includes('4sotas.com')) issues.push(`canonical a dominio no comprado en ${route}`);
  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1];
  if (!title || !title.trim()) issues.push(`sin <title> en ${route}`);
  const desc = (html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i) || [])[1];
  if (!desc || desc.length < 40) issues.push(`description corta/ausente en ${route}`);
  // JSON-LD
  const blocks = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of blocks) {
    stats.jsonld++;
    try { JSON.parse(b[1]); } catch (e) { stats.jsonldBad++; issues.push(`JSON-LD invalido en ${route}: ${e.message}`); }
  }
  // iframes / embeds
  stats.iframes += (html.match(/<iframe\b/gi) || []).length;
  // imagenes sin alt
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    stats.imgs++;
    if (!/\balt=/.test(m[0])) { stats.imgsNoAlt++; issues.push(`img sin alt en ${route}: ${m[0].slice(0, 80)}`); }
  }
  // formularios / labels
  stats.forms += (html.match(/<form\b/gi) || []).length;
  const inputs = [...html.matchAll(/<(input|select|textarea)\b[^>]*>/gi)];
  stats.inputs += inputs.length;
  const labelFor = new Set([...html.matchAll(/<label\b[^>]*\bfor="([^"]+)"/gi)].map((m) => m[1]));
  for (const inp of inputs) {
    const s = inp[0];
    const id = (s.match(/\bid="([^"]+)"/) || [])[1];
    const aria = /\baria-label(ledby)?=/.test(s);
    const type = (s.match(/\btype="([^"]+)"/) || [])[1];
    if (type === 'hidden') continue;
    if (!aria && !(id && labelFor.has(id))) issues.push(`control sin label accesible en ${route}: ${s.slice(0, 90)}`);
  }
  stats.labels += labelFor.size;
  if (/<a[^>]+href="#(main|contenido|skip)/i.test(html)) stats.skip++;
  // contenido principal sin JS
  const mainM = html.match(/<main[\s\S]*?<\/main>/i);
  if (mainM) {
    const text = mainM[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    stats.nojsContent.push([route, text.length]);
    if (text.length < 200) issues.push(`main con poco texto (${text.length}) en ${route}`);
  } else issues.push(`sin <main> en ${route}`);
  // enlaces internos
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const h = m[1];
    if (h.startsWith('/4sotas')) linkTargets.add(h);
    else if (h.startsWith('/') && !h.startsWith('//')) linkTargets.add(h);
  }
}

// resolucion de enlaces internos contra ficheros construidos
const missing = [];
for (const href of linkTargets) {
  let p = href.startsWith(BASE) ? href.slice(BASE.length) : href;
  p = p.split('#')[0].split('?')[0];
  if (!p) continue;
  const cands = [join(root, p), join(root, p, 'index.html'), join(root, p.replace(/\/$/, '') + '.html')];
  if (!cands.some((c) => existsSync(c) && statSync(c).isFile())) missing.push(href);
}

// sitemap
const smF = join(root, 'sitemap-0.xml');
let sitemapUrls = [];
if (existsSync(smF)) {
  sitemapUrls = [...readFileSync(smF, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const u of sitemapUrls) {
    if (!u.startsWith(SITE + BASE)) issues.push(`sitemap URL fuera de base: ${u}`);
    const p = u.slice((SITE + BASE).length) || '/';
    const cands = [join(root, p), join(root, p, 'index.html')];
    if (!cands.some((c) => existsSync(c))) issues.push(`sitemap URL sin fichero: ${u}`);
  }
} else issues.push('falta sitemap-0.xml');

// robots
const robots = existsSync(join(root, 'robots.txt')) ? readFileSync(join(root, 'robots.txt'), 'utf8') : null;
if (!robots) issues.push('falta robots.txt');
else if (!/Sitemap:/i.test(robots)) issues.push('robots.txt sin Sitemap:');

// catalogos
const catDir = join(root, 'data');
const cats = {};
if (existsSync(catDir)) {
  for (const f of readdirSync(catDir)) {
    const j = JSON.parse(readFileSync(join(catDir, f), 'utf8'));
    const keys = Object.keys(j);
    const arrKey = keys.find((k) => Array.isArray(j[k]));
    cats[f] = { keys, items: arrKey ? j[arrKey].length : null, schema: j.schemaVersion ?? j.version ?? null };
  }
} else issues.push('falta /data');

// llms.txt
const llms = existsSync(join(root, 'llms.txt')) ? readFileSync(join(root, 'llms.txt'), 'utf8') : null;
if (!llms) issues.push('falta llms.txt');

const out = { root, files: files.length, html: stats.html, h1: stats.h1, langs: [...stats.lang], canonicals: stats.canonicals, jsonld: stats.jsonld, jsonldBad: stats.jsonldBad, iframes: stats.iframes, imgs: stats.imgs, imgsNoAlt: stats.imgsNoAlt, forms: stats.forms, inputs: stats.inputs, skip: stats.skip, sitemapUrls, robots: robots ? robots.split('\n').filter(Boolean) : null, catalogs: cats, llmsLen: llms ? llms.length : 0, nojsContent: stats.nojsContent, missingLinks: missing, issues };
console.log(JSON.stringify(out, null, 1));
