// Integridad de datos independiente del validador del proyecto:
// IDs y slugs únicos, referencias tipadas existentes, estados válidos y coherencia con la salida construida.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const COLECCIONES = ['temas', 'articulos', 'videos', 'glosario', 'fuentes', 'autores', 'herramientas', 'series', 'sotas'];
const entradas = [];
for (const col of COLECCIONES) {
  const dir = join('src/content', col);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((x) => /\.(md|yaml|yml)$/.test(x))) {
    const raw = readFileSync(join(dir, f), 'utf8');
    const y = f.endsWith('.md') ? parse(raw.replace(/^---\n/, '').split('\n---\n')[0]) : parse(raw);
    entradas.push({ col, archivo: f, ...y });
  }
}

const ids = new Map();
const slugs = new Map();
const problemas = [];
for (const e of entradas) {
  if (!e.id) problemas.push(`${e.col}/${e.archivo}: sin id`);
  else if (ids.has(e.id)) problemas.push(`id duplicado ${e.id} en ${e.col}/${e.archivo} y ${ids.get(e.id)}`);
  else ids.set(e.id, `${e.col}/${e.archivo}`);
  if (e.slug) {
    const k = `${e.universo ?? ''}|${e.slug}`;
    if (slugs.has(k)) problemas.push(`slug duplicado ${e.slug} en ${e.col}/${e.archivo} y ${slugs.get(k)}`);
    else slugs.set(k, `${e.col}/${e.archivo}`);
    if (e.slug !== e.slug.toLowerCase() || /[^a-z0-9-]/.test(e.slug)) problemas.push(`slug no semántico: ${e.slug}`);
  }
}

// referencias tipadas: cualquier campo de la lista debe apuntar a un id existente
const CAMPOS_REF = ['temas', 'fuentes', 'relacionados', 'serie', 'herramienta', 'autorias', 'revisor'];
const refs = [];
for (const e of entradas) {
  const visitar = (campo, valor) => {
    const vals = Array.isArray(valor) ? valor : [valor];
    for (const v of vals) {
      if (typeof v !== 'string') continue;
      refs.push({ desde: e.id, campo, ref: v });
    }
  };
  for (const c of CAMPOS_REF) {
    if (e[c] === undefined || e[c] === null) continue;
    if (c === 'autorias' && typeof e[c] === 'object' && !Array.isArray(e[c])) {
      for (const [k, v] of Object.entries(e[c])) visitar(`autorias.${k}`, v);
    } else visitar(c, e[c]);
  }
}
const refsRotas = refs.filter((r) => !ids.has(r.ref));
// ids de fixtures son tolerados solo si el fichero es de fixture
const refsRotasReales = refsRotas.filter((r) => !/fixture/.test(r.ref) && !/fixture/.test(r.desde ?? ''));
for (const r of refsRotasReales) problemas.push(`referencia rota ${r.campo}="${r.ref}" desde ${r.desde}`);

const estados = {};
for (const e of entradas) if (e.status) estados[e.status] = (estados[e.status] ?? 0) + 1;
const publicados = entradas.filter((e) => e.status === 'publicado');
const enDist = [];
for (const e of publicados) {
  const candidatos = [`/oros/temas/${e.slug}`, `/oros/guias/${e.slug}`, `/oros/videos/${e.slug}`, `/oros/glosario/${e.slug}`, `/oros/herramientas/${e.slug}`];
  const existe = candidatos.some((c) => existsSync(join('dist', c, 'index.html')));
  if (!existe) enDist.push(`${e.col}/${e.slug}`);
}
// revisor factual declarado en publicados
const sinRevisor = publicados.filter((e) => !(e.autorias?.revisor) && !e.revisor).map((e) => e.id);
const sinFechaRevision = publicados.filter((e) => !e.revisado_factual).map((e) => e.id);

console.log(JSON.stringify({ total: entradas.length, porColeccion: Object.fromEntries(COLECCIONES.map((c) => [c, entradas.filter((e) => e.col === c).length])), ids: ids.size, slugs: slugs.size, refs: refs.length, refsRotasReales: refsRotasReales.length, estados, publicados: publicados.length, publicadosSinPagina: enDist, publicadosSinRevisor: sinRevisor, publicadosSinFechaRevision: sinFechaRevision, problemas }, null, 1));
