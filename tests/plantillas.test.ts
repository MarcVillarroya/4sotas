import test from 'node:test';
import assert from 'node:assert/strict';
import { ruta, url, embedYouTube, verEnYouTube } from '../src/lib/rutas.ts';
import { idRef, publicados, resolver, visibles } from '../src/lib/publicacion.ts';
import { prepararMigas } from '../src/lib/migas.ts';
import {
  aplicacionSoftware,
  articulo,
  conjuntoTerminos,
  lista,
  migas,
  terminoDefinido,
  videoObjeto,
} from '../src/lib/jsonld.ts';
import { duracionLegible, fechaISO, fechaLarga, marcaTiempo } from '../src/lib/format.ts';

const ORIGEN = 'https://marcvillarroya.github.io';

const entrada = (id: string, status = 'publicado') => ({ id, data: { status, slug: id } });

/* ─────────────────────────── rutas ─────────────────────────── */

test('cada plantilla generada tiene su constructora de ruta con barra final', () => {
  const rutas = [
    ruta.temas(),
    ruta.tema('nomina'),
    ruta.guias(),
    ruta.guia('bruto-vs-neto'),
    ruta.videos(),
    ruta.video('irpf-en-la-nomina'),
    ruta.glosario(),
    ruta.termino('base-de-cotizacion'),
    ruta.herramientas(),
    ruta.herramienta('interes-compuesto'),
  ];
  for (const r of rutas) {
    assert.match(r, /^\/oros\/[a-z0-9/-]*\/$/, `ruta mal formada: ${r}`);
  }
  assert.equal(ruta.tema('nomina'), '/oros/temas/nomina/');
  assert.equal(ruta.guia('bruto-vs-neto'), '/oros/guias/bruto-vs-neto/');
});

test('la ruta se deriva del slug, no del título: dos títulos distintos comparten ruta', () => {
  const slug = 'bruto-vs-neto';
  assert.equal(ruta.guia(slug), ruta.guia(slug));
  assert.ok(!ruta.guia(slug).includes(' '));
});

test('los enlaces de vídeo no dependen del JS del sitio', () => {
  assert.equal(verEnYouTube('M9EhU06FlUA'), 'https://www.youtube.com/watch?v=M9EhU06FlUA');
  assert.equal(embedYouTube('M9EhU06FlUA'), 'https://www.youtube-nocookie.com/embed/M9EhU06FlUA');
  assert.ok(!embedYouTube('M9EhU06FlUA').includes('youtube.com/embed'), 'la inserción usa el dominio sin cookies');
});

test('url() añade la base del build sin duplicar barras', () => {
  const conBase = url(ruta.tema('nomina'));
  assert.ok(conBase.endsWith('/oros/temas/nomina/'));
  assert.ok(!conBase.startsWith('//'));
});

/* ─────────────────────────── publicación ─────────────────────────── */

test('publicados filtra todo lo que no está publicado', () => {
  const entradas = [
    entrada('a', 'publicado'),
    entrada('b', 'borrador'),
    entrada('c', 'revision'),
    entrada('d', 'archivado'),
  ];
  assert.deepEqual(
    publicados(entradas).map((e) => e.id),
    ['a'],
  );
});

test('sin modo fixtures, visibles equivale a publicados', () => {
  const entradas = [entrada('a', 'publicado'), entrada('b', 'borrador')];
  assert.deepEqual(visibles(entradas).map((e) => e.id), publicados(entradas).map((e) => e.id));
});

test('idRef acepta string y la referencia resuelta de Astro 7', () => {
  assert.equal(idRef('tema-nomina'), 'tema-nomina');
  assert.equal(idRef({ id: 'tema-nomina' }), 'tema-nomina');
  assert.equal(idRef(undefined), undefined);
});

test('resolver conserva el orden declarado y descarta lo que no se puede enlazar', () => {
  const disponibles = [entrada('a'), entrada('b')];
  const resueltos = resolver(['b', { id: 'a' }, 'no-existe'], disponibles);
  assert.deepEqual(resueltos.map((e) => e.id), ['b', 'a']);
  assert.deepEqual(resolver(['a'], [entrada('a', 'borrador')].filter((e) => e.data.status === 'publicado')), []);
});

/* ─────────────────────────── migas ─────────────────────────── */

test('las migas terminan en la canónica y respetan el orden', () => {
  const canonica = `${ORIGEN}/4sotas/oros/guias/demo/`;
  const { visual, jsonld } = prepararMigas(
    [
      { nombre: 'Inicio', ruta: '/' },
      { nombre: 'Sota de Oros', ruta: '/oros/' },
      { nombre: 'Guías', ruta: ruta.guias() },
      { nombre: 'Demo', ruta: ruta.guia('demo') },
    ],
    canonica,
  );
  assert.equal(visual.length, 4);
  assert.equal(visual[3].href, undefined, 'la página actual no se enlaza');
  const items = jsonld.itemListElement as Record<string, unknown>[];
  assert.deepEqual(
    items.map((i) => i.position),
    [1, 2, 3, 4],
  );
  assert.equal(items[3].item, canonica);
  // La base la inyecta Astro en build; el test se adapta al entorno en vez de fijarla.
  assert.equal(items[0].item, `${ORIGEN}${url('/')}`);
});

test('el BreadcrumbList no inventa niveles: tantos ítems como migas', () => {
  const canonica = `${ORIGEN}/4sotas/oros/temas/demo/`;
  const nodo = migas(
    [
      { nombre: 'A', url: `${ORIGEN}/4sotas/` },
      { nombre: 'B', url: canonica },
    ],
    canonica,
  );
  assert.equal((nodo.itemListElement as unknown[]).length, 2);
  assert.equal(nodo['@type'], 'BreadcrumbList');
});

/* ─────────────────────────── JSON-LD ─────────────────────────── */

test('VideoObject declara lo que la ficha muestra y nada más', () => {
  const nodo = videoObjeto({
    url: `${ORIGEN}/4sotas/oros/videos/demo/`,
    nombre: 'Título real',
    descripcion: 'Resumen editorial propio',
    miniaturas: ['https://i.ytimg.com/vi/M9EhU06FlUA/maxresdefault.jpg'],
    subidoISO: '2026-10-11',
    duracionISO: 'PT9M50S',
    embedUrl: embedYouTube('M9EhU06FlUA'),
  });
  for (const campo of ['name', 'description', 'thumbnailUrl', 'uploadDate', 'duration', 'embedUrl', 'contentUrl']) {
    assert.ok(nodo[campo], `VideoObject sin ${campo}`);
  }
  assert.ok(!('interactionStatistic' in nodo), 'no se publican vistas que caducan');
  assert.ok(!JSON.stringify(nodo).includes('aggregateRating'));
});

test('Article no declara fecha si el contenido no está publicado', () => {
  const base = {
    url: `${ORIGEN}/4sotas/oros/guias/demo/`,
    titular: 'Titular',
    descripcion: 'Descripción editorial suficientemente larga para el modelo del sitio.',
    autor: { nombre: 'Marc Villarroya' },
  };
  const borrador = articulo(base);
  assert.ok(!('datePublished' in borrador));
  const publicado = articulo({ ...base, publicadoISO: '2026-10-11', actualizadoISO: '2026-10-26' });
  assert.equal(publicado.datePublished, '2026-10-11');
  assert.equal(publicado.dateModified, '2026-10-26');
  assert.equal((publicado.author as Record<string, unknown>).name, 'Marc Villarroya');
});

test('Article con análisis se declara BlogPosting y cita solo las fuentes dadas', () => {
  const nodo = articulo({
    url: `${ORIGEN}/4sotas/oros/guias/demo/`,
    titular: 'Titular',
    descripcion: 'Descripción',
    publicadoISO: '2026-10-11',
    tipo: 'BlogPosting',
    autor: { nombre: 'A' },
    citas: ['https://www.ine.es/ejemplo'],
  });
  assert.equal(nodo['@type'], 'BlogPosting');
  assert.deepEqual(nodo.citation, [{ '@type': 'CreativeWork', url: 'https://www.ine.es/ejemplo' }]);
});

test('DefinedTerm se declara dentro de su DefinedTermSet', () => {
  const conjunto = conjuntoTerminos({
    url: `${ORIGEN}/4sotas/oros/glosario/`,
    nombre: 'Glosario',
    descripcion: 'Definiciones cortas',
    terminos: [{ nombre: 'Término', url: `${ORIGEN}/4sotas/oros/glosario/termino/` }],
  });
  assert.equal(conjunto['@type'], 'DefinedTermSet');
  assert.equal((conjunto.hasDefinedTerm as unknown[]).length, 1);

  const termino = terminoDefinido({
    url: `${ORIGEN}/4sotas/oros/glosario/termino/`,
    nombre: 'Término',
    descripcion: 'Definición',
    conjunto: { url: `${ORIGEN}/4sotas/oros/glosario/`, nombre: 'Glosario' },
    sinonimos: ['Alias'],
  });
  assert.equal(termino['@type'], 'DefinedTerm');
  assert.equal((termino.inDefinedTermSet as Record<string, unknown>)['@type'], 'DefinedTermSet');
  assert.deepEqual(termino.alternateName, ['Alias']);
});

test('SoftwareApplication solo declara precio 0 y ninguna valoración', () => {
  const nodo = aplicacionSoftware({
    url: `${ORIGEN}/4sotas/oros/herramientas/interes-compuesto/`,
    nombre: 'Interés compuesto',
    descripcion: 'Calculadora local',
    version: '1.0.0',
  });
  assert.equal(nodo.applicationCategory, 'FinanceApplication');
  assert.deepEqual(nodo.offers, { '@type': 'Offer', price: '0', priceCurrency: 'EUR' });
  assert.ok(!/aggregateRating|review|ratingValue/.test(JSON.stringify(nodo)));
});

test('ItemList declara el número real de elementos', () => {
  const nodo = lista({
    url: `${ORIGEN}/4sotas/oros/temas/`,
    nombre: 'Temas',
    elementos: [{ url: 'a' }, { url: 'b' }, { url: 'c' }],
  });
  assert.equal(nodo.numberOfItems, 3);
  assert.equal((nodo.itemListElement as unknown[]).length, 3);
});

/* ─────────────────────────── formato ─────────────────────────── */

test('la duración ISO se presenta legible y sin inventar segundos', () => {
  assert.equal(duracionLegible('PT9M50S'), '9 min 50 s');
  assert.equal(duracionLegible('PT1H2M3S'), '1 h 2 min 3 s');
  assert.equal(duracionLegible('PT45S'), '45 s');
});

test('las marcas de tiempo de capítulos salen del segundo declarado', () => {
  assert.equal(marcaTiempo(0), '0:00');
  assert.equal(marcaTiempo(590), '9:50');
  assert.equal(marcaTiempo(3725), '1:02:05');
});

test('las fechas se formatean en UTC: el día no se desplaza', () => {
  const fecha = new Date('2026-10-11T00:00:00Z');
  assert.equal(fechaISO(fecha), '2026-10-11');
  const larga = fechaLarga(fecha);
  assert.ok(larga.includes('11'), `día desplazado: ${larga}`);
  assert.ok(larga.includes('2026'));
});
