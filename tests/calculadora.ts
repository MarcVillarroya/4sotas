/**
 * Vectores del motor de interés compuesto.
 *
 * Cada valor esperado se calculó FUERA del motor, con `decimal.Decimal` de Python a 40
 * dígitos de precisión y la misma fórmula cerrada documentada en `docs/CALCULADORA.md`
 * (no se copió la salida de este código). Los vectores y su deducción están en
 * `docs/CALCULADORA.md` §5, que es el contrato: si un cambio de motor rompe esta tabla,
 * el fallo es del motor o del documento, nunca de la prueba.
 *
 * Tolerancias (`docs/CALCULADORA.md` §6):
 *  - dinero en euros: |obtenido − esperado| ≤ max(1e-9, |esperado| · 1e-9); el motor no
 *    redondea, así que el error esperado es de orden 1e-12 en coma flotante.
 *  - importes presentados: exactamente el céntimo (`formatearEuros` es el único que redondea).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FRECUENCIAS,
  LIMITES,
  calcularInteresCompuesto,
  filasAnuales,
  formatearEuros,
  formatearPorcentaje,
  parsearNumero,
  redondearCentimos,
  tasaPorPeriodo,
  type EntradaCalculo,
} from '../src/lib/calculadora.ts';
import { svgEvolucion } from '../src/lib/calculadora-svg.ts';

/** Entrada base: 1.000 € al 5 % EA, 10 años, capitalización mensual, aportación al final. */
const BASE: EntradaCalculo = {
  capitalInicial: 1000,
  aportacionPeriodica: 100,
  anios: 10,
  meses: 0,
  rentabilidadAnual: 5,
  frecuencia: 'mensual',
  momentoAportacion: 'fin',
  inflacionAnual: null,
};

const entrada = (cambios: Partial<EntradaCalculo> = {}): EntradaCalculo => ({ ...BASE, ...cambios });

/** Calcula y exige que la respuesta sea correcta; devuelve el resultado. */
const resultado = (cambios: Partial<EntradaCalculo> = {}) => {
  const respuesta = calcularInteresCompuesto(entrada(cambios));
  assert.equal(respuesta.ok, true, `se esperaba cálculo válido: ${JSON.stringify(cambios)}`);
  if (!respuesta.ok) throw new Error('inaccesible');
  return respuesta.resultado;
};

const cerca = (obtenido: number, esperado: number, etiqueta: string): void => {
  const tolerancia = Math.max(1e-9, Math.abs(esperado) * 1e-9);
  assert.ok(
    Math.abs(obtenido - esperado) <= tolerancia,
    `${etiqueta}: obtenido ${obtenido}, esperado ${esperado} (tolerancia ${tolerancia})`,
  );
};

/**
 * Intl mete espacio duro (U+00A0) antes del símbolo y CLDR es-ES no agrupa los números de
 * cuatro cifras. Se normaliza el espacio para comparar texto sin depender del carácter exacto.
 */
const texto = (s: string): string => s.replace(/[\u00A0\u202F]/g, ' ');

/* ─────────────── vectores independientes (§5 de docs/CALCULADORA.md) ─────────────── */

test('V1 · tasa por periodo desde la tasa efectiva anual: 5 % EA y m=12', () => {
  // (1,05)^(1/12) − 1 = 0,004074123783648305… (Python Decimal, 40 dígitos)
  cerca(tasaPorPeriodo(0.05, 12), 0.004074123783648305, 'i mensual');
  cerca(tasaPorPeriodo(0.05, 1), 0.05, 'i anual');
  cerca(tasaPorPeriodo(0.06, 4), 0.014673846168659278, 'i trimestral al 6 % EA');
});

test('V2 · capital único al 5 % EA durante 10 años con capitalización anual', () => {
  // 1000 · 1,05^10 = 1628,89462677744
  const r = resultado({ aportacionPeriodica: 0, frecuencia: 'anual', anios: 10 });
  assert.equal(r.periodos, 10);
  cerca(r.capitalFinal, 1628.8946267774414, 'capital final');
  cerca(r.ganancia, 628.8946267774414, 'ganancia');
  assert.equal(r.aportado, 1000);
});

test('V3 · el mismo capital único da el mismo resultado con capitalización mensual (la tasa es efectiva, no nominal)', () => {
  const r = resultado({ aportacionPeriodica: 0, frecuencia: 'mensual', anios: 10 });
  assert.equal(r.periodos, 120);
  cerca(r.capitalFinal, 1628.8946267774414, 'capital final mensual');
});

test('V4 · 100 € al mes al final del periodo, 5 % EA, 10 años', () => {
  // 100 · ((1+i)^120 − 1)/i con i = 0,004074123783648305 = 15436,316130146592
  const r = resultado({ capitalInicial: 0, aportacionPeriodica: 100, frecuencia: 'mensual', anios: 10 });
  assert.equal(r.periodos, 120);
  cerca(r.capitalFinal, 15436.316130146592, 'capital final');
  assert.equal(r.aportado, 12000);
  cerca(r.ganancia, 3436.316130146592, 'ganancia');
});

test('V5 · aportación al inicio del periodo: capital final = V4 · (1+i)', () => {
  const fin = resultado({ capitalInicial: 0, aportacionPeriodica: 100, momentoAportacion: 'fin' });
  const inicio = resultado({ capitalInicial: 0, aportacionPeriodica: 100, momentoAportacion: 'inicio' });
  cerca(inicio.capitalFinal, 15499.205592824336, 'capital final al inicio');
  cerca(inicio.capitalFinal, fin.capitalFinal * (1 + inicio.tasaPeriodo), 'relación inicio/fin');
  // La diferencia es exactamente un periodo de interés sobre el capital final al final.
  cerca(inicio.capitalFinal - fin.capitalFinal, fin.capitalFinal * fin.tasaPeriodo, 'diferencia de momento');
});

test('V6 · 200 € al mes al 5 % EA durante 20 años: 81.160,90 € (cifra de contraste del equipo editorial)', () => {
  const r = resultado({ capitalInicial: 0, aportacionPeriodica: 200, anios: 20 });
  assert.equal(r.periodos, 240);
  cerca(r.capitalFinal, 81160.89706356068, 'capital final');
  assert.equal(r.aportado, 48000);
  cerca(r.ganancia, 33160.89706356068, 'ganancia');
  assert.equal(texto(formatearEuros(r.capitalFinal)), '81.160,90 €');
});

test('V7 · tasa 0 %: capital + aportaciones, sin intereses ni divisiones por cero', () => {
  const r = resultado({ rentabilidadAnual: 0 });
  assert.equal(r.capitalFinal, 13000);
  assert.equal(r.aportado, 13000);
  assert.equal(r.ganancia, 0);
  assert.equal(r.tasaPeriodo, 0);
  for (const fila of r.tabla) {
    assert.equal(fila.interesPeriodo, 0);
    assert.equal(fila.interesAcumulado, 0);
  }
});

test('V8 · capital y aportación a cero: resultado cero, no NaN', () => {
  const r = resultado({ capitalInicial: 0, aportacionPeriodica: 0 });
  assert.equal(r.capitalFinal, 0);
  assert.equal(r.ganancia, 0);
  assert.equal(r.tabla.length, 120);
  assert.ok(r.tabla.every((f) => f.capital === 0));
});

test('V9 · 5.000 € + 150 €/mes al 6 % EA durante 15 años', () => {
  // 5000·1,0048675…^180 + 150·((1,0048675…^180 − 1)/i) = 55019,57633686731
  const r = resultado({ capitalInicial: 5000, aportacionPeriodica: 150, rentabilidadAnual: 6, anios: 15 });
  cerca(r.capitalFinal, 55019.57633686731, 'capital final');
  assert.equal(r.aportado, 5000 + 150 * 180);
});

test('V10 · capitalización trimestral: 1.000 € al 4 % EA durante 3 años', () => {
  const r = resultado({ aportacionPeriodica: 0, rentabilidadAnual: 4, frecuencia: 'trimestral', anios: 3 });
  assert.equal(r.periodos, 12);
  cerca(r.capitalFinal, 1124.864, 'capital final');
});

test('V11 · capitalización anual con aportación: 1.000 € + 100 €/año al 4 % durante 3 años', () => {
  // 1000·1,04 + 100 = 1140; ·1,04 + 100 = 1285,60; ·1,04 + 100 = 1437,024
  const r = resultado({ capitalInicial: 1000, aportacionPeriodica: 100, rentabilidadAnual: 4, frecuencia: 'anual', anios: 3 });
  cerca(r.capitalFinal, 1437.024, 'capital final');
  assert.deepEqual(
    r.tabla.map((f) => redondearCentimos(f.capital)),
    [1140, 1285.6, 1437.02],
  );
});

test('V12 · plazo largo: 300 €/mes al 7 % EA durante 30 años (360 periodos)', () => {
  const r = resultado({ capitalInicial: 0, aportacionPeriodica: 300, rentabilidadAnual: 7, anios: 30 });
  assert.equal(r.periodos, 360);
  cerca(r.capitalFinal, 350835.7809859803, 'capital final');
  assert.equal(r.aportado, 108000);
  assert.ok(Number.isFinite(r.capitalFinal));
});

test('V13 · inflación: el valor real descuenta el capital final por (1+π)^años', () => {
  // 81160,89706356068 / 1,03^20 = 44936,82089210645
  const r = resultado({ capitalInicial: 0, aportacionPeriodica: 200, anios: 20, inflacionAnual: 3 });
  cerca(r.valorReal ?? Number.NaN, 44936.82089210645, 'valor real');
  cerca(r.gananciaReal ?? Number.NaN, 44936.82089210645 - 48000, 'ganancia real');
  assert.ok((r.gananciaReal ?? 0) < 0, 'con 3 % de inflación, 48.000 € aportados compran menos de 48.000 € de hoy');
  // Sin inflación no se inventa ningún valor real.
  assert.equal(resultado({ inflacionAnual: null }).valorReal, null);
});

test('V14 · meses sueltos: 10 años y 6 meses mensuales son 126 periodos', () => {
  const r = resultado({ meses: 6 });
  assert.equal(r.meses, 126);
  assert.equal(r.periodos, 126);
  assert.ok(r.capitalFinal > resultado({ meses: 0 }).capitalFinal);
});

/* ─────────────── coherencia interna de la tabla ─────────────── */

test('la tabla cierra en el capital final y el interés acumulado cuadra con la ganancia', () => {
  const r = resultado();
  assert.equal(r.tabla.length, r.periodos);
  const ultima = r.tabla[r.tabla.length - 1];
  assert.equal(ultima.capital, r.capitalFinal);
  cerca(ultima.interesAcumulado, r.ganancia, 'interés acumulado = ganancia');
  cerca(ultima.interesAcumulado, ultima.capital - ultima.aportadoAcumulado, 'capital = aportado + interés');
  assert.equal(r.ganancia, r.capitalFinal - r.aportado);
});

test('cada fila suma el interés de su periodo y las aportaciones no generan interés al final del periodo', () => {
  const r = resultado({ frecuencia: 'anual', anios: 3, aportacionPeriodica: 100, rentabilidadAnual: 4 });
  const [f1, f2] = r.tabla;
  cerca(f1.interesPeriodo, 1000 * 0.04, 'interés del primer año');
  cerca(f2.interesPeriodo, (1000 + 40 + 100) * 0.04, 'interés del segundo año');
});

test('el interés de periodo es positivo con tasa positiva y negativo con tasa negativa', () => {
  assert.ok(resultado({ rentabilidadAnual: 3 }).tabla.every((f) => f.interesPeriodo > 0));
  const negativo = resultado({ rentabilidadAnual: -10, aportacionPeriodica: 0 });
  assert.ok(negativo.tabla.every((f) => f.interesPeriodo < 0));
  assert.ok(negativo.capitalFinal < negativo.aportado);
});

/* ─────────────── tabla de presentación ─────────────── */

test('filasAnuales deja un cierre por año y siempre incluye la última fila', () => {
  const anual = filasAnuales(resultado({ anios: 10 }).tabla);
  assert.equal(anual.length, 10);
  assert.deepEqual(
    anual.map((f) => f.anio),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
  // Plazo que no cierra año: 3 trimestres.
  const parcial = filasAnuales(resultado({ anios: 0, meses: 9, frecuencia: 'trimestral' }).tabla);
  assert.equal(parcial.length, 1);
  assert.equal(parcial[0].meses, 9);
});

/* ─────────────── entradas inválidas ─────────────── */

const erroresDe = (cambios: Partial<EntradaCalculo>) => {
  const respuesta = calcularInteresCompuesto(entrada(cambios));
  assert.equal(respuesta.ok, false, `se esperaba error con ${JSON.stringify(cambios)}`);
  if (respuesta.ok) throw new Error('inaccesible');
  return respuesta.errores;
};

test('plazo cero o negativo se rechaza con un mensaje claro', () => {
  const errores = erroresDe({ anios: 0, meses: 0 });
  assert.ok(errores.some((e) => e.campo === 'plazo'));
  assert.match(errores.find((e) => e.campo === 'plazo')?.mensaje ?? '', /al menos un periodo/);
  assert.ok(erroresDe({ anios: -1 }).some((e) => e.campo === 'anios'));
});

test('un plazo que no completa un periodo de capitalización se rechaza', () => {
  const errores = erroresDe({ anios: 0, meses: 7, frecuencia: 'trimestral' });
  assert.match(errores[0]?.mensaje ?? '', /múltiplo de 3 meses/);
  assert.equal(calcularInteresCompuesto(entrada({ anios: 0, meses: 6, frecuencia: 'trimestral' })).ok, true);
});

test('capital, aportación, tasa y plazo fuera de rango se rechazan con su campo', () => {
  assert.ok(erroresDe({ capitalInicial: -1 }).some((e) => e.campo === 'capitalInicial'));
  assert.ok(erroresDe({ capitalInicial: LIMITES.capitalMax + 1 }).some((e) => e.campo === 'capitalInicial'));
  assert.ok(erroresDe({ aportacionPeriodica: -5 }).some((e) => e.campo === 'aportacionPeriodica'));
  assert.ok(erroresDe({ rentabilidadAnual: 31 }).some((e) => e.campo === 'rentabilidadAnual'));
  assert.ok(erroresDe({ rentabilidadAnual: -21 }).some((e) => e.campo === 'rentabilidadAnual'));
  assert.ok(erroresDe({ anios: 61 }).some((e) => e.campo === 'anios'));
  assert.ok(erroresDe({ anios: 10.5 }).some((e) => e.campo === 'anios'));
  assert.ok(erroresDe({ meses: 12 }).some((e) => e.campo === 'meses'));
  assert.ok(erroresDe({ inflacionAnual: 25 }).some((e) => e.campo === 'inflacionAnual'));
});

test('NaN y frecuencias desconocidas no producen resultados silenciosos', () => {
  assert.ok(erroresDe({ capitalInicial: Number.NaN }).length > 0);
  assert.ok(erroresDe({ rentabilidadAnual: Number.POSITIVE_INFINITY }).length > 0);
  assert.ok(
    erroresDe({ frecuencia: 'diaria' as unknown as EntradaCalculo['frecuencia'] }).some(
      (e) => e.campo === 'frecuencia',
    ),
  );
});

test('los límites declarados son los que aplica el motor', () => {
  assert.equal(calcularInteresCompuesto(entrada({ anios: LIMITES.aniosMax })).ok, true);
  assert.equal(calcularInteresCompuesto(entrada({ capitalInicial: LIMITES.capitalMax })).ok, true);
  assert.equal(calcularInteresCompuesto(entrada({ rentabilidadAnual: LIMITES.tasaMax })).ok, true);
  assert.equal(FRECUENCIAS.length, 4);
});

/* ─────────────── presentación y redondeo ─────────────── */

test('el redondeo monetario es al céntimo y solo al presentar', () => {
  assert.equal(redondearCentimos(1628.8946267774414), 1628.89);
  assert.equal(redondearCentimos(0.125), 0.13);
  assert.equal(redondearCentimos(-0.125), -0.13);
  assert.equal(redondearCentimos(-3063.1791078935523), -3063.18);
  // El motor sigue devolviendo precisión completa: redondear no es calcular.
  assert.notEqual(resultado().capitalFinal, redondearCentimos(resultado().capitalFinal));
});

test('formateo en euros y porcentajes en convención es-ES', () => {
  // CLDR es-ES no agrupa millares de cuatro cifras: 1628,89 € va sin punto; 81.160,90 € sí lo lleva.
  assert.equal(texto(formatearEuros(1628.8946267774414)), '1628,89 €');
  assert.equal(texto(formatearEuros(0)), '0,00 €');
  assert.equal(texto(formatearEuros(-3063.1791)), '-3063,18 €');
  assert.equal(texto(formatearEuros(81160.89706356068)), '81.160,90 €');
  assert.equal(formatearPorcentaje(0.004074123783648305, 4), '0,4074 %');
  assert.equal(formatearPorcentaje(0.05), '5,00 %');
});

test('parsearNumero acepta coma o punto decimal y descarta unidades', () => {
  assert.equal(parsearNumero('1.234,56'), 1234.56);
  assert.equal(parsearNumero('1234.56'), 1234.56);
  assert.equal(parsearNumero('1,5'), 1.5);
  assert.equal(parsearNumero(' 5 % '), 5);
  assert.equal(parsearNumero('1 000 €'), 1000);
  assert.equal(parsearNumero(''), Number.NaN);
  assert.equal(parsearNumero('abc'), Number.NaN);
});

/* ─────────────── gráfico ─────────────── */

test('el SVG de evolución se genera desde la tabla, sin NaN y con las dos barras por fila', () => {
  const filas = filasAnuales(resultado({ anios: 10 }).tabla);
  const svg = svgEvolucion(filas);
  assert.match(svg, /^<svg viewBox="0 0 640 300" role="img"/);
  assert.match(svg, /aria-labelledby="grafico-titulo"/);
  assert.match(svg, /<title id="grafico-titulo">/);
  assert.ok(!svg.includes('NaN'), 'el gráfico no debe contener NaN');
  assert.equal((svg.match(/<rect /g) ?? []).length, filas.length * 2);
  assert.equal(svgEvolucion([]), '');
});
