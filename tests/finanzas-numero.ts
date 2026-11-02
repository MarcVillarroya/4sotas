import test from 'node:test';
import assert from 'node:assert/strict';
import { formatearEuros, formatearPorcentaje, parsearNumero, redondearCentimos } from '../src/lib/finanzas/numero.ts';

/** Vectores de entrada calculados fuera del motor (docs/FINANZAS.md §6). */

test('parsearNumero: coma decimal es-ES, punto decimal, separador de millar y símbolos', () => {
  assert.equal(parsearNumero('5,25'), 5.25);
  assert.equal(parsearNumero('5.25'), 5.25);
  assert.equal(parsearNumero('1.234,56'), 1234.56);
  assert.equal(parsearNumero('1 000 €'), 1000);
  assert.equal(parsearNumero(' 7 % '), 7);
  assert.equal(parsearNumero('0'), 0);
  assert.equal(parsearNumero('-120'), -120);
});

test('parsearNumero: vacío, texto y no finitos devuelven NaN (nunca Infinity)', () => {
  assert.ok(Number.isNaN(parsearNumero('')));
  assert.ok(Number.isNaN(parsearNumero('   ')));
  assert.ok(Number.isNaN(parsearNumero('abc')));
  assert.ok(Number.isNaN(parsearNumero('€')));
  assert.ok(Number.isNaN(parsearNumero('Infinity')));
  assert.ok(Number.isNaN(parsearNumero('NaN')));
  assert.ok(Number.isNaN(parsearNumero('1,2,3')));
});

test('redondeo y formato al presentar', () => {
  assert.equal(redondearCentimos(297.0166666), 297.02);
  assert.equal(redondearCentimos(1.005), 1.01);
  // Intl es-ES separa con espacio duro (U+00A0): se normaliza para comparar.
  const normal = (texto: string): string => texto.replace(/\u00a0/g, ' ');
  assert.equal(normal(formatearEuros(843.2098)), '843,21 €');
  assert.equal(normal(formatearEuros(0)), '0,00 €');
  assert.equal(normal(formatearPorcentaje(0.2811)), '28,11 %');
  assert.equal(normal(formatearPorcentaje(0.076804, 4)), '7,6804 %');
});
