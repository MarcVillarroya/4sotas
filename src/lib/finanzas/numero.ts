/**
 * Números de entrada y de presentación de las calculadoras financieras.
 *
 * El motor trabaja con `number` sin redondear. Aquí viven las dos fronteras:
 *  - `parsearNumero`: texto del formulario → número (`NaN` si no hay número).
 *  - `formatear*`: número → texto es-ES. Redondeo solo al presentar.
 */

/**
 * `'5,25'`, `'5.25'`, `'1.234,56'`, `'1 000 €'`, `'7 %'` → número.
 * `''`, `'abc'`, `'Infinity'` → `NaN` (nunca `Infinity`, para que la validación lo rechace).
 * Convención es-ES: si aparece coma, es el separador decimal y los puntos son de millar.
 */
export const parsearNumero = (texto: string): number => {
  let limpio = String(texto)
    .trim()
    .replace(/[€%\s\u00A0\u202F]/g, '');
  if (limpio === '') return Number.NaN;
  limpio = limpio.includes(',') ? limpio.replace(/\./g, '').replace(',', '.') : limpio;
  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : Number.NaN;
};

/** Redondeo al céntimo, sin arrastrar el error binario de `1.005`. */
export const redondearCentimos = (valor: number): number => Math.round((valor + Number.EPSILON) * 100) / 100;

const EUR = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** `297.0166…` → `'297,02 €'`. */
export const formatearEuros = (valor: number): string => EUR.format(redondearCentimos(valor));

/** `0.2811` → `'28,11 %'`. */
export const formatearPorcentaje = (fraccion: number, decimales = 2): string =>
  `${(fraccion * 100).toLocaleString('es-ES', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })} %`;

/** `21000` → `'21.000'`. Para ayudas y rangos, sin símbolo de moneda. */
export const formatearEntero = (valor: number): string => valor.toLocaleString('es-ES', { maximumFractionDigits: 0 });
