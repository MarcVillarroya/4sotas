#!/usr/bin/env node
/**
 * 4 Sotas · publicar la ficha de un vídeo en cuanto es público en YouTube (V6-H).
 *
 * Un disparo, un efecto: comprobación de sólo lectura del `privacyStatus` real y, sólo si
 * ya es `public`, promoción de la ficha en el sitio. Si sigue privado u oculto sale con 0
 * sin tocar nada: el cron puede reintentar sin efectos colaterales.
 *
 * Qué cambia (y sólo esto, sin reordenar el YAML):
 *   status: revision|aprobado → publicado
 *   estado_youtube            → publico
 *   privacidad_api            → public   (el esquema lo exige con estado_youtube=publico)
 *   verificado_en             → hoy
 *
 * No toca el copy editorial (título, descripción, resumen, puntos, temas, relaciones),
 * ni la miniatura, ni la fecha `publicado_en`.
 *
 * Uso:
 *   node scripts/publicar-ficha.mjs --youtube-id wsseghAWiMw                 # plan (dry-run)
 *   node scripts/publicar-ficha.mjs --youtube-id wsseghAWiMw --commit        # aplica + commit + push
 *   node scripts/publicar-ficha.mjs --youtube-id wsseghAWiMw --escribir      # aplica sin commit
 *
 * Opciones:
 *   --youtube-id <11>   id del vídeo (obligatorio)
 *   --ficha <ruta>      ficha concreta (por defecto se busca por youtube_id)
 *   --content <dir>     directorio de fichas (por defecto src/content/videos)
 *   --estado <json>     fixture {privacy: "public"|"private"|"unlisted"} en lugar de la API
 *   --escribir          escribe la ficha sin tocar git
 *   --commit            escribe, valida y hace commit + push (dispara el deploy de Pages)
 *   --sin-validar       omite `npm run check` tras escribir (sólo para depurar)
 *   --json <ruta>       informe máquina-legible
 *   --hoy <fecha>       fecha a registrar en `verificado_en`
 *
 * La API se consulta con `yt_verify.py` del perfil del canal: sólo lectura, sin subir ni
 * cambiar nada en YouTube. El token no vive en este repo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { resolverInterprete } from './conciliar-videos.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
const SCRIPTS_YT = process.env.YT_SCRIPTS ?? path.join(process.env.HOME ?? '', '.hermes/profiles/orchestrator/scripts');

const args = process.argv.slice(2);
const arg = (nombre, porDefecto = null) => {
  const i = args.indexOf(`--${nombre}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : porDefecto;
};
const bandera = (nombre) => args.includes(`--${nombre}`);

/** Estados de YouTube que permiten publicar la ficha en el sitio. */
export const PUBLICO = 'public';

/**
 * Traduce la privacidad de la API al estado editorial de la ficha. Se mantiene aquí (y no
 * se importa) porque este script sólo necesita distinguir "ya es público" del resto.
 */
export function esPublico(privacidad) {
  return String(privacidad ?? '').trim().toLowerCase() === PUBLICO;
}

/**
 * Calcula los parches de la ficha. Devuelve `{}` cuando ya está todo en su sitio, para que
 * el script sea idempotente: correrlo dos veces no genera un segundo commit.
 */
export function parchesFicha(data, { hoy }) {
  const parches = {};
  if (data.status !== 'publicado') parches.status = 'publicado';
  if (data.estado_youtube !== 'publico') parches.estado_youtube = 'publico';
  if (data.privacidad_api !== 'public') parches.privacidad_api = 'public';
  const verificado = data.verificado_en instanceof Date
    ? data.verificado_en.toISOString().slice(0, 10)
    : String(data.verificado_en ?? '');
  if (verificado !== hoy) parches.verificado_en = hoy;
  return parches;
}

const salir = (codigo, mensaje) => {
  if (mensaje) console.error(mensaje);
  process.exit(codigo);
};

const JSON_OUT = arg('json');

function informe(datos) {
  if (JSON_OUT) {
    fs.mkdirSync(path.dirname(path.resolve(JSON_OUT)), { recursive: true });
    fs.writeFileSync(JSON_OUT, `${JSON.stringify(datos, null, 2)}\n`, 'utf8');
  }
}

/* ── 1 · privacidad real: fixture o API de sólo lectura ── */
function leerPrivacidad(youtubeId) {
  const fixture = arg('estado');
  if (fixture) {
    const ruta = path.resolve(fixture);
    if (!fs.existsSync(ruta)) salir(2, `publicar-ficha: no existe el fixture ${ruta}`);
    const datos = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    const privacidad = datos.privacy ?? datos.privacidad ?? datos.privacyStatus ?? null;
    if (!privacidad) salir(2, `publicar-ficha: el fixture ${ruta} no declara privacy|privacidad`);
    return { privacidad: String(privacidad), publishAt: '', fuente: `fixture ${ruta}` };
  }

  const bin = path.join(SCRIPTS_YT, 'yt_verify.py');
  if (!fs.existsSync(bin)) salir(2, `publicar-ficha: falta ${bin} (scripts de YouTube del perfil del canal)`);
  let interprete;
  try {
    interprete = resolverInterprete();
  } catch (e) {
    salir(2, `publicar-ficha: ${e.message}`);
  }
  const r = spawnSync(interprete, [bin, youtubeId], { encoding: 'utf8' });
  if (r.error) salir(2, `publicar-ficha: no se pudo ejecutar ${interprete}: ${r.error.message}`);
  const salida = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim();
  if (r.status !== 0) {
    const ultima = (r.stderr ?? '').trim().split('\n').filter(Boolean).slice(-1)[0] ?? '(sin detalle)';
    salir(1, `publicar-ficha: la API falló (código ${r.status}): ${ultima}`);
  }
  const m = /^privacy:\s*(.*)$/m.exec(salida);
  if (!m || !m[1].trim()) salir(1, 'publicar-ficha: el read-back no trae privacyStatus; no se toca la ficha');
  const campo = (nombre) => {
    const mm = new RegExp(`^${nombre}:\\s*(.*)$`, 'm').exec(salida);
    return mm ? mm[1].trim() : '';
  };
  return { privacidad: m[1].trim(), publishAt: campo('publishAt'), fuente: bin };
}

/**
 * Actualiza la instantánea del canal que usa `npm run validate`: si el vídeo ya es público,
 * el inventario tiene que decirlo o el validador rechaza la ficha recién publicada
 * (`B-VIDEO-ESTADO`). Sólo se tocan los campos factuales del vídeo en cuestión.
 */
export function actualizarSnapshot(ruta, youtubeId, { publicadoEn = null } = {}) {
  if (!fs.existsSync(ruta)) return false;
  const snap = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  const entrada = (snap.videos ?? []).find((v) => v?.videoId === youtubeId);
  if (!entrada) return false;
  let cambiado = false;
  if (entrada.privacy_status !== 'public') {
    entrada.privacy_status = 'public';
    cambiado = true;
  }
  if (entrada.publish_at) {
    entrada.publish_at = null;
    cambiado = true;
  }
  if (publicadoEn && entrada.published_at !== publicadoEn) {
    entrada.published_at = publicadoEn;
    cambiado = true;
  }
  if (!cambiado) return false;
  fs.writeFileSync(ruta, `${JSON.stringify(snap, null, 2)}\n`, 'utf8');
  return true;
}

function main() {
  const YT_ID = arg('youtube-id');
  const CONTENT = path.resolve(arg('content', path.join(RAIZ, 'src/content/videos')));
  const HOY = arg('hoy', new Date().toISOString().slice(0, 10));
  const ESCRIBIR = bandera('escribir') || bandera('commit');
  const COMMIT = bandera('commit');
  const VALIDAR = !bandera('sin-validar');

  if (!YT_ID) salir(2, 'uso: node scripts/publicar-ficha.mjs --youtube-id <id> [--commit|--escribir] [--estado fixture.json]');
  if (!/^[A-Za-z0-9_-]{11}$/.test(YT_ID)) salir(2, `publicar-ficha: id de YouTube no válido: ${YT_ID}`);

  /* ficha */
  const rutaFicha = arg('ficha');
  if (rutaFicha && !fs.existsSync(rutaFicha)) salir(2, `publicar-ficha: no existe la ficha ${rutaFicha}`);
  const candidata = rutaFicha ? path.resolve(rutaFicha) : path.join(CONTENT, `vid-${YT_ID}.yaml`);
  if (!fs.existsSync(candidata)) salir(1, `publicar-ficha: no hay ficha para ${YT_ID} en ${CONTENT}`);
  const textoOriginal = fs.readFileSync(candidata, 'utf8');
  const doc = YAML.parseDocument(textoOriginal);
  const data = doc.toJS() ?? {};
  if (data.youtube_id !== YT_ID) salir(1, `publicar-ficha: la ficha ${path.basename(candidata)} declara youtube_id=${data.youtube_id}`);

  const { privacidad, fuente } = leerPrivacidad(YT_ID);
  const publico = esPublico(privacidad);
  console.log(`publicar-ficha · ${YT_ID} · privacidad=${privacidad} (${fuente}) · ${HOY}`);

  if (!publico) {
    console.log('el vídeo todavía no es público: no se toca la ficha.');
    informe({ ok: true, publicado: false, youtube_id: YT_ID, privacidad, ficha: candidata, cambios: {} });
    process.exit(0);
  }

  /* reglas editoriales: sin información completa la ficha no sale */
  const info = data.informacion ?? {};
  if (info.estado !== 'completo')
    salir(
      1,
      `publicar-ficha: ${path.basename(candidata)} tiene informacion.estado=${info.estado ?? 'ausente'}; una ficha publicada exige 'completo'. Completa el copy antes de publicar.`,
    );
  if (data.seo?.noindex) salir(1, `publicar-ficha: ${path.basename(candidata)} está marcada noindex y no puede publicarse`);
  if (!data.publicado_en) salir(1, `publicar-ficha: ${path.basename(candidata)} no declara publicado_en`);

  const parches = parchesFicha(data, { hoy: HOY });
  if (!Object.keys(parches).length) {
    console.log('la ficha ya está publicada y verificada: nada que hacer.');
    informe({ ok: true, publicado: true, youtube_id: YT_ID, privacidad, ficha: candidata, cambios: {}, escrito: false });
    process.exit(0);
  }

  const detalle = Object.entries(parches)
    .map(([k, v]) => `${k}: ${String(data[k])} → ${v}`)
    .join('\n  ');
  console.log(`cambios previstos:\n  ${detalle}`);

  if (!ESCRIBIR) {
    console.log('modo seco: no se escribe nada. Añade --escribir o --commit.');
    informe({ ok: true, publicado: true, dry_run: true, youtube_id: YT_ID, privacidad, ficha: candidata, cambios: parches });
    process.exit(0);
  }

  for (const [clave, valor] of Object.entries(parches)) doc.set(clave, valor);
  // `lineWidth: 0`: sin reflujo de líneas largas, el diff sólo enseña los campos que cambian.
  fs.writeFileSync(candidata, doc.toString({ lineWidth: 0 }), 'utf8');
  console.log(`ficha escrita: ${candidata}`);

  /* inventario del canal: la API ya dice public, el snapshot tiene que coincidir */
  const SNAPSHOT = path.resolve(arg('snapshot', path.join(RAIZ, 'data/inventory-snapshot.json')));
  const textoSnapshot = fs.existsSync(SNAPSHOT) ? fs.readFileSync(SNAPSHOT, 'utf8') : null;
  const snapshotTocado = actualizarSnapshot(SNAPSHOT, YT_ID);
  if (snapshotTocado) console.log(`inventario actualizado: ${SNAPSHOT}`);
  else console.log('inventario: sin cambios (o el vídeo no está en la instantánea)');

  /* validación del esquema con la ficha ya mutada; si falla, se revierte todo */
  if (VALIDAR) {
    const r = spawnSync('npm', ['run', 'check'], { cwd: RAIZ, encoding: 'utf8' });
    if (r.status !== 0) {
      fs.writeFileSync(candidata, textoOriginal, 'utf8');
      if (snapshotTocado) fs.writeFileSync(SNAPSHOT, textoSnapshot, 'utf8');
      const cola = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n').slice(-12).join('\n');
      informe({ ok: false, youtube_id: YT_ID, privacidad, ficha: candidata, cambios: parches, error: 'npm run check' });
      salir(1, `publicar-ficha: \`npm run check\` falló; ficha revertida.\n${cola}`);
    }
    console.log('validación: npm run check en verde');
  }

  if (!COMMIT) {
    console.log('sin --commit: cambios en el árbol de trabajo, sin commit.');
    informe({ ok: true, publicado: true, youtube_id: YT_ID, privacidad, ficha: candidata, cambios: parches, escrito: true, commit: false });
    process.exit(0);
  }

  /* commit + push: rutas explícitas, mensaje en español */
  const git = (argv) => {
    const r = spawnSync('git', argv, { cwd: RAIZ, encoding: 'utf8' });
    return { codigo: r.status ?? 1, salida: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() };
  };
  const relativa = path.relative(RAIZ, candidata);
  const slug = data.slug ?? YT_ID;
  const mensaje = `feat(video): publicar la ficha de «${slug}» al confirmarse público en YouTube`;
  const rutas = ['--', relativa];
  if (snapshotTocado) rutas.push(path.relative(RAIZ, SNAPSHOT));

  const add = git(['add', ...rutas]);
  if (add.codigo !== 0) salir(1, `publicar-ficha: git add falló: ${add.salida}`);
  const commit = git(['commit', '-m', mensaje, ...rutas]);
  if (commit.codigo !== 0) salir(1, `publicar-ficha: git commit falló: ${commit.salida}`);
  console.log(commit.salida.split('\n')[0]);

  const push = git(['push', 'origin', 'main']);
  if (push.codigo !== 0) {
    informe({ ok: false, youtube_id: YT_ID, privacidad, ficha: candidata, cambios: parches, escrito: true, commit: true, push: false, error: push.salida });
    salir(1, `publicar-ficha: el commit está hecho pero el push falló (revisa permisos o protección de rama):\n${push.salida}`);
  }
  console.log('push a origin/main: OK (el workflow pages.yml despliega en el siguiente run)');

  informe({
    ok: true,
    publicado: true,
    youtube_id: YT_ID,
    privacidad,
    ficha: candidata,
    cambios: parches,
    escrito: true,
    commit: true,
    push: true,
    mensaje,
  });
}

const esPrincipal = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (esPrincipal) main();
