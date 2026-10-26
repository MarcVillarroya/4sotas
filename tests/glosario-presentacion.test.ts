/**
 * Etiquetas del glosario: ninguna categoría publicada puede salir como slug crudo.
 * El fallo detectado en QA V2-H fue «Categoría: inflacion» (sin tilde, en minúsculas)
 * en el índice y en las fichas de término.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CATEGORIAS_GLOSARIO, etiquetaCategoria } from '../src/lib/glosario-presentacion.ts';

const dir = join(import.meta.dirname, '..', 'src', 'content', 'glosario');

const categoriasPublicadas = async () => {
  const ficheros = (await readdir(dir)).filter((f) => f.endsWith('.md') && !f.includes('fixture'));
  const salida = [];
  for (const f of ficheros) {
    const md = await readFile(join(dir, f), 'utf8');
    if (/^status:\s*publicado/m.test(md) === false) continue;
    const m = /^categoria:\s*(\S+)/m.exec(md);
    if (m) salida.push({ fichero: f, categoria: m[1] });
  }
  return salida;
};

test('toda categoría publicada tiene etiqueta con mayúscula inicial y sin guiones', async () => {
  const lista = await categoriasPublicadas();
  assert.ok(lista.length > 0, 'sin términos publicados que comprobar');
  for (const { fichero, categoria } of lista) {
    const etiqueta = etiquetaCategoria(categoria);
    assert.notEqual(etiqueta, categoria, `${fichero}: la categoría ${categoria} sale como slug crudo`);
    assert.match(etiqueta, /^[A-ZÁÉÍÓÚÑ]/, `${fichero}: «${etiqueta}» no empieza en mayúscula`);
    assert.doesNotMatch(etiqueta, /-/, `${fichero}: «${etiqueta}» conserva guiones`);
  }
});

test('las etiquetas cubren el catálogo conocido y no inventan categorías vacías', () => {
  assert.deepEqual([...CATEGORIAS_GLOSARIO].sort(), ['ahorro', 'banca', 'fiscal', 'inflacion', 'inversion', 'nomina', 'vivienda']);
  assert.equal(etiquetaCategoria('nomina'), 'Nómina');
  assert.equal(etiquetaCategoria('inflacion'), 'Inflación');
  assert.equal(etiquetaCategoria('desconocida'), 'desconocida', 'una categoría nueva no rompe la página');
});
