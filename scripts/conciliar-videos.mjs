#!/usr/bin/env node
/**
 * 4 Sotas · conciliación semanal de vídeos (V2.2-A).
 *
 * Contrasta las fichas del sitio con lo que publica el canal y **solo** actualiza datos
 * factuales: estado en YouTube, privacidad, fecha de publicación, duración, vistas,
 * miniatura y fecha de verificación. El copy editorial (título, descripción, resumen,
 * puntos, temas, relaciones) no se toca nunca: si falta, se avisa.
 *
 * Uso:
 *   node scripts/conciliar-videos.mjs --entrada data/inventory-snapshot.json            # plan
 *   node scripts/conciliar-videos.mjs --desde-api                                     # lee el canal
 *   node scripts/conciliar-videos.mjs --entrada snap.json --aplicar --json qa/conciliacion.json
 *
 * Opciones:
 *   --entrada <json>   instantánea del canal {videos:[...]} (inventario, yt_raw o fixture)
 *   --desde-api        pide la lista de subidas a la API (usa yt_lista.py del perfil del canal)
 *   --content <dir>    directorio de fichas (por defecto src/content/videos)
 *   --aplicar          escribe los cambios factuales (por defecto solo informa)
 *   --json <ruta>      informe máquina-legible
 *   --hoy <fecha>      fecha de verificación a registrar
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
const SCRIPTS_YT = process.env.YT_SCRIPTS ?? path.join(process.env.HOME ?? '', '.hermes/profiles/orchestrator/scripts');

/** Campos que la conciliación puede reescribir. Todo lo demás es copy editorial. */
export const CAMPOS_FACTUALES = [
  'estado_youtube',
  'privacidad_api',
  'publicado_en',
  'duracion_iso',
  'vistas_al_verificar',
  'miniatura',
  'verificado_en',
];

/**
 * Normaliza una instantánea del canal. Acepta el formato del inventario del sitio
 * (`privacy_status`, `duration_iso8601`, `published_at`) y el de la API (`stats`).
 */
export function normalizarInstantanea(datos) {
  const videos = Array.isArray(datos) ? datos : (datos?.videos ?? []);
  return videos
    .filter((v) => v && typeof v.videoId === 'string')
    .map((v) => ({
      videoId: v.videoId,
      titulo: String(v.title ?? '').trim(),
      privacidad: v.privacy_status ?? v.privacidad ?? 'private',
      publishAt: v.publish_at ?? v.programadoPara ?? null,
      publicadoEn: v.published_at ?? v.publicadoEn ?? null,
      duracionISO: v.duration_iso8601 ?? v.duracionISO ?? null,
      miniatura: v.thumbnail_url ?? v.miniatura ?? null,
      vistas: typeof v.stats?.viewCount === 'string' ? Number(v.stats.viewCount) : (v.vistas ?? null),
    }));
}

/** Estado editorial en YouTube a partir de la privacidad real. */
export function estadoEnYouTube(v) {
  if (v.privacidad === 'public') return 'publico';
  if (v.privacidad === 'private' && v.publishAt) return 'programado';
  return 'oculto';
}

const fechaDia = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : null);

/** Lee las fichas del sitio conservando el documento YAML (para escribir solo lo factual). */
export function leerFichas(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .sort()
    .map((f) => {
      const ruta = path.join(dir, f);
      const texto = fs.readFileSync(ruta, 'utf8');
      const doc = YAML.parseDocument(texto);
      const data = doc.toJS() ?? {};
      return { archivo: f, ruta, doc, data };
    });
}

/**
 * Calcula la conciliación sin escribir nada. Devuelve qué cambiaría, qué vídeos públicos
 * no tienen ficha y qué fichas siguen con información pendiente.
 */
export function conciliar({ instantanea, fichas, hoy }) {
  const canal = new Map(normalizarInstantanea(instantanea).map((v) => [v.videoId, v]));
  const porId = new Map(fichas.map((f) => [f.data.youtube_id, f]));
  const cambios = [];
  const sinFicha = [];
  const sinVideoEnCanal = [];
  const pendientes = [];
  const avisos = [];

  for (const f of fichas) {
    const v = canal.get(f.data.youtube_id);
    const info = f.data.informacion ?? {};
    if (info.estado === 'pendiente') pendientes.push({ id: f.data.id, archivo: f.archivo, faltan: info.faltan ?? [] });
    if (!v) {
      sinVideoEnCanal.push({ id: f.data.id, archivo: f.archivo });
      continue;
    }

    const estado = estadoEnYouTube(v);
    /** @type {Record<string, unknown>} */
    const parches = {};
    if (f.data.estado_youtube !== estado) parches.estado_youtube = estado;
    if (f.data.privacidad_api !== v.privacidad) parches.privacidad_api = v.privacidad;
    if (v.duracionISO && f.data.duracion_iso !== v.duracionISO) parches.duracion_iso = v.duracionISO;
    const publicado = fechaDia(v.publicadoEn);
    if (publicado && fechaDia(f.data.publicado_en) !== publicado) parches.publicado_en = publicado;
    if (typeof v.vistas === 'number' && Number.isFinite(v.vistas) && f.data.vistas_al_verificar !== v.vistas)
      parches.vistas_al_verificar = v.vistas;
    if (v.miniatura && f.data.miniatura !== v.miniatura) parches.miniatura = v.miniatura;
    if (fechaDia(f.data.verificado_en) !== hoy) parches.verificado_en = hoy;

    // Único cambio de `status` admitido: promover a publicado cuando el vídeo ya es público
    // y la información editorial está completa. Nunca se degrada una ficha publicada.
    if (estado === 'publico' && f.data.status !== 'publicado') {
      if (info.estado === 'completo') parches.status = 'publicado';
      else avisos.push({ id: f.data.id, archivo: f.archivo, mensaje: 'el vídeo ya es público pero la información está pendiente: no se publica la ficha' });
    }
    if (estado === 'publico' && info.estado === 'pendiente')
      avisos.push({ id: f.data.id, archivo: f.archivo, mensaje: 'ficha pública con información editorial pendiente' });
    if (estado === 'eliminado' || (estado === 'oculto' && f.data.status === 'publicado'))
      avisos.push({ id: f.data.id, archivo: f.archivo, mensaje: `el vídeo ya no es público (${estado}): decide si la ficha se archiva` });

    if (Object.keys(parches).length) cambios.push({ id: f.data.id, archivo: f.archivo, parches });
  }

  for (const v of canal.values()) {
    if (!porId.has(v.videoId) && v.privacidad === 'public')
      sinFicha.push({ youtube_id: v.videoId, titulo: v.titulo, publicado_en: fechaDia(v.publicadoEn) });
  }

  return { hoy, cambios, sinFicha, sinVideoEnCanal, pendientes, avisos };
}

/** Aplica los cambios factuales sobre el documento YAML, sin reordenar ni tocar el resto. */
export function aplicarCambios(fichas, resultado) {
  const escritos = [];
  for (const c of resultado.cambios) {
    const f = fichas.find((x) => x.archivo === c.archivo);
    if (!f) continue;
    for (const [clave, valor] of Object.entries(c.parches)) f.doc.set(clave, valor);
    fs.writeFileSync(f.ruta, String(f.doc), 'utf8');
    escritos.push(c.archivo);
  }
  return escritos;
}

/* ───────────────────────────── CLI ───────────────────────────── */

/** Venv por defecto: allí viven google-auth y google-api-python-client del canal. */
export const PYTHON_POR_DEFECTO = 'venvs/yt-manager/bin/python';

/**
 * Resuelve el intérprete que ejecuta `yt_lista.py`: `YT_PYTHON` si está definido y, si no,
 * el venv del canal. Nunca `python3` a secas: el intérprete del sistema no trae las
 * librerías de YouTube. Lanza un error claro si la ruta no existe o no es ejecutable.
 */
export function resolverInterprete({ env = process.env, existe = fs.existsSync } = {}) {
  const configurado = (env.YT_PYTHON ?? '').trim();
  const candidato = configurado || path.join(env.HOME || '', PYTHON_POR_DEFECTO);
  const comoSeArregla = configurado
    ? 'revisa YT_PYTHON (variable de entorno)'
    : 'define YT_PYTHON o crea el venv: python3 -m venv ~/venvs/yt-manager';
  if (!candidato) throw new Error(`no hay intérprete de Python: ${comoSeArregla}`);
  if (!existe(candidato)) throw new Error(`no existe el intérprete ${candidato}: ${comoSeArregla}`);
  return candidato;
}

function leerDeApi() {
  const bin = path.join(SCRIPTS_YT, 'yt_lista.py');
  if (!fs.existsSync(bin)) {
    console.error(`conciliar-videos: falta ${bin} para leer el canal (o usa --entrada <json>)`);
    process.exit(2);
  }
  let interprete;
  try {
    interprete = resolverInterprete();
  } catch (e) {
    console.error(`conciliar-videos: ${e.message}`);
    process.exit(2);
  }
  const r = spawnSync(interprete, [bin], { encoding: 'utf8' });
  if (r.error) {
    console.error(`conciliar-videos: no se pudo ejecutar ${interprete}: ${r.error.message}`);
    process.exit(2);
  }
  if (r.status !== 0) {
    console.error(`conciliar-videos: la API falló: ${(r.stderr ?? '').trim().split('\n').slice(-1)[0]}`);
    process.exit(1);
  }
  return JSON.parse(r.stdout);
}

function main() {
  const args = process.argv.slice(2);
  const arg = (nombre, porDefecto = null) => {
    const i = args.indexOf(`--${nombre}`);
    return i >= 0 && args[i + 1] ? args[i + 1] : porDefecto;
  };
  const ENTRADA = arg('entrada');
  const DESDE_API = args.includes('--desde-api');
  const APLICAR = args.includes('--aplicar');
  const CONTENT = path.resolve(arg('content', path.join(RAIZ, 'src/content/videos')));
  const JSON_OUT = arg('json');
  const HOY = arg('hoy', new Date().toISOString().slice(0, 10));

  let instantanea;
  if (DESDE_API) instantanea = leerDeApi();
  else if (ENTRADA && fs.existsSync(ENTRADA)) instantanea = JSON.parse(fs.readFileSync(ENTRADA, 'utf8'));
  else {
    console.error('uso: node scripts/conciliar-videos.mjs --entrada <snapshot.json> | --desde-api [--aplicar] [--json informe.json]');
    process.exit(2);
  }

  const fichas = leerFichas(CONTENT);
  const resultado = conciliar({ instantanea, fichas, hoy: HOY });
  const escritos = APLICAR ? aplicarCambios(fichas, resultado) : [];

  console.log(`conciliación ${APLICAR ? 'aplicada' : 'en seco'} · ${fichas.length} fichas · ${HOY}`);
  for (const c of resultado.cambios) {
    const detalle = Object.entries(c.parches)
      .map(([k, v]) => `${k}=${v}`)
      .join(' · ');
    console.log(`  ${APLICAR ? '✔' : '·'} ${c.archivo}: ${detalle}`);
  }
  if (!resultado.cambios.length) console.log('  sin cambios factuales');
  for (const v of resultado.sinFicha)
    console.log(`  ⚠ vídeo público sin ficha: ${v.youtube_id} "${v.titulo}" (${v.publicado_en ?? 'fecha desconocida'})`);
  for (const v of resultado.sinVideoEnCanal) console.log(`  ⚠ ficha sin vídeo en el canal: ${v.archivo}`);
  for (const p of resultado.pendientes) console.log(`  ⚠ información pendiente en ${p.archivo}: ${p.faltan.join(' · ') || '(sin detalle)'}`);
  for (const a of resultado.avisos) console.log(`  ⚠ ${a.archivo}: ${a.mensaje}`);

  if (JSON_OUT) {
    fs.mkdirSync(path.dirname(path.resolve(JSON_OUT)), { recursive: true });
    fs.writeFileSync(JSON_OUT, `${JSON.stringify({ ...resultado, aplicado: APLICAR, escritos }, null, 2)}\n`, 'utf8');
  }
  // Sin ficha para un vídeo público es un hueco real: código 1 en seco para que el cron avise.
  const huecos = resultado.sinFicha.length + resultado.pendientes.length;
  process.exit(huecos > 0 && !APLICAR ? 1 : 0);
}

const esPrincipal = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (esPrincipal) main();
