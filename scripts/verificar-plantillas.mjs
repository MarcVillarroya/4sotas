#!/usr/bin/env node
/**
 * 4 Sotas · verificación de plantillas editoriales (capa 3-bis).
 *
 * Comprueba dos artefactos ya construidos:
 *   dist/            build público     (npm run build)
 *   dist-fixtures/   build de fixtures (npm run build:fixtures)
 *
 * Qué demuestra:
 *  1. Ningún borrador tiene página en el build público, aunque cada plantilla se haya
 *     renderizado con fixtures (`B-DRAFT-EN-DIST` del validador canónico lo cubre también).
 *  2. Cada plantilla genera su ruta con el fixture: tema, guía, vídeo, glosario, herramienta.
 *  3. El JSON-LD de cada página parsea, tiene el tipo esperado, sus migas terminan en su
 *     propia canónica y el nombre declarado aparece en el texto visible.
 *  4. Ni los listados ni la watch page insertan iframes: el reproductor es una facade.
 *
 * Uso: node scripts/verificar-plantillas.mjs [--publico dist] [--fixtures dist-fixtures] [--content src/content]
 */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const args = process.argv.slice(2);
const arg = (nombre, porDefecto) => {
  const i = args.indexOf(`--${nombre}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : porDefecto;
};

const RAIZ = process.cwd();
const PUBLICO = path.resolve(arg('publico', 'dist'));
const FIXTURES = path.resolve(arg('fixtures', 'dist-fixtures'));
const CONTENT = path.resolve(arg('content', 'src/content'));

const fallos = [];
const ok = [];
const fallo = (msg) => fallos.push(msg);
const bien = (msg) => ok.push(msg);

const leer = (f) => fs.readFileSync(f, 'utf8');

function walk(dir, ext, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, out);
    else if (e.name.endsWith(ext)) out.push(p);
  }
  return out;
}

/** Ruta pública a partir del fichero: `dist/oros/temas/x/index.html` -> `/oros/temas/x/`. */
const rutaDe = (dist, f) => {
  const rel = path.relative(dist, f).split(path.sep).join('/');
  return `/${rel.replace(/(^|\/)index\.html$/, '$1')}`.replace(/\/+/g, '/');
};

const existeRuta = (dist, ruta) => {
  const limpia = ruta.replace(/^\//, '').replace(/\/$/, '');
  if (limpia === '' || limpia === '404.html') return fs.existsSync(path.join(dist, limpia || 'index.html'));
  const fichero = limpia.includes('.') ? path.join(dist, limpia) : path.join(dist, limpia, 'index.html');
  return fs.existsSync(fichero);
};

/* ─────────────── 1 · inventario de contenido ─────────────── */

/**
 * `series` queda fuera de la comprobación de rutas: ROUTES.md §2 solo genera sus páginas
 * si hay alguna serie publicada, así que una serie en borrador no debe tener página.
 */
const COLECCIONES = ['temas', 'articulos', 'videos', 'herramientas', 'glosario'];
const RUIDO = new Set(['sotas', 'fuentes', 'autores']);
const RUTA = {
  temas: (slug) => `/oros/temas/${slug}/`,
  articulos: (slug) => `/oros/guias/${slug}/`,
  videos: (slug) => `/oros/videos/${slug}/`,
  glosario: (slug) => `/oros/glosario/${slug}/`,
  herramientas: (slug) => `/oros/herramientas/${slug}/`,
};

const entries = {};
for (const col of [...COLECCIONES, ...RUIDO]) {
  const dir = path.join(CONTENT, col);
  entries[col] = [];
  if (!fs.existsSync(dir)) continue;
  for (const f of walk(dir, '.md').concat(walk(dir, '.yaml'))) {
    const raw = leer(f);
    const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
    let data;
    try {
      data = YAML.parse(f.endsWith('.md') ? (m ? m[1] : '') : raw) ?? {};
    } catch (e) {
      fallo(`frontmatter ilegible en ${path.relative(RAIZ, f)}: ${e.message}`);
      continue;
    }
    entries[col].push({ data, file: path.relative(RAIZ, f) });
  }
}

const borradores = COLECCIONES.flatMap((col) =>
  entries[col]
    .filter((e) => (e.data.status ?? 'borrador') !== 'publicado')
    .map((e) => ({ col, ruta: RUTA[col](e.data.slug), file: e.file, status: e.data.status ?? 'borrador' })),
);

const publicados = COLECCIONES.flatMap((col) =>
  entries[col].filter((e) => e.data.status === 'publicado').map((e) => ({ col, ...e })),
);

/* ─────────────── 2 · build público ─────────────── */

const INDICES = [
  '/oros/',
  '/oros/temas/',
  '/oros/guias/',
  '/oros/videos/',
  '/oros/glosario/',
  '/oros/herramientas/',
  '/404.html',
];

if (!fs.existsSync(PUBLICO)) {
  fallo(`no existe el build público en ${PUBLICO} (ejecuta npm run build)`);
} else {
  for (const ruta of INDICES) {
    if (existeRuta(PUBLICO, ruta)) bien(`build público: existe ${ruta}`);
    else fallo(`build público: falta ${ruta}`);
  }

  for (const b of borradores) {
    if (existeRuta(PUBLICO, b.ruta)) fallo(`build público: BORRADOR con página ${b.ruta} (${b.file})`);
  }
  bien(`build público: ${borradores.length} entradas no publicadas comprobadas, 0 con página`);

  for (const p of publicados) {
    if (RUTA[p.col] && !existeRuta(PUBLICO, RUTA[p.col](p.data.slug)))
      fallo(`build público: entrada publicada sin página ${RUTA[p.col](p.data.slug)} (${p.file})`);
  }
  bien(`build público: ${publicados.length} entradas publicadas comprobadas`);

  const htmlsPublico = walk(PUBLICO, '.html');
  const conIframe = htmlsPublico.filter((f) => /<iframe/i.test(leer(f)));
  if (conIframe.length) fallo(`build público: iframes en ${conIframe.map((f) => rutaDe(PUBLICO, f)).join(', ')}`);
  else bien(`build público: ${htmlsPublico.length} páginas sin iframes`);
}

/* ─────────────── 3 · build de fixtures ─────────────── */

/** Tipo JSON-LD que debe declarar cada plantilla, con el nodo del que se comprueba el nombre. */
const ESQUEMA = [
  { patron: /^\/oros\/temas\/[^/]+\/$/, tipos: ['CollectionPage'], nombre: 'CollectionPage' },
  { patron: /^\/oros\/guias\/[^/]+\/$/, tipos: ['Article', 'BlogPosting'], nombre: 'Article|BlogPosting' },
  { patron: /^\/oros\/videos\/[^/]+\/$/, tipos: ['VideoObject'], nombre: 'VideoObject' },
  { patron: /^\/oros\/glosario\/[^/]+\/$/, tipos: ['DefinedTerm'], nombre: 'DefinedTerm' },
  { patron: /^\/oros\/glosario\/$/, tipos: ['DefinedTermSet'], nombre: 'DefinedTermSet' },
  { patron: /^\/oros\/herramientas\/[^/]+\/$/, tipos: ['WebPage', 'SoftwareApplication'], nombre: 'WebPage' },
  { patron: /^\/oros\/(temas|guias|videos|herramientas)\/$/, tipos: ['CollectionPage'], nombre: 'CollectionPage' },
];

const textoVisible = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normal = (s) => String(s).replace(/\s+/g, ' ').trim().toLowerCase();

if (!fs.existsSync(FIXTURES)) {
  fallo(`no existe el build de fixtures en ${FIXTURES} (ejecuta npm run build:fixtures)`);
} else {
  for (const b of borradores) {
    if (!existeRuta(FIXTURES, b.ruta)) fallo(`build de fixtures: plantilla sin renderizar ${b.ruta} (${b.file})`);
  }
  const conPagina = borradores.filter((b) => existeRuta(FIXTURES, b.ruta));
  bien(`build de fixtures: ${conPagina.length}/${borradores.length} plantillas con borrador renderizadas`);

  const htmls = walk(FIXTURES, '.html');

  const conIframe = htmls.filter((f) => /<iframe/i.test(leer(f)));
  if (conIframe.length) fallo(`build de fixtures: iframes en ${conIframe.map((f) => rutaDe(FIXTURES, f)).join(', ')}`);
  else bien(`build de fixtures: ${htmls.length} páginas sin iframe (facade de vídeo)`);

  for (const f of htmls) {
    const ruta = rutaDe(FIXTURES, f);
    const html = leer(f);
    const canon = [...html.matchAll(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/g)].map((m) => m[1]);
    const noindex = /name="robots"[^>]*content="[^"]*noindex/i.test(html);

    if (ruta === '/404.html') {
      if (canon.length > 1) fallo(`${ruta}: la 404 no debe declarar más de una canónica`);
      if (!noindex) fallo(`${ruta}: la 404 debe ser noindex`);
      continue;
    }
    if (canon.length !== 1) {
      fallo(`${ruta}: ${canon.length} canónicas (debe haber exactamente 1)`);
      continue;
    }

    // JSON-LD
    const bloques = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    if (bloques.length !== 1) {
      fallo(`${ruta}: ${bloques.length} bloques JSON-LD (debe haber 1)`);
      continue;
    }
    let datos;
    try {
      datos = JSON.parse(bloques[0][1].replace(/&quot;/g, '"'));
    } catch (e) {
      fallo(`${ruta}: JSON-LD no parseable (${e.message})`);
      continue;
    }
    if (datos['@context'] !== 'https://schema.org') fallo(`${ruta}: JSON-LD sin @context schema.org`);
    const nodos = Array.isArray(datos['@graph']) ? datos['@graph'] : [datos];
    const tipos = new Set(nodos.map((n) => n['@type']));
    const plano = JSON.stringify(nodos);
    if (/aggregateRating|ratingValue|reviewCount/.test(plano)) fallo(`${ruta}: JSON-LD con ratings inventados`);
    if (/4sotas\.com/.test(plano)) fallo(`${ruta}: JSON-LD con el dominio no registrado`);

    const esperado = ESQUEMA.find((e) => e.patron.test(ruta));
    if (esperado) {
      const tiene = esperado.tipos.some((t) => tipos.has(t));
      if (!tiene) fallo(`${ruta}: falta ${esperado.nombre} (tipos declarados: ${[...tipos].join(', ')})`);
    }

    // BreadcrumbList coherente con la canónica (las portadas / y /oros/ no llevan migas)
    const migas = nodos.find((n) => n['@type'] === 'BreadcrumbList');
    const llevaMigas = /^\/oros\/[^/]+\//.test(ruta);
    if (!migas && llevaMigas) {
      fallo(`${ruta}: sin BreadcrumbList`);
    } else if (migas) {
      const items = migas.itemListElement ?? [];
      if (items.length < 2) fallo(`${ruta}: BreadcrumbList con ${items.length} niveles`);
      const ultimo = items[items.length - 1];
      if (ultimo?.item !== canon[0]) fallo(`${ruta}: la última miga (${ultimo?.item}) no es la canónica (${canon[0]})`);
      const visibles = normal(textoVisible(html));
      for (const it of items) {
        if (!visibles.includes(normal(it.name))) fallo(`${ruta}: miga "${it.name}" no aparece en el texto visible`);
      }
    }

    // El nombre declarado en el nodo principal debe verse en la página
    const visible = normal(textoVisible(html));
    const principal =
      nodos.find((n) => ['Article', 'BlogPosting'].includes(n['@type'])) ??
      nodos.find((n) => n['@type'] === 'VideoObject') ??
      nodos.find((n) => n['@type'] === 'DefinedTerm') ??
      nodos.find((n) => n['@type'] === 'CollectionPage');
    if (principal) {
      const nombre = principal.headline ?? principal.name;
      if (nombre && !visible.includes(normal(nombre)))
        fallo(`${ruta}: el nombre declarado en JSON-LD ("${nombre}") no está en el texto visible`);
    }

    // VideoObject: duración y miniatura presentes en la ficha; sin offers inventados
    const video = nodos.find((n) => n['@type'] === 'VideoObject');
    if (video) {
      for (const campo of ['name', 'description', 'thumbnailUrl', 'uploadDate', 'duration', 'embedUrl', 'contentUrl']) {
        if (!video[campo]) fallo(`${ruta}: VideoObject sin "${campo}"`);
      }
      if (!Array.isArray(video.thumbnailUrl) || video.thumbnailUrl.length === 0)
        fallo(`${ruta}: VideoObject sin miniatura`);
      if (video.contentUrl !== canon[0]) fallo(`${ruta}: VideoObject.contentUrl no es la watch page`);
    }

    // Article: fechas ISO y autoría. Las fechas solo se exigen al contenido publicado:
    // un borrador no tiene `publicado` y no debe declarar una fecha inventada.
    const art = nodos.find((n) => ['Article', 'BlogPosting'].includes(n['@type']));
    if (art) {
      for (const campo of ['headline', 'author', 'publisher']) {
        if (!art[campo]) fallo(`${ruta}: ${art['@type']} sin "${campo}"`);
      }
      const publicado = borradores.every((b) => b.ruta !== ruta);
      if (publicado) {
        for (const campo of ['datePublished', 'dateModified']) {
          if (!art[campo]) fallo(`${ruta}: ${art['@type']} publicado sin "${campo}"`);
          else if (!/^\d{4}-\d{2}-\d{2}$/.test(String(art[campo])))
            fallo(`${ruta}: ${campo} no es ISO (${art[campo]})`);
        }
      }
      if (!art.author?.name) fallo(`${ruta}: Article sin nombre de autor`);
    }

    // SoftwareApplication solo si la herramienta calcula
    const app = nodos.find((n) => n['@type'] === 'SoftwareApplication');
    if (app) {
      if (app.offers?.price !== '0') fallo(`${ruta}: SoftwareApplication con precio distinto de 0`);
      if (/no calcula|en preparación/i.test(visible) && !/beta|estable/i.test(visible))
        fallo(`${ruta}: SoftwareApplication en una herramienta que no calcula`);
    }
  }
  bien(`build de fixtures: ${htmls.length} páginas con canónica única y JSON-LD parseable`);
}

/* ─────────────── informe ─────────────── */

for (const f of fallos) console.error(`FAIL ${f}`);
if (process.env.VERBOSE) for (const l of ok) console.log(`ok   ${l}`);
console.log(
  `verificar-plantillas: ${fallos.length === 0 ? 'ok' : 'bloqueado'} · ${ok.length} comprobaciones correctas · ${fallos.length} fallos`,
);
process.exit(fallos.length === 0 ? 0 : 1);
