#!/usr/bin/env node
/**
 * 4 Sotas · pack editorial de vídeo (V2.2-A).
 *
 * Un pack por pieza (ver v2.2/VIDEO-INFO.md). De aquí salen, sin copiar nada a mano:
 *   1. la descripción de YouTube,
 *   2. la ficha web `src/content/videos/vid-<id>.yaml`.
 *
 * Uso:
 *   node scripts/pack-video.mjs --pack packs/vid-XXXXXXXXXXX.yaml --youtube-id XXXXXXXXXXX
 *   node scripts/pack-video.mjs --pack ... --youtube-id ... --out-ficha src/content/videos/vid-XXXXXXXXXXX.yaml
 *
 * Opciones:
 *   --pack <ruta>          pack YAML (obligatorio)
 *   --youtube-id <11>      id real del vídeo; si falta se muestra el hueco y no se escribe ficha
 *   --out-ficha <ruta>     escribe la ficha web en esa ruta (sin esta opción, solo la imprime)
 *   --json <ruta>          informe máquina-legible
 *   --hoy <YYYY-MM-DD>     fecha de verificación (por defecto la del sistema)
 *
 * Nunca llama a la API de YouTube ni escribe fuera de la ruta indicada: es el modo seguro
 * para revisar un pack antes de programar nada.
 */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { fichaDesdePack, descripcionYouTube, validarPack } from '../src/lib/videoInfo.ts';

const args = process.argv.slice(2);
const arg = (nombre, porDefecto = null) => {
  const i = args.indexOf(`--${nombre}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : porDefecto;
};

const PACK = arg('pack');
const YT_ID = arg('youtube-id');
const OUT_FICHA = arg('out-ficha');
const JSON_OUT = arg('json');
const HOY = arg('hoy', new Date().toISOString().slice(0, 10));

if (!PACK) {
  console.error('uso: node scripts/pack-video.mjs --pack <pack.yaml> [--youtube-id <11>] [--out-ficha <ruta>]');
  process.exit(2);
}

const leerPack = (ruta) => {
  if (!fs.existsSync(ruta)) {
    console.error(`pack-video: no existe el pack ${ruta}`);
    process.exit(2);
  }
  try {
    return YAML.parse(fs.readFileSync(ruta, 'utf8')) ?? {};
  } catch (err) {
    console.error(`pack-video: el pack no es YAML válido (${err.message})`);
    process.exit(2);
  }
};

const pack = leerPack(PACK);
const resultado = validarPack(pack, { existe: (r) => fs.existsSync(r) });

if (!resultado.ok) {
  console.error(`pack incompleto: ${resultado.errores.length} problema(s). No se genera nada.`);
  for (const e of resultado.errores) console.error(`  ✗ ${e.campo} — ${e.mensaje}`);
  if (JSON_OUT)
    fs.writeFileSync(JSON_OUT, `${JSON.stringify({ ok: false, pack: PACK, errores: resultado.errores }, null, 2)}\n`, 'utf8');
  process.exit(1);
}

const descripcion = descripcionYouTube(pack);
const idVideo = YT_ID ?? pack.youtube_id ?? null;

let ficha = null;
if (idVideo) {
  ficha = fichaDesdePack(
    pack,
    {
      youtubeId: idVideo,
      // En seco no hay respuesta de la API: el vídeo aún no existe, así que se describe
      // como programado (privado con publishAt), que es exactamente lo que se va a subir.
      privacidad: 'private',
      publicadoEn: new Date(pack.publicar_en).toISOString(),
      programadoPara: new Date(pack.publicar_en).toISOString(),
      duracionISO: pack.duracion_iso ?? 'PT0S',
    },
    { hoy: HOY },
  );
}

console.log(`pack: OK · ${PACK}`);
console.log(`slug: ${pack.slug}`);
console.log(`publicar_en: ${pack.publicar_en}`);
console.log('');
console.log('── descripción de YouTube ──');
console.log(descripcion);
console.log('');
console.log(`── descripción: ${descripcion.length} caracteres (límite de YouTube: 5000) ──`);
if (descripcion.length > 5000) {
  console.error('✗ la descripción supera los 5000 caracteres que admite YouTube');
  process.exit(1);
}

if (!ficha) {
  console.log('sin --youtube-id: no se puede escribir la ficha (el id solo lo asigna YouTube al subir).');
  if (JSON_OUT)
    fs.writeFileSync(
      JSON_OUT,
      `${JSON.stringify({ ok: true, pack: PACK, descripcion, descripcion_caracteres: descripcion.length, ficha: null }, null, 2)}\n`,
      'utf8',
    );
  process.exit(0);
}

const yamlFicha = YAML.stringify(ficha, { lineWidth: 0 });
console.log(`── ficha web (vid-${idVideo}.yaml) ──`);
console.log(yamlFicha);

if (OUT_FICHA) {
  const destino = path.resolve(OUT_FICHA);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, yamlFicha, 'utf8');
  console.log(`escrita: ${destino}`);
}

if (JSON_OUT)
  fs.writeFileSync(
    JSON_OUT,
    `${JSON.stringify(
      { ok: true, pack: PACK, youtube_id: idVideo, descripcion, descripcion_caracteres: descripcion.length, ficha, ficha_escrita: OUT_FICHA ?? null },
      null,
      2,
    )}\n`,
    'utf8',
  );
