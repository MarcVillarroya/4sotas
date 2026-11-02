import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularHipoteca } from '../src/lib/finanzas/hipoteca.ts';
import { parsearNumero, redondearCentimos as r2 } from '../src/lib/finanzas/numero.ts';

/** Vectores independientes (Python Decimal, docs/FINANZAS.md §6). */

const ok = (r: ReturnType<typeof calcularHipoteca>) => {
  assert.equal(r.ok, true, r.ok ? '' : r.errores.map((e) => `${e.campo}: ${e.mensaje}`).join(' · '));
  if (!r.ok) throw new Error('sin resultado');
  return r.resultado;
};

test('H1 · 250.000 € de precio con 50.000 € de entrada al 3 % a 30 años', () => {
  const r = ok(calcularHipoteca({ precio: 250000, entrada: 50000, plazoAnios: 30, tinAnual: 3 }));
  assert.equal(r.importe, 200000);
  assert.equal(r.meses, 360);
  assert.equal(r2(r.cuota), 843.21);
  assert.equal(r2(r.total), 303554.9);
  assert.equal(r2(r.intereses), 103554.9);
  assert.equal(r2(r.ltv * 100), 80);
  assert.equal(r.tabla.length, 30);
});

test('H2 · 300.000 € de precio con 60.000 € de entrada al 3 % a 30 años', () => {
  const r = ok(calcularHipoteca({ precio: 300000, entrada: 60000, plazoAnios: 30, tinAnual: 3 }));
  assert.equal(r.importe, 240000);
  assert.equal(r2(r.cuota), 1011.85);
  assert.equal(r2(r.total), 364265.89);
});

test('H3 · 300.000 € de precio con 50.000 € de entrada al 3,5 % a 30 años', () => {
  const r = ok(calcularHipoteca({ precio: 300000, entrada: 50000, plazoAnios: 30, tinAnual: 3.5 }));
  assert.equal(r.importe, 250000);
  assert.equal(r2(r.cuota), 1122.61);
  assert.equal(r2(r.total), 404140.22);
});

test('casos de borde: entrada 0, TIN 0, plazo mínimo y plazo máximo', () => {
  const sinEntrada = ok(calcularHipoteca({ precio: 250000, entrada: 0, plazoAnios: 30, tinAnual: 3 }));
  assert.equal(r2(sinEntrada.ltv * 100), 100);
  const cero = ok(calcularHipoteca({ precio: 120000, entrada: 20000, plazoAnios: 5, tinAnual: 0 }));
  assert.equal(r2(cero.cuota), 1666.67);
  assert.equal(r2(cero.intereses), 0);
  const maximo = ok(calcularHipoteca({ precio: 1500000, entrada: 100000, plazoAnios: 40, tinAnual: 10 }));
  assert.equal(maximo.tabla.length, 40);
  assert.equal(maximo.tabla.at(-1)!.pendiente, 0);
});

test('validación: entrada igual o mayor que el precio, NaN, Infinity y plazos no enteros', () => {
  const casos: [Record<string, number>, string][] = [
    [{ precio: 250000, entrada: 250000, plazoAnios: 30, tinAnual: 3 }, 'entrada'],
    [{ precio: 250000, entrada: 300000, plazoAnios: 30, tinAnual: 3 }, 'entrada'],
    [{ precio: 250000, entrada: -1, plazoAnios: 30, tinAnual: 3 }, 'entrada'],
    [{ precio: 1000, entrada: 0, plazoAnios: 30, tinAnual: 3 }, 'precio'],
    [{ precio: Number.POSITIVE_INFINITY, entrada: 0, plazoAnios: 30, tinAnual: 3 }, 'precio'],
    [{ precio: parsearNumero(''), entrada: 0, plazoAnios: 30, tinAnual: 3 }, 'precio'],
    [{ precio: 250000, entrada: 50000, plazoAnios: 4, tinAnual: 3 }, 'plazoAnios'],
    [{ precio: 250000, entrada: 50000, plazoAnios: 30.5, tinAnual: 3 }, 'plazoAnios'],
    [{ precio: 250000, entrada: 50000, plazoAnios: 30, tinAnual: 11 }, 'tinAnual'],
    [{ precio: 250000, entrada: 50000, plazoAnios: 30, tinAnual: Number.NaN }, 'tinAnual'],
  ];
  for (const [entrada, campo] of casos) {
    const r = calcularHipoteca(entrada as { precio: number; entrada: number; plazoAnios: number; tinAnual: number });
    assert.equal(r.ok, false, `debería fallar: ${JSON.stringify(entrada)}`);
    if (!r.ok) assert.ok(r.errores.some((e) => e.campo === campo), `falta el error de ${campo}`);
  }
});
