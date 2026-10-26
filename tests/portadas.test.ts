import test from 'node:test';
import assert from 'node:assert/strict';
import type { CollectionEntry } from 'astro:content';
import { seleccionarPortadas } from '../src/lib/portadas.ts';

// Fixtures sintéticas de pruebas, nunca contenido publicado.
const video = (id: string, fecha: string, status = 'publicado', publico = true) => ({ id, data: {
  status, publicado_en: new Date(fecha), estado_youtube: publico ? 'publico' : 'oculto',
  privacidad_api: publico ? 'public' : 'unlisted', temas: [{ id: 'tema-a' }],
} }) as CollectionEntry<'videos'>;
const guia = (id: string, destacado: boolean, status = 'publicado') => ({ id, data: {
  status, destacado, publicado: new Date('2026-01-01'), temas: [{ id: 'tema-a' }], glosario: [{ id: 'glo-a' }],
} }) as CollectionEntry<'articulos'>;
const tema = { id: 'tema-a', data: { status: 'publicado', orden: 1 } } as CollectionEntry<'temas'>;
const termino = { id: 'glo-a', data: { status: 'publicado', termino: 'Ahorro' } } as CollectionEntry<'glosario'>;

test('portadas: destacado y recientes siguen fechas y excluyen borradores/no públicos', () => {
  const lista = [video('viejo','2025-01-01'),video('nuevo','2026-01-01'),video('borrador','2027-01-01','borrador'),video('oculto','2028-01-01','publicado',false)];
  const result = seleccionarPortadas([], [], lista, [], []);
  assert.equal(result.destacado?.id, 'nuevo');
  assert.deepEqual(result.recientes.map(v => v.id), ['nuevo','viejo']);
  assert.equal(lista[0].id, 'viejo', 'no muta el inventario');
});

test('portadas: guías iniciales solo destacadas públicas, máximo tres', () => {
  const result = seleccionarPortadas([], [guia('a',true),guia('b',true),guia('c',true),guia('d',true),guia('e',false),guia('f',true,'revision')], [], [], []);
  assert.deepEqual(result.iniciales.map(g => g.id), ['a','b','c']);
});

test('portadas: recuentos cuentan entidades públicas, no referencias duplicadas', () => {
  const v = video('v','2026-01-01'); v.data.temas.push({ id: 'tema-a', collection: 'temas' });
  const result = seleccionarPortadas([tema], [guia('g',true),guia('borrador',true,'borrador')], [v], [], [termino]);
  assert.equal(result.mapa[0].guias, 1);
  assert.equal(result.mapa[0].videos, 1);
  assert.deepEqual(result.glosario.map(g => g.id), ['glo-a']);
});

test('portadas: vacío no inventa destacado, calculadora ni recomendaciones', () => {
  const result = seleccionarPortadas([], [], [], [], []);
  assert.equal(result.destacado, undefined);
  assert.equal(result.calculadora, undefined);
  assert.deepEqual(result.iniciales, []);
  assert.deepEqual(result.glosario, []);
});
