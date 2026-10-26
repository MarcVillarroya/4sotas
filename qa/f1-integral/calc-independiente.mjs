// QA independiente de la calculadora: reimplementación por simulación (bucle periodo a periodo,
// sin fórmula cerrada) y comparación al céntimo con el motor del sitio.
import { calcularInteresCompuesto, parsearNumero } from '../../src/lib/calculadora.ts';

const MESES = { mensual: 1, trimestral: 3, semestral: 6, anual: 12 };
const PERIODOS_ANIO = { mensual: 12, trimestral: 4, semestral: 2, anual: 1 };

// Simulación independiente: tasa por periodo derivada aplicando (1+i)^m = 1+r
function simular(e) {
  const m = PERIODOS_ANIO[e.frecuencia];
  const meses = e.anios * 12 + e.meses;
  const n = meses / (12 / m); // periodos
  const i = Math.pow(1 + e.rentabilidadAnual / 100, 1 / m) - 1;
  let cap = e.capitalInicial;
  for (let k = 1; k <= n; k += 1) {
    if (e.momentoAportacion === 'inicio') cap = (cap + e.aportacionPeriodica) * (1 + i);
    else cap = cap * (1 + i) + e.aportacionPeriodica;
  }
  const aportado = e.capitalInicial + e.aportacionPeriodica * n;
  return { capitalFinal: cap, aportado, ganancia: cap - aportado, periodos: n };
}

const base = { capitalInicial: 0, aportacionPeriodica: 0, rentabilidadAnual: 0, anios: 0, meses: 0, frecuencia: 'mensual', momentoAportacion: 'fin' };
const casos = [
  ['nominal: 10.000 al 5 % 10 anos mensual fin', { ...base, capitalInicial: 10000, rentabilidadAnual: 5, anios: 10 }],
  ['aportacion 200/mes 30 anos 7 % mensual inicio', { ...base, aportacionPeriodica: 200, rentabilidadAnual: 7, anios: 30, momentoAportacion: 'inicio' }],
  ['aportacion 200/mes 30 anos 7 % mensual fin', { ...base, aportacionPeriodica: 200, rentabilidadAnual: 7, anios: 30 }],
  ['mixto 5.000 + 150/mes 15 anos 4,5 % trimestral', { ...base, capitalInicial: 5000, aportacionPeriodica: 150, rentabilidadAnual: 4.5, anios: 15, frecuencia: 'trimestral' }],
  ['tasa cero: 1.000 + 100/mes 5 anos', { ...base, capitalInicial: 1000, aportacionPeriodica: 100, rentabilidadAnual: 0, anios: 5 }],
  ['solo capital 1.000 al 3 % 1 ano anual', { ...base, capitalInicial: 1000, rentabilidadAnual: 3, anios: 1, frecuencia: 'anual' }],
  ['periodo unico: 1 mes mensual 12 %', { ...base, capitalInicial: 1000, rentabilidadAnual: 12, anios: 0, meses: 1 }],
  ['limite 60 anos mensual 3 %', { ...base, capitalInicial: 1000, rentabilidadAnual: 3, anios: 60 }],
  ['4 anos 6 meses semestral 2 %', { ...base, capitalInicial: 2000, rentabilidadAnual: 2, anios: 4, meses: 6, frecuencia: 'semestral' }],
];

let fallos = 0;
const filas = [];
for (const [nombre, entrada] of casos) {
  const r = calcularInteresCompuesto(entrada);
  if (r.ok !== true) { filas.push({ nombre, veredicto: 'ERROR INESPERADO', errores: r.errores.map((x) => x.mensaje) }); fallos += 1; continue; }
  const esperado = simular(entrada);
  const dCap = Math.abs(r.resultado.capitalFinal - esperado.capitalFinal);
  const dGan = Math.abs(r.resultado.ganancia - esperado.ganancia);
  const ok = dCap < 0.005 && dGan < 0.005 && r.resultado.periodos === esperado.periodos;
  if (!ok) fallos += 1;
  filas.push({ nombre, veredicto: ok ? 'PASS' : 'FAIL', motor: r.resultado.capitalFinal.toFixed(4), simulado: esperado.capitalFinal.toFixed(4), delta: dCap.toFixed(6), periodos: `${r.resultado.periodos}/${esperado.periodos}` });
}

// Tabla: coherencia interna (capital del último periodo = capitalFinal, interesAcumulado = cap - aportado)
const tablaCheck = calcularInteresCompuesto({ ...base, capitalInicial: 1000, aportacionPeriodica: 100, rentabilidadAnual: 6, anios: 5 });
if (tablaCheck.ok) {
  const t = tablaCheck.resultado.tabla;
  const ultima = t[t.length - 1];
  const coherente = Math.abs(ultima.capital - tablaCheck.resultado.capitalFinal) < 1e-9
    && Math.abs(ultima.interesAcumulado - (ultima.capital - ultima.aportadoAcumulado)) < 1e-9
    && t.slice(1).every((f, idx) => Math.abs(f.interesPeriodo - (f.capital - t[idx].capital - 100)) < 1e-9);
  filas.push({ nombre: 'tabla periodo a periodo coherente (60 filas mensuales)', veredicto: coherente ? 'PASS' : 'FAIL', filas: t.length });
  if (!coherente) fallos += 1;
}

// Inflacion: valor real = capital / (1+inf)^anos
const inf = calcularInteresCompuesto({ ...base, capitalInicial: 10000, rentabilidadAnual: 4, anios: 10, inflacionAnual: 2 });
if (inf.ok) {
  const esp = inf.resultado.capitalFinal / Math.pow(1.02, 10);
  const ok = Math.abs(inf.resultado.valorReal - esp) < 0.005;
  filas.push({ nombre: 'inflacion 2 % a 10 anos', veredicto: ok ? 'PASS' : 'FAIL', valorReal: inf.resultado.valorReal.toFixed(4), esperado: esp.toFixed(4) });
  if (!ok) fallos += 1;
}

// Entradas invalidas: cada una debe devolver ok:false con error en el campo citado
const invalidos = [
  ['capital negativo', { ...base, capitalInicial: -1, anios: 1 }, 'capitalInicial'],
  ['capital sobre limite', { ...base, capitalInicial: 100000001, anios: 1 }, 'capitalInicial'],
  ['capital NaN', { ...base, capitalInicial: NaN, anios: 1 }, 'capitalInicial'],
  ['aportacion negativa', { ...base, aportacionPeriodica: -5, anios: 1 }, 'aportacionPeriodica'],
  ['rentabilidad fuera de rango alta', { ...base, rentabilidadAnual: 101, anios: 1 }, 'rentabilidadAnual'],
  ['rentabilidad fuera de rango baja', { ...base, rentabilidadAnual: -101, anios: 1 }, 'rentabilidadAnual'],
  ['anos decimales', { ...base, anios: 1.5 }, 'anios'],
  ['meses > 11', { ...base, meses: 12, anios: 1 }, 'meses'],
  ['plazo cero', { ...base }, 'plazo'],
  ['plazo no multiplo de trimestral', { ...base, anios: 1, meses: 1, frecuencia: 'trimestral' }, 'plazo'],
  ['plazo > periodosMax', { ...base, anios: 61 }, 'plazo'],
  ['frecuencia desconocida', { ...base, anios: 1, frecuencia: 'diaria' }, 'frecuencia'],
  ['momento invalido', { ...base, anios: 1, momentoAportacion: 'mitad' }, 'momentoAportacion'],
  ['inflacion fuera de rango', { ...base, anios: 1, inflacionAnual: 50 }, 'inflacionAnual'],
];
for (const [nombre, entrada, campo] of invalidos) {
  const r = calcularInteresCompuesto(entrada);
  const ok = r.ok === false && r.errores.some((x) => x.campo === campo);
  if (!ok) fallos += 1;
  filas.push({ nombre: `invalido: ${nombre}`, veredicto: ok ? 'PASS' : 'FAIL', detalle: r.ok ? 'devolvio ok' : r.errores.map((e) => `${e.campo}: ${e.mensaje}`).join(' | ') });
}

// Parsing es-ES / internacional
const parseos = [['1.234,56', 1234.56], ['5,25', 5.25], ['5.25', 5.25], ['1 000 €', 1000], ['10%', 10], ['', NaN], ['abc', NaN], ['-3,5', -3.5], ['1.234', 1.234]];
for (const [entrada, esperado] of parseos) {
  const got = parsearNumero(entrada);
  const ok = Number.isNaN(esperado) ? Number.isNaN(got) : Math.abs(got - esperado) < 1e-9;
  if (!ok) fallos += 1;
  filas.push({ nombre: `parsearNumero("${entrada}")`, veredicto: ok ? 'PASS' : 'FAIL', esperado, got });
}

console.log(filas.map((f) => JSON.stringify(f)).join('\n'));
console.log(`\nRESUMEN: ${filas.length} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
