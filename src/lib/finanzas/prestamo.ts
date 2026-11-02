/**
 * Calculadora de préstamo personal.
 *
 * Entrada: importe, plazo en meses, TIN nominal anual y comisión de apertura en %.
 * Salida: cuota francesa, intereses, total, TAE calculada desde el flujo y tabla anual.
 *
 * TAE (docs/FINANZAS.md §3): se resuelve la tasa mensual `r` que iguala el capital neto
 * recibido (importe − comisión) con el valor actual de las cuotas:
 *   importe − comisión = Σ cuota / (1 + r)^k ,  k = 1…n
 * y se anualiza: TAE = (1 + r)^12 − 1. Nunca se presenta el TIN como TAE.
 */
import { cuadroFrances } from './amortizacion.ts';
import { formatearEntero, formatearPorcentaje } from './numero.ts';
import type { ErrorCampo, Respuesta, ResultadoPrestamo } from './tipos.ts';

export const LIMITES_PRESTAMO = {
  importeMin: 300,
  importeMax: 200000,
  mesesMin: 3,
  mesesMax: 120,
  tinMin: 0,
  tinMax: 30,
  comisionMin: 0,
  comisionMax: 10,
} as const;

const eur = (n: number): string => `${formatearEntero(n)} €`;

/**
 * TAE a partir del flujo real de pagos. Bisección sobre el tipo mensual en [0, 1].
 * Devuelve `null` si el flujo no tiene solución (no debería ocurrir con la validación).
 */
export function taeDesdeFlujo(principalNeto: number, cuota: number, meses: number): number | null {
  if (!Number.isFinite(principalNeto) || !Number.isFinite(cuota) || !Number.isInteger(meses) || meses <= 0) return null;
  if (principalNeto <= 0 || cuota <= 0) return null;

  const valorActual = (r: number): number => {
    let suma = 0;
    for (let k = 1; k <= meses; k++) suma += cuota / Math.pow(1 + r, k);
    return suma;
  };

  if (valorActual(0) < principalNeto) return null; // las cuotas no devuelven el principal
  let bajo = 0;
  let alto = 1; // 100 % mensual: cualquier préstamo real queda muy por debajo
  for (let iteracion = 0; iteracion < 200; iteracion++) {
    const medio = (bajo + alto) / 2;
    if (valorActual(medio) > principalNeto) bajo = medio;
    else alto = medio;
  }
  const r = (bajo + alto) / 2;
  return Math.pow(1 + r, 12) - 1;
}

/** Valida los cuatro campos y devuelve todos los errores, no solo el primero. */
export function validarPrestamo(entrada: {
  importe: number;
  meses: number;
  tinAnual: number;
  comisionPct: number;
}): ErrorCampo[] {
  const errores: ErrorCampo[] = [];
  const L = LIMITES_PRESTAMO;

  if (!Number.isFinite(entrada.importe) || entrada.importe < L.importeMin || entrada.importe > L.importeMax)
    errores.push({ campo: 'importe', mensaje: `Escribe un importe entre ${eur(L.importeMin)} y ${eur(L.importeMax)}.` });

  if (
    !Number.isFinite(entrada.meses) ||
    !Number.isInteger(entrada.meses) ||
    entrada.meses < L.mesesMin ||
    entrada.meses > L.mesesMax
  )
    errores.push({
      campo: 'meses',
      mensaje: `Escribe un plazo entero en meses, de ${L.mesesMin} a ${L.mesesMax}.`,
    });

  if (!Number.isFinite(entrada.tinAnual) || entrada.tinAnual < L.tinMin || entrada.tinAnual > L.tinMax)
    errores.push({ campo: 'tinAnual', mensaje: `Escribe un TIN anual entre ${L.tinMin} % y ${L.tinMax} %.` });

  if (!Number.isFinite(entrada.comisionPct) || entrada.comisionPct < L.comisionMin || entrada.comisionPct > L.comisionMax)
    errores.push({
      campo: 'comisionPct',
      mensaje: `Escribe una comisión de apertura entre ${L.comisionMin} % y ${L.comisionMax} %.`,
    });

  return errores;
}

export function calcularPrestamo(entrada: {
  importe: number;
  meses: number;
  tinAnual: number;
  comisionPct: number;
}): Respuesta<ResultadoPrestamo> {
  const errores = validarPrestamo(entrada);
  if (errores.length > 0) return { ok: false, errores };

  const comision = (entrada.importe * entrada.comisionPct) / 100;
  const principalNeto = entrada.importe - comision;
  if (principalNeto <= 0)
    return {
      ok: false,
      errores: [{ campo: 'comisionPct', mensaje: 'La comisión no puede dejar el capital recibido en cero o menos.' }],
    };

  const cuadro = cuadroFrances(entrada.importe, entrada.tinAnual, entrada.meses);
  const tae = taeDesdeFlujo(principalNeto, cuadro.cuota, entrada.meses);

  return { ok: true, resultado: { ...cuadro, comision, principalNeto, tae } };
}

/** Texto de la TAE: `'7,68 %'`, nunca el TIN disfrazado. */
export const formatearTae = (tae: number | null): string =>
  tae === null ? 'No calculable' : formatearPorcentaje(tae);
