import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularViabilidad, ETIQUETA_VEREDICTO } from '../src/lib/finanzas/viabilidad.ts';
import { parsearNumero, redondearCentimos as r2 } from '../src/lib/finanzas/numero.ts';

/**
 * Vectores independientes (Python Decimal, docs/FINANZAS.md §6).
 *
 * Nota de contrato: la tarjeta pedía para V1 «ahorro 100.000 → efectivo 10.000», pero
 * efectivo = ahorro − entrada − gastos = 100.000 − 100.000 − 30.000 = −30.000. La cifra
 * coherente con las demás (hipoteca 200.000, LTV 66,7 %, DTI 28,11 %) es efectivo −30.000,
 * y el caso «Holgado» con 10.000 € de colchón es el mismo escenario con 140.000 € de ahorro.
 * Aquí se fijan ambos; la divergencia queda documentada en docs/FINANZAS.md §6.
 */

const ok = (r: ReturnType<typeof calcularViabilidad>) => {
  assert.equal(r.ok, true, r.ok ? '' : r.errores.map((e) => `${e.campo}: ${e.mensaje}`).join(' · '));
  if (!r.ok) throw new Error('sin resultado');
  return r.resultado;
};

test('V1 · precio 300.000, ahorro 100.000, entrada 100.000, gastos 10 %: sin liquidad, no encaja', () => {
  const r = ok(
    calcularViabilidad({
      precio: 300000, ahorro: 100000, entrada: 100000, gastosPct: 10,
      plazoAnios: 30, tinAnual: 3, ingresos: 3000, otrasDeudas: 0,
    }),
  );
  assert.equal(r.hipoteca, 200000);
  assert.equal(r2(r.ltv * 100), 66.67);
  assert.equal(r2(r.gastos), 30000);
  assert.equal(r2(r.cuota), 843.21);
  assert.equal(r2(r.efectivo), -30000);
  assert.equal(r2(r.dti * 100), 28.11);
  assert.equal(r2(r.dtiEstres * 100), 35.79);
  assert.equal(r2(r.ingresosMinimos), 2409.17);
  assert.equal(r.veredicto, 'no-encaja', 'sin efectivo no hay compra aunque la cuota sea pagable');
  assert.ok(r.motivos.length > 0);
});

test('V1b · el mismo caso con 140.000 de ahorro deja 10.000 de colchón: Holgado', () => {
  const r = ok(
    calcularViabilidad({
      precio: 300000, ahorro: 140000, entrada: 100000, gastosPct: 10,
      plazoAnios: 30, tinAnual: 3, ingresos: 3000, otrasDeudas: 0,
    }),
  );
  assert.equal(r.hipoteca, 200000);
  assert.equal(r2(r.efectivo), 10000);
  assert.equal(r2(r.cuota), 843.21);
  assert.equal(r2(r.dti * 100), 28.11);
  assert.equal(r.veredicto, 'holgado');
  assert.deepEqual(r.motivos, []);
});

test('V2 · ahorro 60.000, entrada 60.000 y gastos 30.000: efectivo −30.000', () => {
  const r = ok(
    calcularViabilidad({
      precio: 300000, ahorro: 60000, entrada: 60000, gastosPct: 10,
      plazoAnios: 30, tinAnual: 3, ingresos: 3000, otrasDeudas: 0,
    }),
  );
  assert.equal(r.hipoteca, 240000);
  assert.equal(r2(r.cuota), 1011.85);
  assert.equal(r2(r.efectivo), -30000);
  assert.equal(r.veredicto, 'no-encaja');
});

test('V3 · ingresos 2.800 con 300 de otras deudas y cuota 1.011,85: DTI 46,85 %', () => {
  const r = ok(
    calcularViabilidad({
      precio: 300000, ahorro: 200000, entrada: 60000, gastosPct: 10,
      plazoAnios: 30, tinAnual: 3, ingresos: 2800, otrasDeudas: 300,
    }),
  );
  assert.equal(r2(r.cuota), 1011.85);
  assert.equal(r2(r.dti * 100), 46.85);
  assert.equal(r2(r.ingresosMinimos), 3748.14);
  assert.equal(r.veredicto, 'no-encaja');
});

test('caso intermedio: el estrés a +2 puntos deja el veredicto en Justo', () => {
  const r = ok(
    calcularViabilidad({
      precio: 300000, ahorro: 120000, entrada: 60000, gastosPct: 10,
      plazoAnios: 30, tinAnual: 3, ingresos: 3000, otrasDeudas: 0,
    }),
  );
  assert.equal(r2(r.cuota), 1011.85);
  assert.equal(r2(r.dti * 100), 33.73);
  assert.ok(r.dtiEstres > 0.4, 'el estrés supera el umbral holgado');
  assert.equal(r.veredicto, 'justo');
  assert.ok(r.motivos.length > 0, 'explica por qué no es holgado');
});

test('umbrales: LTV por encima del 90 % nunca es holgado aunque el DTI sea bueno', () => {
  const r = ok(
    calcularViabilidad({
      precio: 300000, ahorro: 900000, entrada: 15000, gastosPct: 10,
      plazoAnios: 30, tinAnual: 3, ingresos: 6000, otrasDeudas: 0,
    }),
  );
  assert.ok(r.ltv > 0.9);
  assert.equal(r.veredicto, 'no-encaja');
});

test('etiquetas del veredicto: texto explícito, sin sinónimos de aprobación', () => {
  assert.equal(ETIQUETA_VEREDICTO.holgado, 'Holgado');
  assert.equal(ETIQUETA_VEREDICTO.justo, 'Justo');
  assert.equal(ETIQUETA_VEREDICTO['no-encaja'], 'No encaja');
});

test('validación: precios, entradas, gastos, ingresos y deudas fuera de rango', () => {
  const base = {
    precio: 300000, ahorro: 100000, entrada: 50000, gastosPct: 10,
    plazoAnios: 30, tinAnual: 3, ingresos: 3000, otrasDeudas: 0,
  };
  const casos: [Partial<typeof base>, string][] = [
    [{ precio: -1 }, 'precio'],
    [{ precio: Number.POSITIVE_INFINITY }, 'precio'],
    [{ precio: parsearNumero('') }, 'precio'],
    [{ ahorro: -1 }, 'ahorro'],
    [{ entrada: -1 }, 'entrada'],
    [{ entrada: 300000 }, 'entrada'],
    [{ gastosPct: 25 }, 'gastosPct'],
    [{ plazoAnios: 3 }, 'plazoAnios'],
    [{ plazoAnios: 30.5 }, 'plazoAnios'],
    [{ tinAnual: -1 }, 'tinAnual'],
    [{ ingresos: 100 }, 'ingresos'],
    [{ ingresos: Number.NaN }, 'ingresos'],
    [{ otrasDeudas: -1 }, 'otrasDeudas'],
  ];
  for (const [cambio, campo] of casos) {
    const r = calcularViabilidad({ ...base, ...cambio });
    assert.equal(r.ok, false, `debería fallar: ${campo} = ${JSON.stringify(cambio)}`);
    if (!r.ok) assert.ok(r.errores.some((e) => e.campo === campo), `falta el error de ${campo}`);
  }
});
