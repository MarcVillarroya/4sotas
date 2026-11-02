/**
 * Tipos del motor financiero de Sota de Oros.
 *
 * Contrato (docs/FINANZAS.md):
 *  - El motor es puro: sin DOM, sin `window`, sin red y sin estado global.
 *  - Los errores de datos del formulario se devuelven como valor (`Respuesta`), nunca
 *    lanzando excepciones. Las excepciones quedan para errores de programación.
 *  - Los números viajan sin redondear; el redondeo es cosa de la presentación.
 */

/** Un error de un campo del formulario, listo para pintarse junto al control. */
export interface ErrorCampo {
  campo: string;
  mensaje: string;
}

/** Resultado de un cálculo: o el resultado, o la lista completa de errores. */
export type Respuesta<T> = { ok: true; resultado: T } | { ok: false; errores: ErrorCampo[] };

/** Fila del cuadro anual de amortización (no mensual: la tabla pública es anual). */
export interface FilaAnual {
  anio: number;
  /** Cuotas incluidas en el año (12 salvo el último tramo parcial). */
  cuotas: number;
  /** Intereses del año, sin redondear. */
  intereses: number;
  /** Capital amortizado en el año, sin redondear. */
  amortizado: number;
  /** Capital pendiente al cierre del año, sin redondear. */
  pendiente: number;
}

/** Cuadro francés completo: cuota constante, totales y agregado anual. */
export interface CuadroAmortizacion {
  principal: number;
  meses: number;
  cuota: number;
  intereses: number;
  total: number;
  tabla: FilaAnual[];
}

/** Entrada de la calculadora de préstamo. */
export interface EntradaPrestamo {
  importe: number;
  meses: number;
  tinAnual: number;
  comisionPct: number;
}

export interface ResultadoPrestamo extends CuadroAmortizacion {
  /** Comisión de apertura en euros (0 si no hay). */
  comision: number;
  /** Capital realmente recibido: importe − comisión. */
  principalNeto: number;
  /** TAE calculada desde el flujo; `null` si el flujo no tiene solución. */
  tae: number | null;
}

/** Entrada de la calculadora de hipoteca fija. */
export interface EntradaHipoteca {
  precio: number;
  entrada: number;
  plazoAnios: number;
  tinAnual: number;
}

export interface ResultadoHipoteca extends CuadroAmortizacion {
  /** Importe financiado: precio − entrada. */
  importe: number;
  /** Relación importe / precio, en fracción (0,8 = 80 %). */
  ltv: number;
}

/** Entrada de la calculadora de viabilidad. */
export interface EntradaViabilidad {
  precio: number;
  ahorro: number;
  entrada: number;
  gastosPct: number;
  plazoAnios: number;
  tinAnual: number;
  ingresos: number;
  otrasDeudas: number;
}

export type Veredicto = 'holgado' | 'justo' | 'no-encaja';

export interface ResultadoViabilidad {
  /** Hipoteca necesaria: precio − entrada. */
  hipoteca: number;
  ltv: number;
  /** Gastos de compra estimados en euros (precio × gastosPct). */
  gastos: number;
  /** Ahorro − entrada − gastos. Negativo = no llega. */
  efectivo: number;
  cuota: number;
  /** Cuota con TIN + 2 puntos porcentuales. */
  cuotaEstres: number;
  /** (cuota + otras deudas) / ingresos. */
  dti: number;
  /** Igual que `dti` con la cuota de estrés. */
  dtiEstres: number;
  /** Ingresos netos mensuales que dejan la cuota + deudas en el 35 %. */
  ingresosMinimos: number;
  veredicto: Veredicto;
  /** Motivos legibles de los umbrales que no se cumplen (vacío si es holgado). */
  motivos: string[];
  tabla: FilaAnual[];
}
