/**
 * Catálogos JSON derivados: la única propiedad que importa es que un catálogo no pueda
 * contener lo que el HTML no publica. Se prueba la lógica pura con entradas sintéticas,
 * porque el build público puede estar legítimamente vacío y un catálogo vacío no demuestra nada.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SCHEMA_VERSION,
  catalogoArticulos,
  catalogoHerramientas,
  catalogoTemas,
  catalogoVideos,
} from '../src/lib/catalogos.ts';

const GEN = '2026-10-26T00:00:00.000Z';
const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

/* eslint-disable @typescript-eslint/no-explicit-any */
const entrada = (id: string, status: string, data: Record<string, unknown> = {}): any => ({
  id,
  data: { id, status, slug: id.replace(/^(art|tema|vid|herr)-/, ''), ...data },
});

test('cabecera del catálogo: schema_version semver, generated_at ISO y universo', () => {
  const c = catalogoArticulos([], GEN);
  assert.equal(c.schema_version, SCHEMA_VERSION);
  assert.match(c.schema_version, /^\d+\.\d+\.\d+$/);
  assert.equal(c.generated_at, GEN);
  assert.equal(c.universo, 'oros');
  assert.deepEqual(c.items, []);
});

test('artículos: entra el publicado y no el de revisión ni el archivo', () => {
  const items = [
    entrada('art-publicado', 'publicado', {
      titulo: 'Título',
      resumen: 'Resumen',
      publicado: d('2026-10-01'),
      temas: [{ id: 'tema-nomina' }],
      nivel: 'basico',
      tipo: 'guia',
    }),
    entrada('art-revision', 'revision'),
    entrada('art-archivado', 'archivado'),
  ];
  const c = catalogoArticulos(items, GEN);
  assert.equal(c.items.length, 1);
  assert.equal(c.items[0].id, 'art-publicado');
  assert.deepEqual(c.items[0].temas, ['tema-nomina']);
  assert.equal(c.items[0].publicado, '2026-10-01');
  assert.equal(c.items[0].actualizado, '2026-10-01');
});

test('vídeos: exige ficha publicada y estado real público en la API', () => {
  const base = {
    youtube_id: 'M9EhU06FlUA',
    titulo: 'Vídeo',
    descripcion_corta: 'Descripción',
    publicado_en: d('2026-10-11'),
    duracion_iso: 'PT9M50S',
    miniatura: 'https://i.ytimg.com/vi/M9EhU06FlUA/maxresdefault.jpg',
    temas: [{ id: 'tema-nomina' }],
    verificado_en: d('2026-10-26'),
  };
  const items = [
    entrada('vid-publico', 'publicado', { ...base, estado_youtube: 'publico', privacidad_api: 'public' }),
    entrada('vid-privado', 'publicado', { ...base, estado_youtube: 'programado', privacidad_api: 'private' }),
    entrada('vid-revision', 'revision', { ...base, estado_youtube: 'publico', privacidad_api: 'public' }),
    entrada('vid-oculto', 'publicado', { ...base, estado_youtube: 'oculto', privacidad_api: 'unlisted' }),
  ];
  const c = catalogoVideos(items, GEN);
  assert.deepEqual(
    c.items.map((i) => i.id),
    ['vid-publico'],
  );
  assert.equal(c.items[0].estado_youtube, 'publico');
  assert.equal(c.items[0].verificado_en, '2026-10-26');
});

test('vídeos: se ordenan del más reciente al más antiguo', () => {
  const base = {
    titulo: 'Vídeo',
    descripcion_corta: 'Descripción',
    duracion_iso: 'PT1M',
    miniatura: 'https://i.ytimg.com/vi/x/maxresdefault.jpg',
    temas: [],
    verificado_en: d('2026-10-26'),
    estado_youtube: 'publico',
    privacidad_api: 'public',
    youtube_id: 'aaaaaaaaaaa',
  };
  const c = catalogoVideos(
    [
      entrada('vid-viejo', 'publicado', { ...base, publicado_en: d('2026-10-01') }),
      entrada('vid-nuevo', 'publicado', { ...base, publicado_en: d('2026-10-20') }),
    ],
    GEN,
  );
  assert.deepEqual(
    c.items.map((i) => i.id),
    ['vid-nuevo', 'vid-viejo'],
  );
});

test('herramientas: no entra la anunciada sin implementar, sí la beta publicada', () => {
  const items = [
    entrada('herr-beta', 'publicado', {
      titulo: 'Calculadora',
      descripcion: 'Descripción',
      estado_implementacion: 'beta',
      version_motor: '1.0.0',
      unidad_salida: 'EUR',
      temas: [],
    }),
    entrada('herr-anunciada', 'publicado', {
      titulo: 'Futura',
      descripcion: 'Descripción',
      estado_implementacion: 'no-implementada',
      version_motor: '0.1.0',
      unidad_salida: 'EUR',
      temas: [],
    }),
    entrada('herr-revision', 'revision', {
      titulo: 'Otra',
      descripcion: 'Descripción',
      estado_implementacion: 'estable',
      version_motor: '1.0.0',
      unidad_salida: 'EUR',
      temas: [],
    }),
  ];
  const c = catalogoHerramientas(items, GEN);
  assert.deepEqual(
    c.items.map((i) => i.id),
    ['herr-beta'],
  );
});

test('temas: la url del catálogo sale de la ruta tipada, no del título', () => {
  const c = catalogoTemas(
    [
      entrada('tema-nomina', 'publicado', {
        titulo: 'Nómina',
        descripcion_corta: 'Corta',
        cluster: 'nomina',
        orden: 1,
        slug: 'nomina',
        pilar: { id: 'art-bruto-a-neto' },
      }),
    ],
    GEN,
  );
  assert.equal(c.items[0].url, '/oros/temas/nomina/');
  assert.equal(c.items[0].pilar, 'art-bruto-a-neto');
});

test('ningún catálogo publica borradores aunque la colección esté llena', () => {
  const borrador = (id: string): any => entrada(id, 'revision');
  for (const catalogo of [
    catalogoArticulos([borrador('art-x')], GEN),
    catalogoTemas([borrador('tema-x')], GEN),
    catalogoVideos([borrador('vid-x')], GEN),
    catalogoHerramientas([borrador('herr-x')], GEN),
  ]) {
    assert.deepEqual(catalogo.items, []);
  }
});
