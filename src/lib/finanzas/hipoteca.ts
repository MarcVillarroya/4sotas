/**
 * Calculadora de hipoteca fija.
 *
 * Entrada: precio de la vivienda, entrada, plazo en años y TIN fijo anual.
 * Salida: importe financiado, cuota francesa, totales y tabla anual.
 *
 * No se modela Euríbor, tipo variable, seguros, comisiones ni vinculaciones.
 */
import { cuadroFrances } from './amortizacion.ts';
import { formatearEntero } from './numero.ts';
import type { ErrorCampo, Respuesta, ResultadoHipoteca } from './tipos.ts';

export const LIMITES_HIPOTECA = {
  precioMin: 30000,
  precioMax: 1500000,
  plazoMin: 5,
  plazoMax: 40,
  tinMin: 0,
  tinMax: 10,
} as const;

const eur = (n: number): string => `${formatearEntero(n)} €`;

export function validarHipoteca(entrada: {
  precio: number;
  entrada: number;
  plazoAnios: number;
  tinAnual: number;
}): ErrorCampo[] {
  const errores: ErrorCampo[] = [];
  const L = LIMITES_HIPOTECA;

  if (!Number.isFinite(entrada.precio) || entrada.precio < L.precioMin || entrada.precio > L.precioMax)
    errores.push({ campo: 'precio', mensaje: `Escribe un precio entre ${eur(L.precioMin)} y ${eur(L.precioMax)}.` });

  if (!Number.isFinite(entrada.entrada) || entrada.entrada < 0)
    errores.push({ campo: 'entrada', mensaje: 'Escribe una entrada de 0 € o más.' });
  else if (Number.isFinite(entrada.precio) && entrada.entrada >= entrada.precio)
    errores.push({ campo: 'entrada', mensaje: 'La entrada debe ser menor que el precio: si no, no hay hipoteca que calcular.' });

  if (
    !Number.isFinite(entrada.plazoAnios) ||
    !Number.isInteger(entrada.plazoAnios) ||
    entrada.plazoAnios < L.plazoMin ||
    entrada.plazoAnios > L.plazoMax
  )
    errores.push({ campo: 'plazoAnios', mensaje: `Escribe un plazo entero en años, de ${L.plazoMin} a ${L.plazoMax}.` });

  if (!Number.isFinite(entrada.tinAnual) || entrada.tinAnual < L.tinMin || entrada.tinAnual > L.tinMax)
    errores.push({ campo: 'tinAnual', mensaje: `Escribe un TIN anual fijo entre ${L.tinMin} % y ${L.tinMax} %.` });

  return errores;
}

export function calcularHipoteca(entrada: {
  precio: number;
  entrada: number;
  plazoAnios: number;
  tinAnual: number;
}): Respuesta<ResultadoHipoteca> {
  const errores = validarHipoteca(entrada);
  if (errores.length > 0) return { ok: false, errores };

  const importe = entrada.precio - entrada.entrada;
  const cuadro = cuadroFrances(importe, entrada.tinAnual, entrada.plazoAnios * 12);
  return { ok: true, resultado: { ...cuadro, importe, ltv: importe / entrada.precio } };
}
