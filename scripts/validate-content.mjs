#!/usr/bin/env node
/**
 * 4 Sotas · validador de integridad editorial y de salida estática.
 * Fuente canónica: /home/mvf/4sotas/architecture/scripts/validate-content.mjs
 * Uso:
 *   node scripts/validate-content.mjs --root .                        # contenido
 *   node scripts/validate-content.mjs --root . --dist dist            # contenido + salida
 * Opciones:
 *   --root <dir>        raíz del proyecto Astro (por defecto cwd)
 *   --content <dir>     directorio de contenido (por defecto <root>/src/content)
 *   --dist <dir>        directorio construido; si falta, se omiten los checks de salida
 *   --inventory <file>  inventario de auditoría; si falta, se omite el contraste con YouTube
 *   --site <url>        origen esperado (por defecto SITE_ORIGIN o https://marcvillarroya.github.io)
 *   --base <path>       base path esperado (por defecto SITE_BASE o /4sotas)
 *   --json <file>       escribe el informe máquina-legible
 * Códigos: B* = bloqueante (exit 1) · W* = aviso (exit 0)
 */
import fs from 'node:fs';
import path from 'node:path';
// `yaml` es devDependency del repo del sitio (npm i -D yaml@2). Sin ella el script no puede leer frontmatter.
let YAML;
try {
  YAML = (await import('yaml')).default;
} catch {
  console.error('validate-content: falta la dependencia "yaml". Ejecuta `npm i -D yaml@2` en el repo del sitio.');
  process.exit(2);
}

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const ROOT = path.resolve(arg('root', process.cwd()));
const CONTENT = path.resolve(arg('content', path.join(ROOT, 'src/content')));
const DIST = arg('dist', null) ? path.resolve(arg('dist')) : null;
const INVENTORY = arg('inventory', null) ? path.resolve(arg('inventory')) : null;
const SITE = (arg('site', process.env.SITE_ORIGIN ?? 'https://marcvillarroya.github.io')).replace(/\/+$/, '');
const BASE = `/${arg('base', process.env.SITE_BASE ?? '/4sotas').replace(/^\/+|\/+$/g, '')}`;
const JSON_OUT = arg('json', null);

const COLECCIONES = ['sotas', 'temas', 'articulos', 'videos', 'series', 'herramientas', 'glosario', 'fuentes', 'autores'];
const EXT = new Set(['.md', '.mdx', '.yaml', '.yml', '.json']);

/** Ruta pública por colección. `null` = no genera página propia. */
const RUTA = {
  articulos: (slug) => `/oros/guias/${slug}/`,
  videos: (slug) => `/oros/videos/${slug}/`,
  temas: (slug) => `/oros/temas/${slug}/`,
  herramientas: (slug) => `/oros/herramientas/${slug}/`,
  glosario: (slug) => `/oros/glosario/${slug}/`,
  series: (slug) => `/oros/series/${slug}/`,
  sotas: null,
  fuentes: null,
  autores: null,
};

/** Rutas de referencia de `base` en content.config.ts (arrays sin índice). */
const REFS_BASE = {
  'autorias.redactor': 'autores',
  'autorias.revisor': 'autores',
  'fuentes.fuente': 'fuentes',
};

/** Colección origen + ruta completa: un mismo nombre puede tener destinos distintos. */
const REFS = {
  temas: {
    ...REFS_BASE,
    pilar: 'articulos',
    temas_relacionados: 'temas',
    videos_destacados: 'videos',
    herramientas: 'herramientas',
  },
  articulos: {
    ...REFS_BASE,
    temas: 'temas',
    videos: 'videos',
    herramientas: 'herramientas',
    glosario: 'glosario',
    serie: 'series',
  },
  videos: {
    ...REFS_BASE,
    temas: 'temas',
    serie: 'series',
    relacionados: 'videos',
  },
  series: { ...REFS_BASE, temas: 'temas' },
  herramientas: { ...REFS_BASE, temas: 'temas' },
  glosario: { ...REFS_BASE, relacionados: 'glosario' },
};

const PREFIJO = {
  temas: 'tema',
  articulos: 'art',
  videos: 'vid',
  series: 'ser',
  herramientas: 'herr',
  glosario: 'glo',
  fuentes: 'src',
  autores: 'aut',
  sotas: 'sota',
};

const SECRETOS = [
  /AIza[0-9A-Za-z_-]{35}/,
  /gh[pousr]_[A-Za-z0-9]{20,}/,
  /sk-[A-Za-z0-9]{20,}/,
  /"refresh_token"\s*:/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];

const blockers = [];
const warnings = [];
const B = (code, where, msg) => blockers.push({ code, where, msg });
const W = (code, where, msg) => warnings.push({ code, where, msg });

/* ───────────────────────── carga de contenido ───────────────────────── */

function walk(dir, exts = EXT, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, out);
    else if (exts.has(path.extname(e.name))) out.push(p);
  }
  return out;
}

function parseFrontmatter(file) {
  const raw = fs.readFileSync(file, 'utf8');
  if (!file.endsWith('.md') && !file.endsWith('.mdx')) return YAML.parse(raw) ?? {};
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  if (!m) throw new Error('frontmatter ausente');
  return YAML.parse(m[1]) ?? {};
}

const entries = {}; // coleccion -> [{ id, data, file, slug }]
for (const col of COLECCIONES) {
  const dir = path.join(CONTENT, col);
  entries[col] = [];
  if (!fs.existsSync(dir)) {
    W('W-CONTENT-DIR', col, `no existe src/content/${col} (colección vacía)`);
    continue;
  }
  for (const file of walk(dir)) {
    const rel = path.relative(ROOT, file);
    let data;
    try {
      data = parseFrontmatter(file);
    } catch (err) {
      B('B-PARSE', rel, `no se pudo leer el frontmatter: ${err.message}`);
      continue;
    }
    entries[col].push({ id: typeof data.id === 'string' ? data.id : null, data, file: rel, slug: data.slug ?? null });
  }
}

const indice = Object.fromEntries(COLECCIONES.map((c) => [c, new Set(entries[c].map((e) => e.id).filter(Boolean))]));

/* ───────────────────── B1 · IDs y slugs duplicados ───────────────────── */

for (const col of COLECCIONES) {
  const vistosId = new Map();
  const vistosSlug = new Map();
  for (const e of entries[col]) {
    if (!e.id) B('B-ID-AUSENTE', e.file, `falta el campo obligatorio "id" en la colección ${col}`);
    if (e.id) {
      if (vistosId.has(e.id)) B('B-ID-DUPLICADO', e.file, `id "${e.id}" repetido (ya en ${vistosId.get(e.id)})`);
      vistosId.set(e.id, e.file);
      const pref = PREFIJO[col];
      if (pref && !new RegExp(`^${pref}-[a-z0-9]+(?:-[a-z0-9]+)*$`).test(e.id) && !(col === 'videos' && /^vid-[A-Za-z0-9_-]{11}$/.test(e.id)))
        B('B-ID-PREFIJO', e.file, `id "${e.id}" no respeta el prefijo "${pref}-"`);
    }
    if (RUTA[col]) {
      if (!e.slug) B('B-SLUG-AUSENTE', e.file, `la colección ${col} genera ruta y exige "slug"`);
      else {
        if (vistosSlug.has(e.slug)) B('B-SLUG-DUPLICADO', e.file, `slug "${e.slug}" repetido (ya en ${vistosSlug.get(e.slug)})`);
        vistosSlug.set(e.slug, e.file);
        if (/\s/.test(e.slug) || /[A-ZÁÉÍÓÚÑ]/.test(e.slug)) B('B-SLUG-FORMA', e.file, `slug "${e.slug}" no es kebab-case minúsculo`);
        if (e.slug.length > 60) W('W-SLUG-LARGO', e.file, `slug de ${e.slug.length} caracteres (>60)`);
      }
    }
  }
}

/* ───────────────── B2 · publicación y aislamiento editorial ───────────────── */

const YMYL = (s) => s === 'media' || s === 'alta';
/** Colecciones con ciclo editorial (tienen `status`). Fuentes y autores son datos de apoyo. */
const PUBLICABLE = new Set(['temas', 'articulos', 'videos', 'series', 'herramientas', 'glosario']);

for (const col of COLECCIONES) {
  for (const e of entries[col]) {
    const d = e.data;
    const st = d.status ?? 'borrador';
    if (st === 'publicado') {
      if (!d.publicado) B('B-PUB-SIN-FECHA', e.file, 'status: publicado sin fecha "publicado"');
      if (!d.revisado_factual) B('B-PUB-SIN-REVISION', e.file, 'status: publicado sin "revisado_factual"');
      if (YMYL(d.sensibilidad ?? 'media') && !d.revisado_factual) B('B-PUB-YMYL', e.file, 'contenido YMYL publicado sin revisión factual');
      if (RUTA[col] && !d.seo?.descripcion) B('B-PUB-SIN-DESC', e.file, 'status: publicado sin seo.descripcion');
      if (d.seo?.noindex) B('B-PUB-NOINDEX', e.file, 'contenido publicado marcado noindex (contradicción)');
      if (YMYL(d.sensibilidad ?? 'media') && ['articulos', 'temas', 'glosario', 'herramientas'].includes(col) && !(d.fuentes ?? []).length)
        B('B-PUB-SIN-FUENTES', e.file, 'contenido YMYL publicado sin fuentes tipadas');
      if (d.sensibilidad === 'alta' && !d.autorias?.revisor) B('B-PUB-SIN-REVISOR', e.file, 'sensibilidad alta publicada sin revisor en autorias');
      if (col === 'articulos' && !(d.temas ?? []).length) B('B-PUB-SIN-TEMA', e.file, 'artículo publicado sin tema');
    }
    if (st === 'archivado' && d.seo?.noindex !== true) W('W-ARCHIVADO-INDEXABLE', e.file, 'archivado sin seo.noindex: true');

    if (col === 'videos' && st === 'publicado') {
      if (d.estado_youtube !== 'publico') B('B-VIDEO-NO-PUBLICO', e.file, `vídeo publicado en el sitio con estado_youtube=${d.estado_youtube}`);
      if (d.id !== `vid-${d.youtube_id}`) B('B-VIDEO-ID', e.file, 'id distinto de vid-<youtube_id>');
    }
    if (col === 'herramientas' && st === 'publicado' && d.estado_implementacion === 'no-implementada')
      B('B-HERRAMIENTA-FANTASMA', e.file, 'herramienta anunciada sin implementación');
  }
}

/* ───────────── B3 · referencias: existencia y visibilidad ───────────── */

function* refsDe(data, destinos, rutaCampo = '') {
  if (Array.isArray(data)) {
    for (const item of data) yield* refsDe(item, destinos, rutaCampo);
    return;
  }
  if (typeof data === 'string' && Object.hasOwn(destinos, rutaCampo)) {
    yield { campo: rutaCampo, valor: data, destino: destinos[rutaCampo] };
    return;
  }
  if (data && typeof data === 'object') {
    for (const [k, v] of Object.entries(data)) {
      const campo = rutaCampo ? `${rutaCampo}.${k}` : k;
      yield* refsDe(v, destinos, campo);
    }
  }
}

for (const col of COLECCIONES) {
  for (const e of entries[col]) {
    for (const { campo, valor, destino } of refsDe(e.data, REFS[col] ?? {})) {
      if (!indice[destino]?.has(valor)) {
        B('B-REF-COLGANTE', e.file, `${campo} = "${valor}" no existe en ${destino}`);
        continue;
      }
      const objetivo = entries[destino].find((x) => x.id === valor);
      const stOrigen = e.data.status ?? 'borrador';
      const stDestino = objetivo?.data.status ?? 'borrador';
      if (stOrigen === 'publicado' && PUBLICABLE.has(destino) && stDestino !== 'publicado')
        B('B-REF-PRIVADA', e.file, `${campo} referencia "${valor}" con status=${stDestino} desde una entrada publicada (fuga de borrador)`);
    }
  }
}

/* ─────────────────── B4 · contraste con el inventario ─────────────────── */

if (INVENTORY && fs.existsSync(INVENTORY)) {
  const inv = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
  const api = new Map((inv.videos ?? []).map((v) => [v.videoId, v]));
  const enSitio = new Map(entries.videos.map((e) => [e.data.youtube_id, e]));
  for (const [id, e] of enSitio) {
    const real = api.get(id);
    if (!real) {
      B('B-VIDEO-INVENTADO', e.file, `youtube_id ${id} no está en audit/inventory.json`);
      continue;
    }
    const tSitio = String(e.data.titulo ?? '').trim();
    const tApi = String(real.title ?? '').trim();
    if (tSitio !== tApi) W('W-VIDEO-TITULO', e.file, `título distinto del real de la API: "${tSitio}" vs "${tApi}"`);
    const publico = real.privacy_status === 'public';
    if (e.data.status === 'publicado' && !publico) B('B-VIDEO-ESTADO', e.file, `la API dice ${real.privacy_status} y el sitio lo publica`);
  }
  for (const [id, v] of api) {
    if (v.privacy_status === 'public' && !enSitio.has(id)) W('W-VIDEO-SIN-FICHA', 'audit/inventory.json', `vídeo público sin ficha en el sitio: ${id}`);
  }
} else if (INVENTORY) {
  B('B-INVENTARIO', INVENTORY, 'inventario indicado pero no existe');
}

/* ─────────────────── B5 · secretos en contenido y assets ─────────────────── */

for (const f of [...walk(CONTENT), ...walk(path.join(ROOT, 'public'))]) {
  const txt = fs.readFileSync(f, 'utf8');
  for (const rx of SECRETOS) if (rx.test(txt)) B('B-SECRETO', path.relative(ROOT, f), 'posible credencial o token en el repositorio');
}

/* ─────────────── W · caducidad, longitudes, enlaces cruzados ─────────────── */

const HOY = new Date();
const DIAS = (a, b) => Math.round((a - b) / 86400000);
for (const col of COLECCIONES) {
  for (const e of entries[col]) {
    const d = e.data;
    if (d.status !== 'publicado') continue;
    const rev = d.revisado_factual ? new Date(d.revisado_factual) : null;
    if (rev && DIAS(HOY, rev) > 365) W('W-CADUCIDAD', e.file, `revisión factual de hace ${DIAS(HOY, rev)} días (>365)`);
    if (d.seo?.titulo && (d.seo.titulo.length < 30 || d.seo.titulo.length > 65))
      W('W-SEO-TITULO', e.file, `seo.titulo de ${d.seo.titulo.length} caracteres (30-65 recomendado)`);
    if (d.seo?.descripcion && d.seo.descripcion.length > 160) W('W-SEO-DESC', e.file, `seo.descripcion de ${d.seo.descripcion.length} caracteres (>160)`);
    if (col === 'articulos' && !(d.videos ?? []).length && !(d.glosario ?? []).length)
      W('W-SIN-CRUCES', e.file, 'artículo publicado sin vídeos ni glosario enlazados');
    for (const f of d.fuentes ?? []) {
      const src = entries.fuentes.find((x) => x.id === f.fuente);
      const vh = src?.data.vigencia_hasta;
      if (vh && new Date(vh) < HOY) W('W-FUENTE-CADUCADA', e.file, `fuente ${f.fuente} con vigencia_hasta vencida (${String(vh).slice(0, 10)})`);
    }
  }
}

/* ─────────────────────── checks de salida construida ─────────────────────── */

let distInfo = null;
if (DIST) {
  if (!fs.existsSync(DIST)) {
    W('W-SIN-DIST', DIST, 'no hay build: se omiten las comprobaciones de salida');
  } else {
    const htmls = walk(DIST, new Set(['.html']));
    const rutas = new Set(
      htmls.map((f) => {
        const rel = path.relative(DIST, f).replace(/\\/g, '/').replace(/(^|\/)index\.html$/, '$1');
        return `/${rel.replace(/\/$/, '')}${rel === '/' || rel.endsWith('/') ? '' : '/'}`.replace(/\/+/g, '/');
      }),
    );

    // B6 · ningún borrador en la salida
    for (const col of COLECCIONES) {
      for (const e of entries[col]) {
        if ((e.data.status ?? 'borrador') === 'publicado' || !RUTA[col]) continue;
        const ruta = RUTA[col](e.slug);
        if (rutas.has(ruta)) B('B-DRAFT-EN-DIST', e.file, `entrada con status=${e.data.status} tiene página en dist: ${ruta}`);
      }
    }

    // B7 · páginas exigibles presentes
    for (const base of ['/404.html', '/robots.txt', '/sitemap-index.xml']) {
      if (!fs.existsSync(path.join(DIST, base))) B('B-FALTA-ARCHIVO', base, 'no existe en dist');
    }

    // B8 · canónica, enlaces internos y JSON-LD
    const sitemapLocs = new Set();
    const smFiles = walk(DIST, new Set(['.xml'])).filter((f) => /sitemap(-\d+)?\.xml$/.test(f));
    for (const f of smFiles) {
      const xml = fs.readFileSync(f, 'utf8');
      for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) sitemapLocs.add(m[1]);
    }
    for (const loc of sitemapLocs) {
      if (!loc.startsWith(`${SITE}${BASE}/`)) B('B-SITEMAP-ORIGEN', loc, `loc fuera del origen/base configurado (${SITE}${BASE}/)`);
      const rel = loc.slice(`${SITE}${BASE}`.length).replace(/^\//, '');
      const target = path.join(DIST, rel, rel.endsWith('/') || rel === '' ? 'index.html' : '');
      const fileTarget = /\.\w+$/.test(rel) ? path.join(DIST, rel) : path.join(DIST, rel, 'index.html');
      if (!fs.existsSync(fileTarget) && !fs.existsSync(target)) B('B-SITEMAP-HUERFANO', loc, 'URL del sitemap sin fichero en dist');
    }

    for (const f of htmls) {
      const rel = path.relative(DIST, f);
      const html = fs.readFileSync(f, 'utf8');
      const esError = /404\.html$/.test(f);
      const canon = [...html.matchAll(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/g)].map((m) => m[1]);
      const noindex = /<meta[^>]+name=" robots"[^>]*>|name="robots"[^>]+content="[^"]*noindex/i.test(html);
      if (!esError) {
        if (canon.length !== 1) B('B-CANONICA', rel, `canónicas encontradas: ${canon.length} (debe haber 1)`);
        else {
          if (!canon[0].startsWith(`${SITE}${BASE}/`)) B('B-CANONICA-ORIGEN', rel, `canónica fuera del origen/base: ${canon[0]}`);
          if (canon[0].includes('4sotas.com')) B('B-CANONICA-DOMINIO', rel, 'canónica apunta a 4sotas.com (no registrado)');
        }
        if (noindex) B('B-NOINDEX-PUBLICO', rel, 'página pública con noindex');
        const relLimpia = rel.replace(/(^|\/)index\.html$/, '$1').replace(/\\/g, '/').replace(/^\//, '');
        const esperada = `${SITE}${BASE}/${relLimpia}`;
        if (canon.length === 1 && canon[0] !== esperada)
          W('W-CANONICA-DESALINEADA', rel, `canónica ${canon[0]} no coincide con la ruta esperada ${esperada}`);
      }
      // JSON-LD
      for (const m of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
        try {
          const parsed = JSON.parse(m[1].replace(/&quot;/g, '"'));
          const planos = JSON.stringify(parsed);
          if (/"aggregateRating"|"reviewCount"|"ratingValue"/.test(planos)) B('B-JSONLD-RATING', rel, 'JSON-LD con ratings inventados');
          if (/4sotas\.com/.test(planos)) B('B-JSONLD-DOMINIO', rel, 'JSON-LD con 4sotas.com');
        } catch {
          B('B-JSONLD-INVALIDO', rel, 'bloque JSON-LD no parseable');
        }
      }
      // enlaces internos
      for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        const href = m[1];
        if (/^(?:https?:|mailto:|tel:|#|data:)/.test(href)) continue;
        if (!href.startsWith('/')) {
          W('W-ENLACE-RELATIVO', rel, `enlace relativo "${href}" (usar rutas con base)`);
          continue;
        }
        if (!href.startsWith(BASE)) {
          B('B-ENLACE-SIN-BASE', rel, `enlace "${href}" fuera del base path ${BASE}`);
          continue;
        }
        const limpio = href.slice(BASE.length).split(/[?#]/)[0];
        const destino = limpio === '' || limpio.endsWith('/') ? path.join(DIST, limpio, 'index.html') : path.join(DIST, limpio);
        const alt = path.join(DIST, limpio, 'index.html');
        if (!fs.existsSync(destino) && !fs.existsSync(alt)) B('B-ENLACE-ROTO', rel, `enlace interno roto: ${href}`);
      }
      // indexables fuera del sitemap
      if (!esError && !noindex && canon.length === 1 && !sitemapLocs.has(canon[0]))
        W('W-FUERA-SITEMAP', rel, `canónica ${canon[0]} no está en el sitemap`);
    }
    distInfo = { htmls: htmls.length, sitemapLocs: sitemapLocs.size };
  }
}

/* ─────────────────────────────── informe ─────────────────────────────── */

const informe = {
  generated_at: new Date().toISOString(),
  root: ROOT,
  site: SITE,
  base: BASE,
  entries: Object.fromEntries(COLECCIONES.map((c) => [c, entries[c].length])),
  dist: distInfo,
  blockers,
  warnings,
  verdict: blockers.length === 0 ? 'ok' : 'bloqueado',
};
if (JSON_OUT) fs.writeFileSync(path.resolve(JSON_OUT), JSON.stringify(informe, null, 2));

for (const w of warnings) console.warn(`WARN ${w.code} ${w.where}: ${w.msg}`);
for (const b of blockers) console.error(`FAIL ${b.code} ${b.where}: ${b.msg}`);
console.log(
  `validate-content: ${informe.verdict} · ${blockers.length} bloqueantes · ${warnings.length} avisos · contenido ${JSON.stringify(informe.entries)}${
    distInfo ? ` · dist ${distInfo.htmls} html / ${distInfo.sitemapLocs} urls en sitemap` : ''
  }`,
);
process.exit(blockers.length === 0 ? 0 : 1);
