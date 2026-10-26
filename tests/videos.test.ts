import test from 'node:test';
import assert from 'node:assert/strict';
import { embedYouTube, verEnYouTube } from '../src/lib/rutas.ts';
import { videoObjeto } from '../src/lib/jsonld.ts';
import {
  SEGUNDOS_SHORT,
  duracionReloj,
  esShort,
  formato,
  miniatura320,
  segundosDeDuracion,
  srcsetMiniatura,
} from '../src/lib/videos.ts';

/* ─────────────────────── duración real → segmento editorial ─────────────────────── */

test('la duración ISO se convierte a segundos sin inventar valores', () => {
  assert.equal(segundosDeDuracion('PT53S'), 53);
  assert.equal(segundosDeDuracion('PT1M'), 60);
  assert.equal(segundosDeDuracion('PT1M5S'), 65);
  assert.equal(segundosDeDuracion('PT9M50S'), 590);
  assert.equal(segundosDeDuracion('PT13M33S'), 813);
  assert.equal(segundosDeDuracion('PT1H2M3S'), 3723);
  assert.equal(segundosDeDuracion('no-es-iso'), 0);
});

test('Short es 60 s o menos y Largo es más de 60 s, con el umbral declarado', () => {
  assert.equal(SEGUNDOS_SHORT, 60);
  assert.equal(esShort('PT53S'), true);
  assert.equal(esShort('PT59S'), true);
  assert.equal(esShort('PT1M'), true, 'un minuto exacto sigue siendo Short');
  assert.equal(esShort('PT1M1S'), false);
  assert.equal(esShort('PT13M33S'), false);
  assert.equal(formato('PT1M'), 'Short');
  assert.equal(formato('PT1M5S'), 'Largo');
});

test('el rótulo de duración es un reloj, no una promesa de formato de YouTube', () => {
  assert.equal(duracionReloj('PT53S'), '0:53');
  assert.equal(duracionReloj('PT9M50S'), '9:50');
  assert.equal(duracionReloj('PT1H2M3S'), '1:02:03');
  assert.equal(duracionReloj('PT0S'), '0:00');
});

/* ─────────────────────── miniaturas locales ─────────────────────── */

test('la variante de 320 se deriva del nombre del archivo de 640', () => {
  assert.equal(miniatura320('/assets/videos/M9EhU06FlUA.webp'), '/assets/videos/M9EhU06FlUA-320.webp');
  assert.equal(miniatura320('/assets/videos/otro.png'), '/assets/videos/otro.png', 'sin .webp no se inventa una ruta');
});

test('el srcset declara las dos variantes reales con su ancho', () => {
  assert.equal(
    srcsetMiniatura('/assets/videos/M9EhU06FlUA.webp'),
    '/assets/videos/M9EhU06FlUA-320.webp 320w, /assets/videos/M9EhU06FlUA.webp 640w',
  );
});

/* ─────────────────────── VideoObject de vídeo ─────────────────────── */

test('VideoObject de una ficha declara YouTube como contenido y la miniatura absoluta', () => {
  const nodo = videoObjeto({
    url: 'https://marcvillarroya.github.io/4sotas/oros/videos/como-leer-una-nomina/',
    nombre: 'Cómo leer una nómina',
    descripcion: 'Resumen editorial',
    miniaturas: ['https://marcvillarroya.github.io/4sotas/assets/videos/M9EhU06FlUA.webp'],
    subidoISO: '2026-10-11',
    duracionISO: 'PT9M50S',
    embedUrl: embedYouTube('M9EhU06FlUA'),
    contentUrl: verEnYouTube('M9EhU06FlUA'),
    revisadoISO: '2026-10-26',
  });
  assert.equal(nodo.contentUrl, 'https://www.youtube.com/watch?v=M9EhU06FlUA');
  assert.equal(nodo.embedUrl, 'https://www.youtube-nocookie.com/embed/M9EhU06FlUA');
  assert.equal(nodo.dateModified, '2026-10-26');
  assert.ok((nodo.thumbnailUrl as string[]).every((u) => u.startsWith('https://')));
  assert.equal(nodo.url, 'https://marcvillarroya.github.io/4sotas/oros/videos/como-leer-una-nomina/');
});

test('sin contentUrl explícito, VideoObject no inventa una plataforma externa', () => {
  const nodo = videoObjeto({
    url: 'https://marcvillarroya.github.io/4sotas/oros/videos/demo/',
    nombre: 'Demo',
    descripcion: 'Demo',
    miniaturas: ['https://marcvillarroya.github.io/4sotas/assets/videos/demo.webp'],
    subidoISO: '2026-10-11',
    duracionISO: 'PT1M',
    embedUrl: embedYouTube('M9EhU06FlUA'),
  });
  assert.equal(nodo.contentUrl, nodo.url);
  assert.ok(!('dateModified' in nodo), 'sin fecha de revisión no se declara dateModified');
});
