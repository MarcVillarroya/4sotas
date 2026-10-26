import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import {
  descripcionYouTube,
  fichaDesdePack,
  marcaTiempo,
  validarPack,
  type Pack,
} from '../src/lib/videoInfo.ts';

const RAIZ = process.cwd();
const FIXTURES = path.join(RAIZ, 'tests/fixtures/video-pack');
const VALIDO = path.join(FIXTURES, 'pack-valido.yaml');
const INCOMPLETO = path.join(FIXTURES, 'pack-incompleto.yaml');

const leer = (ruta: string): Pack => YAML.parse(fs.readFileSync(ruta, 'utf8')) as Pack;
const campos = (errores: { campo: string }[]) => errores.map((e) => e.campo);

/* ───────────────────── pack incompleto: no se programa ───────────────────── */

test('un pack incompleto falla y dice exactamente qué campo falta', () => {
  const r = validarPack(leer(INCOMPLETO), { existe: () => true });
  assert.equal(r.ok, false);
  const listado = campos(r.errores);
  assert.ok(listado.includes('resumen_editorial'), `debe señalar resumen_editorial: ${listado.join(', ')}`);
  assert.ok(listado.includes('para_quien'), 'debe señalar para_quien');
  assert.ok(listado.includes('publicar_en'), 'debe señalar publicar_en');
  assert.ok(listado.includes('que_cubre'), 'debe señalar que solo hay un punto en que_cubre');
  const mensaje = r.errores.find((e) => e.campo === 'resumen_editorial')?.mensaje ?? '';
  assert.match(mensaje, /falta el campo obligatorio "resumen_editorial"/);
});

test('un pack completo pasa la validación con los ficheros reales del fixture', () => {
  const r = validarPack(leer(VALIDO), { existe: (p) => fs.existsSync(path.resolve(RAIZ, p)) });
  assert.deepEqual(r.errores, []);
  assert.equal(r.ok, true);
});

test('un fichero citado que no existe invalida el pack y se nombra el campo', () => {
  const pack = leer(VALIDO);
  pack.video = '/no/existe/pieza.mp4';
  const r = validarPack(pack, { existe: (p) => fs.existsSync(p) });
  assert.equal(r.ok, false);
  const error = r.errores.find((e) => e.campo === 'video');
  assert.ok(error, 'debe señalar el campo video');
  assert.match(error!.mensaje, /no existe/);
});

/* ───────────────────── capítulos: segundos reales o nada ───────────────────── */

test('los capítulos inventados se rechazan: no empiezan en 0', () => {
  const pack = leer(VALIDO);
  pack.capitulos = [
    { titulo: 'Uno', segundo: 5 },
    { titulo: 'Dos', segundo: 70 },
    { titulo: 'Tres', segundo: 140 },
  ];
  const r = validarPack(pack, { existe: () => true });
  assert.ok(campos(r.errores).includes('capitulos'));
  assert.match(r.errores.find((e) => e.campo === 'capitulos')!.mensaje, /empezar en 0:00/);
});

test('los capítulos desordenados o demasiado juntos se rechazan', () => {
  const pack = leer(VALIDO);
  pack.capitulos = [
    { titulo: 'Uno', segundo: 0 },
    { titulo: 'Dos', segundo: 120 },
    { titulo: 'Tres', segundo: 60 },
  ];
  const desorden = validarPack(pack, { existe: () => true });
  assert.match(desorden.errores.find((e) => e.campo === 'capitulos')!.mensaje, /orden creciente/);

  const juntos = validarPack(
    { ...pack, capitulos: [{ titulo: 'Uno', segundo: 0 }, { titulo: 'Dos', segundo: 5 }, { titulo: 'Tres', segundo: 40 }] },
    { existe: () => true },
  );
  assert.match(juntos.errores.find((e) => e.campo === 'capitulos')!.mensaje, /al menos 10 s/);
});

test('la marca de tiempo usa la notación de YouTube', () => {
  assert.equal(marcaTiempo(0), '0:00');
  assert.equal(marcaTiempo(65), '1:05');
  assert.equal(marcaTiempo(3723), '1:02:03');
});

/* ───────────────────── descripción de YouTube desde el pack ───────────────────── */

test('la descripción de YouTube solo repite los capítulos reales del pack', () => {
  const pack = leer(VALIDO);
  const descripcion = descripcionYouTube(pack);

  for (const cap of pack.capitulos!) assert.ok(descripcion.includes(`${marcaTiempo(cap.segundo)} ${cap.titulo}`), `falta "${cap.titulo}"`);

  // Ninguna marca de tiempo que no esté en el pack: nada de timestamps inventados.
  const marcas = descripcion.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g) ?? [];
  const reales = new Set(pack.capitulos!.map((c) => marcaTiempo(c.segundo)));
  for (const m of marcas) assert.ok(reales.has(m), `marca de tiempo inventada en la descripción: ${m}`);

  assert.ok(descripcion.includes(pack.resumen_editorial!), 'la descripción abre con el resumen del pack');
  assert.ok(descripcion.includes(pack.que_cubre![0]), 'incluye los puntos de qué cubre');
  assert.ok(descripcion.includes(pack.fuentes![0]), 'incluye las fuentes declaradas');
  assert.ok(descripcion.includes(pack.disclaimer!), 'cierra con el aviso del pack');
  assert.ok(descripcion.length <= 5000, 'cabe en el límite de YouTube');
});

test('sin capítulos en el pack, la descripción no inventa una sección de capítulos', () => {
  const pack = leer(VALIDO);
  delete pack.capitulos;
  const descripcion = descripcionYouTube(pack);
  assert.ok(!descripcion.includes('CAPÍTULOS'));
  assert.equal(descripcion.match(/\d+:\d{2}/g), null);
});

/* ───────────────────── ficha web desde el pack + YouTube ───────────────────── */

test('un vídeo programado genera ficha con información completa y sin publicar', () => {
  const pack = leer(VALIDO);
  const ficha = fichaDesdePack(
    pack,
    {
      youtubeId: 'AbCdEf12345',
      privacidad: 'private',
      publicadoEn: '2026-11-01T10:00:00Z',
      programadoPara: '2026-11-02T17:00:00Z',
      duracionISO: 'PT1M5S',
    },
    { hoy: '2026-10-27' },
  );

  assert.equal(ficha.id, 'vid-AbCdEf12345');
  assert.equal(ficha.slug, pack.slug);
  assert.equal(ficha.estado_youtube, 'programado');
  assert.equal(ficha.privacidad_api, 'private');
  assert.equal(ficha.status, 'revision', 'un vídeo privado no se publica en el sitio');
  assert.equal(ficha.publicado_en, '2026-11-02', 'la fecha es la programada, no la de subida');
  assert.deepEqual(ficha.capitulos, pack.capitulos);

  const informacion = ficha.informacion as Record<string, unknown>;
  assert.equal(informacion.estado, 'completo');
  assert.equal(informacion.origen, 'paquete-publicacion');
  assert.equal(informacion.resumen, pack.resumen_editorial);
  assert.deepEqual(informacion.que_cubre, pack.que_cubre);
  assert.deepEqual(informacion.faltan, []);
});

test('un vídeo ya público genera ficha publicada con su fecha real', () => {
  const pack = leer(VALIDO);
  const ficha = fichaDesdePack(
    pack,
    { youtubeId: 'AbCdEf12345', privacidad: 'public', publicadoEn: '2026-11-03T09:00:00Z', duracionISO: 'PT1M5S', vistas: 12 },
    { hoy: '2026-11-04' },
  );
  assert.equal(ficha.status, 'publicado');
  assert.equal(ficha.estado_youtube, 'publico');
  assert.equal(ficha.publicado_en, '2026-11-03');
  assert.equal(ficha.vistas_al_verificar, 12);
});

/* ───────────────────── CLI en seco: sin red, sin escrituras ───────────────────── */

const cli = (script: string, argv: string[]) =>
  spawnSync(process.execPath, [path.join(RAIZ, 'scripts', script), ...argv], { encoding: 'utf8', cwd: RAIZ });

test('pack-video.mjs en seco: pack incompleto sale con error y nombra el campo', () => {
  const r = cli('pack-video.mjs', ['--pack', INCOMPLETO]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /pack incompleto/);
  assert.match(r.stderr, /resumen_editorial/);
});

test('pack-video.mjs en seco: pack válido imprime la ficha esperada sin escribir nada', () => {
  const tmp = fs.mkdtempSync(path.join(RAIZ, 'qa', 'tmp-pack-'));
  try {
    const informe = path.join(tmp, 'informe.json');
    const r = cli('pack-video.mjs', ['--pack', VALIDO, '--youtube-id', 'AbCdEf12345', '--hoy', '2026-10-27', '--json', informe]);
    assert.equal(r.status, 0, r.stderr);

    const datos = JSON.parse(fs.readFileSync(informe, 'utf8'));
    assert.equal(datos.ok, true);
    assert.equal(datos.youtube_id, 'AbCdEf12345');
    assert.equal(datos.ficha.id, 'vid-AbCdEf12345');
    assert.equal(datos.ficha.informacion.estado, 'completo');
    assert.equal(datos.ficha.estado_youtube, 'programado');
    assert.equal(datos.ficha_escrita, null, 'sin --out-ficha no se escribe ninguna ficha');
    assert.ok(fs.readdirSync(path.join(RAIZ, 'src/content/videos')).every((f) => !f.includes('AbCdEf12345')));
    for (const cap of datos.ficha.capitulos) assert.ok(datos.descripcion.includes(`${marcaTiempo(cap.segundo)} ${cap.titulo}`));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('programar-video.mjs en seco no toca YouTube y escribe la ficha solo si se le pide', () => {
  const tmp = fs.mkdtempSync(path.join(RAIZ, 'qa', 'tmp-pack-'));
  try {
    const r = cli('programar-video.mjs', ['--pack', VALIDO, '--youtube-id', 'AbCdEf12345']);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /PLAN \(sin tocar YouTube\)/);
    assert.match(r.stdout, /sin --thumb/);
    assert.ok(!/UPLOADED/.test(r.stdout), 'en seco no se sube nada');

    const incompleto = cli('programar-video.mjs', ['--pack', INCOMPLETO]);
    assert.equal(incompleto.status, 1);
    assert.match(incompleto.stderr, /resumen_editorial/);
    assert.ok(fs.readdirSync(path.join(RAIZ, 'src/content/videos')).every((f) => !f.includes('AbCdEf12345')));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
