#!/usr/bin/env node
/**
 * 4 Sotas · programar una pieza de vídeo (V2.2-A).
 *
 * Un solo comando: validar pack → subir privado con `publishAt` → read-back → subir SRT →
 * escribir la ficha web desde el pack + la respuesta de YouTube.
 *
 * Modo seguro por defecto: `--dry-run`. Sin `--ejecutar` NO se llama a YouTube, no se lee
 * ningún token y no se escribe nada en `src/content/`. Si el pack está incompleto, se para
 * y se dice qué campo falta.
 *
 * Uso:
 *   node scripts/programar-video.mjs --pack packs/x.yaml                    # plan (dry-run)
 *   node scripts/programar-video.mjs --pack packs/x.yaml --ejecutar         # subida real
 *
 * Opciones:
 *   --pack <ruta>        pack editorial (obligatorio)
 *   --video <ruta>       mp4 real (si no se pasa, se usa `video:` del pack)
 *   --srt <ruta>         subtítulos a subir (si no se pasa, `transcripcion.fuente` del pack)
 *   --miniatura <ruta>   solo se comprueba que existe: la sube Marc en Studio, nunca este script
 *   --duracion <PT..,>   duración real del fichero si el pack no la declara
 *   --youtube-id <11>    solo para dry-run: simula la ficha con un id concreto
 *   --ejecutar           sale del modo seguro y publica (privado + publishAt)
 *   --json <ruta>        informe máquina-legible
 *
 * La miniatura NO se sube desde aquí (`thumbnails.set` está prohibido en esta cadena).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { descripcionYouTube, fichaDesdePack, validarPack } from '../src/lib/videoInfo.ts';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
const CONTENIDO = path.join(RAIZ, 'src/content/videos');
/** Scripts de YouTube del perfil del canal. El token se queda fuera del repo. */
const SCRIPTS_YT = process.env.YT_SCRIPTS ?? path.join(process.env.HOME ?? '', '.hermes/profiles/orchestrator/scripts');

const args = process.argv.slice(2);
const arg = (nombre, porDefecto = null) => {
  const i = args.indexOf(`--${nombre}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : porDefecto;
};
const bandera = (nombre) => args.includes(`--${nombre}`);

const PACK = arg('pack');
const EJECUTAR = bandera('ejecutar');
const JSON_OUT = arg('json');
const YT_ID = arg('youtube-id');
const HOY = new Date().toISOString().slice(0, 10);

const salir = (codigo, mensaje) => {
  if (mensaje) console.error(mensaje);
  process.exit(codigo);
};

if (!PACK) salir(2, 'uso: node scripts/programar-video.mjs --pack <pack.yaml> [--dry-run|--ejecutar]');
if (!fs.existsSync(PACK)) salir(2, `programar-video: no existe el pack ${PACK}`);

let pack;
try {
  pack = YAML.parse(fs.readFileSync(PACK, 'utf8')) ?? {};
} catch (err) {
  salir(2, `programar-video: el pack no es YAML válido (${err.message})`);
}

/* ── 1 · validar el pack: sin pack completo no se programa nada ── */
const video = arg('video', pack.video);
const srt = arg('srt', pack.transcripcion?.fuente ?? null);
const duracion = arg('duracion', pack.duracion_iso ?? null);
const miniatura = arg('miniatura', pack.miniatura);

const resultado = validarPack({ ...pack, video, transcripcion: pack.transcripcion ?? (srt ? { estado: 'revisada', fuente: srt } : undefined) }, {
  existe: (r) => fs.existsSync(r),
});
if (!resultado.ok) {
  console.error(`pack incompleto: no se programa. ${resultado.errores.length} problema(s):`);
  for (const e of resultado.errores) console.error(`  ✗ ${e.campo} — ${e.mensaje}`);
  if (JSON_OUT)
    fs.writeFileSync(JSON_OUT, `${JSON.stringify({ ok: false, pack: PACK, errores: resultado.errores }, null, 2)}\n`, 'utf8');
  process.exit(1);
}

/** Camino de publicación: SRT y duración son obligatorios, aunque el pack editorial no los exija. */
const faltasPublicacion = [];
if (!srt) faltasPublicacion.push({ campo: 'srt', mensaje: 'falta el SRT a subir (--srt o transcripcion.fuente del pack)' });
else if (!fs.existsSync(srt)) faltasPublicacion.push({ campo: 'srt', mensaje: `el SRT no existe: ${srt}` });
if (!duracion) faltasPublicacion.push({ campo: 'duracion_iso', mensaje: 'falta la duración real del vídeo (--duracion o duracion_iso del pack)' });
if (!fs.existsSync(video)) faltasPublicacion.push({ campo: 'video', mensaje: `el vídeo no existe: ${video}` });
if (faltasPublicacion.length) {
  console.error(`no se puede programar: ${faltasPublicacion.length} problema(s)`);
  for (const e of faltasPublicacion) console.error(`  ✗ ${e.campo} — ${e.mensaje}`);
  process.exit(1);
}

const descripcion = descripcionYouTube(pack);
const publicarEn = new Date(pack.publicar_en).toISOString();
const tags = pack.keywords.join(',');

console.log(`pack: OK · ${PACK}`);
console.log(`título: ${pack.titulo}`);
console.log(`publicar_en: ${publicarEn} (privado hasta el estreno)`);
console.log(`vídeo: ${video}`);
console.log(`subtítulos: ${srt}`);
console.log(`miniatura: ${miniatura} — la sube Marc en Studio, este script no la toca`);
console.log(`descripción: ${descripcion.length} caracteres · ${pack.keywords.length} etiquetas`);

if (!EJECUTAR) {
  const idSimulado = YT_ID ?? null;
  const ficha = idSimulado
    ? fichaDesdePack(
        pack,
        {
          youtubeId: idSimulado,
          privacidad: 'private',
          publicadoEn: publicarEn,
          programadoPara: publicarEn,
          duracionISO: duracion,
        },
        { hoy: HOY },
      )
    : null;
  console.log('');
  console.log('── PLAN (sin tocar YouTube) ──');
  console.log('1. yt_upload.py --privacy private --publish-at <publicar_en>  (sin --thumb)');
  console.log('2. read-back del recurso subido (título, privacidad, publishAt)');
  console.log('3. yt_captions.py <youtube_id> <srt>');
  console.log(`4. escribir ficha web ${path.join(CONTENIDO, `vid-${idSimulado ?? '<youtube_id>'}.yaml`)}`);
  if (ficha) {
    console.log('');
    console.log('── ficha web simulada ──');
    console.log(YAML.stringify(ficha, { lineWidth: 0 }));
  } else {
    console.log('sin --youtube-id: la ficha no se puede simular (el id lo asigna YouTube al subir).');
  }
  console.log('');
  console.log('descripción que se subiría:');
  console.log(descripcion);
  if (JSON_OUT)
    fs.writeFileSync(
      JSON_OUT,
      `${JSON.stringify({ ok: true, dry_run: true, pack: PACK, publicar_en: publicarEn, descripcion, ficha }, null, 2)}\n`,
      'utf8',
    );
  process.exit(0);
}

/* ── 2 · subida real: privado con publishAt ── */
const yt = (script, argv) => {
  const bin = path.join(SCRIPTS_YT, script);
  if (!fs.existsSync(bin)) salir(2, `programar-video: falta ${bin} (scripts de YouTube del perfil del canal)`);
  const r = spawnSync('python3', [bin, ...argv], { encoding: 'utf8' });
  const salida = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim();
  return { codigo: r.status ?? 1, salida };
};

const subida = yt('yt_upload.py', [
  '--video',
  video,
  '--title',
  pack.titulo,
  '--description',
  descripcion,
  '--tags',
  tags,
  '--privacy',
  'private',
  '--publish-at',
  publicarEn,
]);
process.stdout.write(subida.salida + '\n');
if (subida.codigo !== 0) salir(1, `✗ la subida falló (código ${subida.codigo}); no se escribe ficha`);

const m = /UPLOADED\s+([A-Za-z0-9_-]{11})/.exec(subida.salida);
if (!m) salir(1, '✗ la subida no devolvió un id utilizable; no se escribe ficha');
const youtubeId = m[1];

/* read-back obligatorio antes de escribir nada */
const verificacion = yt('yt_verify.py', [youtubeId]);
process.stdout.write(verificacion.salida + '\n');
if (verificacion.codigo !== 0) salir(1, '✗ el read-back del vídeo falló; no se escribe ficha');
const campoVerify = (nombre) => {
  const mm = new RegExp(`^${nombre}:\\s*(.*)$`, 'm').exec(verificacion.salida);
  return mm ? mm[1].trim() : '';
};
const privacidad = campoVerify('privacy');
const programadoPara = campoVerify('publishAt') || publicarEn;
if (!['private', 'unlisted', 'public'].includes(privacidad)) salir(1, `✗ read-back sin privacidad reconocible (${privacidad}); no se escribe ficha`);
if (campoVerify('title') !== pack.titulo) console.warn('⚠ el título del read-back no coincide exactamente con el del pack');

const captions = yt('yt_captions.py', [youtubeId, srt]);
process.stdout.write(captions.salida + '\n');
if (captions.codigo !== 0) console.warn('⚠ los subtítulos no se subieron: la ficha se escribe igual (se reintenta en la conciliación)');

/* ── 3 · ficha web desde el pack + respuesta de YouTube ── */
const ficha = fichaDesdePack(
  pack,
  {
    youtubeId,
    privacidad: privacidad === 'public' ? 'public' : privacidad === 'unlisted' ? 'unlisted' : 'private',
    publicadoEn: new Date().toISOString(),
    programadoPara: privacidad === 'private' ? programadoPara : null,
    duracionISO: duracion,
    miniatura: `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`,
  },
  { hoy: HOY },
);

const destino = path.join(CONTENIDO, `vid-${youtubeId}.yaml`);
if (fs.existsSync(destino)) salir(1, `✗ ya existe ${destino}: no se sobrescribe una ficha existente (usa la conciliación)`);
fs.writeFileSync(destino, YAML.stringify(ficha, { lineWidth: 0 }), 'utf8');
console.log(`ficha escrita: ${destino}`);

if (JSON_OUT)
  fs.writeFileSync(
    JSON_OUT,
    `${JSON.stringify({ ok: true, dry_run: false, youtube_id: youtubeId, ficha: destino, descripcion, privacidad }, null, 2)}\n`,
    'utf8',
  );
