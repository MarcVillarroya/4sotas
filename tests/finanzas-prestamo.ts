import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularPrestamo, formatearTae, taeDesdeFlujo } from '../src/lib/finanzas/prestamo.ts';
import { parsearNumero, redondearCentimos as r2 } from '../src/lib/finanzas/numero.ts';

/**
 * Vectores independientes (Python Decimal, docs/FINANZAS.md §6):
 *  P1 15.000 al 7 % a 60 meses → cuota 297,02 €, total 17.821,08 €, intereses 2.821,08 €.
 *  P2 12.000 al 0 % a 12 meses → cuota 1.000,00 €, intereses 0,00 €.
 *  P3 el mismo P1 con comisión del 1 % → TAE 7,6804 % (TIN 7,00 %).
 */

const ok = (r: ReturnType<typeof calcularPrestamo>) => {
  assert.equal(r.ok, true, r.ok ? '' : r.errores.map((e) => `${e.campo}: ${e.mensaje}`).join(' · '));
  if (!r.ok) throw new Error('sin resultado');
  return r.resultado;
};

test('P1 · préstamo 15.000 al 7 % a 60 meses', () => {
  const r = ok(calcularPrestamo({ importe: 15000, meses: 60, tinAnual: 7, comisionPct: 0 }));
  assert.equal(r2(r.cuota), 297.02);
  assert.equal(r2(r.total), 17821.08);
  assert.equal(r2(r.intereses), 2821.08);
  assert.equal(r.comision, 0);
  assert.equal(r.principalNeto, 15000);
  assert.equal(r.tabla.length, 5);
});

test('P2 · préstamo 12.000 al 0 % a 12 meses: cuota 1.000 y cero intereses', () => {
  const r = ok(calcularPrestamo({ importe: 12000, meses: 12, tinAnual: 0, comisionPct: 0 }));
  assert.equal(r2(r.cuota), 1000);
  assert.equal(r2(r.intereses), 0);
  assert.equal(r2(r.total), 12000);
});

test('P3 · comisión del 1 %: el capital neto baja y la TAE supera al TIN', () => {
  const r = ok(calcularPrestamo({ importe: 15000, meses: 60, tinAnual: 7, comisionPct: 1 }));
  assert.equal(r2(r.comision), 150);
  assert.equal(r2(r.principalNeto), 14850);
  assert.equal(r2(r.cuota), 297.02, 'la cuota se calcula sobre el importe, no sobre el neto');
  assert.ok(r.tae !== null);
  assert.equal(r2(r.tae! * 100), 7.68);
  assert.ok(r.tae! * 100 > 7, 'con comisión la TAE es mayor que el TIN');
  assert.equal(formatearTae(r.tae), '7,68 %');
});

test('TAE sin comisión es efectiva anual, no el TIN nominal', () => {
  const r = ok(calcularPrestamo({ importe: 15000, meses: 60, tinAnual: 7, comisionPct: 0 }));
  assert.equal(r2(r.tae! * 100), 7.23);
  assert.notEqual(r2(r.tae! * 100), 7, 'el TIN no se presenta como TAE');
});

test('TAE: flujo degenerado devuelve null, no un número inventado', () => {
  assert.equal(taeDesdeFlujo(0, 100, 12), null);
  assert.equal(taeDesdeFlujo(1000, 0, 12), null);
  assert.equal(taeDesdeFlujo(1000, 50, 12), null, 'las cuotas no devuelven el principal');
  assert.equal(formatearTae(null), 'No calculable');
});

test('casos de borde: plazo mínimo, plazo máximo y TIN 0 con comisión', () => {
  const minimo = ok(calcularPrestamo({ importe: 300, meses: 3, tinAnual: 0, comisionPct: 0 }));
  assert.equal(r2(minimo.cuota), 100);
  const maximo = ok(calcularPrestamo({ importe: 200000, meses: 120, tinAnual: 30, comisionPct: 10 }));
  assert.equal(maximo.tabla.length, 10);
  assert.equal(maximo.tabla.at(-1)!.pendiente, 0);
  const sinInteres = ok(calcularPrestamo({ importe: 10000, meses: 60, tinAnual: 0, comisionPct: 2 }));
  assert.equal(r2(sinInteres.principalNeto), 9800);
  assert.ok(sinInteres.tae! > 0);
});

test('validación: negativos, NaN, Infinity, plazos no enteros y vacíos devuelven errores por campo', () => {
  const casos: [Record<string, number>, string][] = [
    [{ importe: -1, meses: 60, tinAnual: 7, comisionPct: 0 }, 'importe'],
    [{ importe: parsearNumero(''), meses: 60, tinAnual: 7, comisionPct: 0 }, 'importe'],
    [{ importe: Number.POSITIVE_INFINITY, meses: 60, tinAnual: 7, comisionPct: 0 }, 'importe'],
    [{ importe: 15000, meses: 0, tinAnual: 7, comisionPct: 0 }, 'meses'],
    [{ importe: 15000, meses: 12.5, tinAnual: 7, comisionPct: 0 }, 'meses'],
    [{ importe: 15000, meses: 60, tinAnual: -1, comisionPct: 0 }, 'tinAnual'],
    [{ importe: 15000, meses: 60, tinAnual: Number.NaN, comisionPct: 0 }, 'tinAnual'],
    [{ importe: 15000, meses: 60, tinAnual: 7, comisionPct: -2 }, 'comisionPct'],
    [{ importe: 15000, meses: 60, tinAnual: 7, comisionPct: 50 }, 'comisionPct'],
  ];
  for (const [entrada, campo] of casos) {
    const r = calcularPrestamo(entrada as { importe: number; meses: number; tinAnual: number; comisionPct: number });
    assert.equal(r.ok, false, `debería fallar: ${JSON.stringify(entrada)}`);
    if (!r.ok) assert.ok(r.errores.some((e) => e.campo === campo), `falta el error de ${campo}`);
  }
});

test('validación: devuelve todos los errores, no solo el primero', () => {
  const r = calcularPrestamo({ importe: -5, meses: 0, tinAnual: -1, comisionPct: 99 });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.errores.length, 4);
});
