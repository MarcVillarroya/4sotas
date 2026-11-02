/**
 * Amortización por el sistema francés (cuota constante).
 *
 * Fórmula (docs/FINANZAS.md §2):
 *   i = TIN / 100 / 12
 *   cuota = P · i / (1 − (1 + i)^−n)   y   cuota = P / n si i = 0
 *   intereses del mes = capital pendiente · i
 *   amortización del mes = cuota − intereses del mes
 *
 * Redondeo: aquí no se redondea. La última cuota ajusta el capital pendiente a cero para
 * que la tabla cierre exactamente; el céntimo se aplica al presentar (`formatearEuros`).
 */
import type { CuadroAmortizacion, FilaAnual } from './tipos.ts';

/** Cuota constante del sistema francés. Lanza solo ante errores de programación. */
export function cuotaFrancesa(principal: number, tinAnual: number, meses: number): number {
  if (!Number.isFinite(principal) || !Number.isFinite(tinAnual) || !Number.isInteger(meses) || meses <= 0) {
    throw new Error('Entrada inválida para la cuota francesa');
  }
  const i = tinAnual / 100 / 12;
  if (i === 0) return principal / meses;
  return (principal * i) / (1 - Math.pow(1 + i, -meses));
}

/** Cuadro francés con el agregado anual que se publica en la tabla. */
export function cuadroFrances(principal: number, tinAnual: number, meses: number): CuadroAmortizacion {
  const cuota = cuotaFrancesa(principal, tinAnual, meses);
  const i = tinAnual / 100 / 12;
  const tabla: FilaAnual[] = [];
  let pendiente = principal;
  let interesesAnio = 0;
  let amortizadoAnio = 0;
  let cuotasAnio = 0;

  for (let mes = 1; mes <= meses; mes++) {
    const interesesMes = pendiente * i;
    let amortizacionMes = cuota - interesesMes;
    if (mes === meses) amortizacionMes = pendiente; // cierre exacto
    pendiente -= amortizacionMes;
    if (mes === meses) pendiente = 0;

    interesesAnio += interesesMes;
    amortizadoAnio += amortizacionMes;
    cuotasAnio += 1;

    if (mes % 12 === 0 || mes === meses) {
      tabla.push({
        anio: Math.ceil(mes / 12),
        cuotas: cuotasAnio,
        intereses: interesesAnio,
        amortizado: amortizadoAnio,
        pendiente,
      });
      interesesAnio = 0;
      amortizadoAnio = 0;
      cuotasAnio = 0;
    }
  }

  const total = cuota * meses;
  return { principal, meses, cuota, intereses: total - principal, total, tabla };
}
