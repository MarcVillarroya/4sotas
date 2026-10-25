import test from 'node:test';
import assert from 'node:assert/strict';
import { grafoInicio, grafoSeccion, organizacion, paginaWeb, sitioWeb } from '../src/lib/jsonld.ts';

const ORIGEN = 'https://marcvillarroya.github.io';
const plano = (nodo: Record<string, unknown>): string => JSON.stringify(nodo);

test('el grafo de portada es JSON-LD válido con contexto', () => {
  const g = grafoInicio({ origen: ORIGEN, url: `${ORIGEN}/4sotas/`, nombre: 'Inicio', descripcion: 'd' });
  assert.equal(g['@context'], 'https://schema.org');
  assert.ok(Array.isArray(g['@graph']));
  const tipos = (g['@graph'] as Record<string, unknown>[]).map((n) => n['@type']);
  assert.deepEqual(tipos, ['Organization', 'WebSite', 'WebPage']);
});

test('ningún nodo contiene ratings, reviews ni precios inventados', () => {
  const nodos = [
    organizacion(ORIGEN),
    sitioWeb(ORIGEN),
    paginaWeb({ url: `${ORIGEN}/4sotas/`, nombre: 'n', descripcion: 'd' }),
    grafoInicio({ origen: ORIGEN, url: `${ORIGEN}/4sotas/`, nombre: 'n', descripcion: 'd' }),
    grafoSeccion({ origen: ORIGEN, url: `${ORIGEN}/4sotas/oros/`, nombre: 'n', descripcion: 'd' }),
  ];
  for (const nodo of nodos) {
    const texto = plano(nodo);
    assert.ok(!/aggregateRating|ratingValue|reviewCount|"review"|"offers"/.test(texto), `nodo con datos inventados: ${texto}`);
  }
});

test('no se nombra el dominio no registrado', () => {
  const texto = plano(grafoInicio({ origen: ORIGEN, url: `${ORIGEN}/4sotas/`, nombre: 'n', descripcion: 'd' }));
  assert.ok(!texto.includes('4sotas.com'));
});

test('sameAs apunta solo al canal real de YouTube', () => {
  const sameAs = organizacion(ORIGEN)['sameAs'] as string[];
  assert.equal(sameAs.length, 1);
  assert.match(sameAs[0] as string, /^https:\/\/www\.youtube\.com\/channel\/UC[\w-]{22}$/);
});
