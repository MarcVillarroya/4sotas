import test from 'node:test';
import assert from 'node:assert/strict';
import { cuadroFrances, cuotaFrancesa } from '../src/lib/finanzas/amortizacion.ts';
import { redondearCentimos as r2 } from '../src/lib/finanzas/numero.ts';

/**
 * Vectores calculados fuera del motor con Python `Decimal` (50 dígitos)
 * y fijados en docs/FINANZAS.md §6. No se copian salidas de TypeScript.
 */

const CASOS = [
  { nombre: 'H1 · hipoteca 200.000 al 3 % a 30 años', principal: 200000, tin: 3, meses: 360, cuota: 843.21, total: 303554.9, intereses: 103554.9 },
  { nombre: 'H2 · hipoteca 240.000 al 3 % a 30 años', principal: 240000, tin: 3, meses: 360, cuota: 1011.85, total: 364265.89, intereses: 124265.89 },
  { nombre: 'H3 · hipoteca 250.000 al 3,5 % a 30 años', principal: 250000, tin: 3.5, meses: 360, cuota: 1122.61, total: 404140.22, intereses: 154140.22 },
  { nombre: 'P1 · préstamo 15.000 al 7 % a 60 meses', principal: 15000, tin: 7, meses: 60, cuota: 297.02, total: 17821.08, intereses: 2821.08 },
  { nombre: 'P2 · préstamo 12.000 al 0 % a 12 meses', principal: 12000, tin: 0, meses: 12, cuota: 1000, total: 12000, intereses: 0 },
];

for (const caso of CASOS) {
  test(`cuota francesa · ${caso.nombre}`, () => {
    assert.equal(r2(cuotaFrancesa(caso.principal, caso.tin, caso.meses)), caso.cuota);
    const cuadro = cuadroFrances(caso.principal, caso.tin, caso.meses);
    assert.equal(r2(cuadro.total), caso.total);
    assert.equal(r2(cuadro.intereses), caso.intereses);
  });
}

test('tabla anual: cierra a cero, agrupa por años y suma la última cuota parcial', () => {
  const cuadro = cuadroFrances(15000, 7, 60);
  assert.equal(cuadro.tabla.length, 5);
  assert.equal(cuadro.tabla.at(-1)!.pendiente, 0);
  assert.equal(cuadro.tabla.reduce((suma, fila) => suma + fila.cuotas, 0), 60);
  assert.equal(r2(cuadro.tabla[0]!.intereses), 967.75);
  assert.equal(r2(cuadro.tabla.at(-1)!.intereses), 131.54);
  const parcial = cuadroFrances(15000, 7, 18).tabla;
  assert.equal(parcial.length, 2);
  assert.equal(parcial[1]!.cuotas, 6);
});

test('tabla anual: los intereses de la tabla cuadran con el total del cuadro (sin redondear)', () => {
  for (const caso of CASOS) {
    const cuadro = cuadroFrances(caso.principal, caso.tin, caso.meses);
    const suma = cuadro.tabla.reduce((total, fila) => total + fila.intereses, 0);
    assert.ok(Math.abs(suma - cuadro.intereses) < 0.01, `${caso.nombre}: ${suma} vs ${cuadro.intereses}`);
  }
});

test('casos de borde: un solo mes, TIN 0 y plazo máximo', () => {
  assert.equal(r2(cuotaFrancesa(200000, 3, 1)), 200500);
  assert.equal(cuotaFrancesa(12000, 0, 1), 12000);
  const largo = cuadroFrances(1500000, 10, 480);
  assert.equal(largo.tabla.length, 40);
  assert.equal(largo.tabla.at(-1)!.pendiente, 0);
});

test('cuotaFrancesa rechaza plazos no enteros, cero o no finitos', () => {
  assert.throws(() => cuotaFrancesa(1000, 3, 0));
  assert.throws(() => cuotaFrancesa(1000, 3, 12.5));
  assert.throws(() => cuotaFrancesa(Number.NaN, 3, 12));
  assert.throws(() => cuotaFrancesa(1000, Number.POSITIVE_INFINITY, 12));
});
