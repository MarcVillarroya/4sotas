#!/usr/bin/env node
/**
 * 4 Sotas · informe de publicación pendiente (capa editorial, no bloqueante).
 *
 * No publica nada: solo dice, entrada por entrada, qué le falta para poder pasar a
 * `status: publicado` según el esquema de contenido, y qué referencias apuntan a entradas
 * que siguen sin publicar. Eso último es lo que hace que la publicación sea un interruptor
 * único: el grafo editorial está conectado, así que publicar un vídeo sin su tema deja
 * `B-REF-PRIVADA` (fuga de borrador) en el validador canónico.
 *
 * Uso: node scripts/pendiente-publicacion.mjs [--json qa/f1-ensamblado/publicacion.json] [--md ruta.md]
 */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const RAIZ = process.cwd();
const CONTENT = path.join(RAIZ, 'src/content');
const args = process.argv.slice(2);
const arg = (nombre, porDefecto) => {
  const i = args.indexOf(`--${nombre}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : porDefecto;
};

const COLECCIONES = {
  temas: { ficheros: (d) => glob(`${d}/temas/*.md`), refs: ['pilar', 'temas_relacionados', 'videos_destacados', 'herramientas'] },
  articulos: { ficheros: (d) => glob(`${d}/articulos/*.md`), refs: ['temas', 'videos', 'herramientas', 'glosario', 'serie'] },
  videos: { ficheros: (d) => glob(`${d}/videos/*.yaml`), refs: ['temas', 'serie', 'relacionados'] },
  glosario: { ficheros: (d) => glob(`${d}/glosario/*.md`), refs: ['relacionados'] },
  herramientas: { ficheros: (d) => glob(`${d}/herramientas/*.yaml`), refs: ['temas'] },
  series: { ficheros: (d) => glob(`${d}/series/*.yaml`), refs: ['temas'] },
};

function glob (patron) {
  const dir = path.dirname(patron);
  const ext = path.extname(patron);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => path.join(dir, f)).sort();
}

const frontmatter = (fichero) => {
  const texto = fs.readFileSync(fichero, 'utf8');
  if (fichero.endsWith('.yaml')) return YAML.parse(texto) ?? {};
  const m = texto.match(/^---\n([\s\S]*?)\n---/);
  return m ? (YAML.parse(m[1]) ?? {}) : {};
};

const idDe = (ref) => (typeof ref === 'string' ? ref : (ref?.id ?? null));

// 1 · Cargar todo el contenido real, incluidas entradas de prueba.
const entradas = [];
for (const [coleccion, def] of Object.entries(COLECCIONES)) {
  for (const fichero of def.ficheros(CONTENT)) {
    const data = frontmatter(fichero);
    if (!data.id) continue;
    entradas.push({ coleccion, fichero: path.relative(RAIZ, fichero), data });
  }
}
const porId = new Map(entradas.map((e) => [e.data.id, e]));
const estaPublicada = (id) => porId.get(id)?.data.status === 'publicado';

// 2 · Qué le falta a cada entrada para publicarse.
const informe = [];
for (const e of entradas) {
  if (e.data.status === 'publicado') continue;
  const falta = [];
  if (!e.data.publicado) falta.push('publicado (fecha)');
  if (!e.data.revisado_factual) falta.push('revisado_factual (fecha)');
  if (!e.data.seo?.descripcion) falta.push('seo.descripcion');
  const sensibilidad = e.data.sensibilidad ?? 'media';
  const exigeFuente = e.coleccion !== 'videos';
  if (exigeFuente && sensibilidad !== 'baja' && (e.data.fuentes ?? []).length === 0) falta.push('fuentes (>= 1)');
  if (e.data.seo?.noindex) falta.push('seo.noindex=false');

  // Referencias a entradas que siguen sin publicar: si esta entrada se publicara hoy,
  // el validador canónico la bloquearía con B-REF-PRIVADA.
  const refsSinPublicar = [];
  for (const campo of COLECCIONES[e.coleccion].refs) {
    const valor = e.data[campo];
    const lista = Array.isArray(valor) ? valor : valor ? [valor] : [];
    for (const ref of lista) {
      const id = idDe(ref);
      if (!id) continue;
      const destino = porId.get(id);
      if (!destino) refsSinPublicar.push({ campo, id, estado: 'inexistente' });
      else if (!estaPublicada(id)) refsSinPublicar.push({ campo, id, estado: destino.data.status ?? 'sin-status' });
    }
  }

  informe.push({
    id: e.data.id,
    coleccion: e.coleccion,
    status: e.data.status ?? 'sin-status',
    sensibilidad,
    fichero: e.fichero,
    falta,
    refs_sin_publicar: refsSinPublicar,
  });
}

const total = entradas.length;
const publicadas = entradas.filter((e) => e.data.status === 'publicado').length;
const conRefs = informe.filter((i) => i.refs_sin_publicar.length > 0).length;
const sinFalta = informe.filter((i) => i.falta.length === 0).length;

const resumen = {
  generated_at: new Date().toISOString(),
  contenido_total: total,
  publicadas,
  sin_publicar: informe.length,
  publicables_sin_tocar_metadata: sinFalta,
  con_referencias_a_no_publicadas: conRefs,
  entradas: informe,
};

const json = arg('json');
if (json) {
  fs.mkdirSync(path.dirname(path.resolve(RAIZ, json)), { recursive: true });
  fs.writeFileSync(path.resolve(RAIZ, json), JSON.stringify(resumen, null, 2) + '\n');
}

const md = arg('md');
const lineas = [
  '# Publicación pendiente · informe derivado',
  '',
  `Generado: ${resumen.generated_at}`,
  '',
  `- Entradas de contenido: **${total}**`,
  `- Publicadas: **${publicadas}**`,
  `- Sin publicar: **${informe.length}**`,
  `- Sin publicar a las que no les falta ningún campo de metadata: **${sinFalta}**`,
  `- Sin publicar con referencias a entradas no publicadas: **${conRefs}**`,
  '',
  '> Este informe no publica nada. Publicar exige revisión factual registrada (fecha) y, en',
  '> contenido YMYL (sensibilidad media/alta), fuentes tipadas. Las referencias a entradas no',
  '> publicadas hacen que el validador canónico bloquee con `B-REF-PRIVADA` si se publica una',
  '> sola pieza: el grafo editorial está conectado.',
  '',
  '| id | colección | estado | sensibilidad | le falta | refs sin publicar |',
  '| --- | --- | --- | --- | --- | --- |',
  ...informe.map(
    (i) =>
      `| \`${i.id}\` | ${i.coleccion} | ${i.status} | ${i.sensibilidad} | ${i.falta.join(', ') || '—'} | ${
        i.refs_sin_publicar.map((r) => `${r.campo}:${r.id} (${r.estado})`).join('<br>') || '—'
      } |`,
  ),
  '',
];
if (md) {
  fs.mkdirSync(path.dirname(path.resolve(RAIZ, md)), { recursive: true });
  fs.writeFileSync(path.resolve(RAIZ, md), lineas.join('\n'));
}

console.log(
  `publicacion:pendiente · contenido ${total} · publicadas ${publicadas} · sin publicar ${informe.length} · sin metadata pendiente ${sinFalta} · con refs a no publicadas ${conRefs}`,
);
