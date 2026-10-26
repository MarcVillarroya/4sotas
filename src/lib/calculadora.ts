/**
 * Motor de interés compuesto · V1 (version 1.0.0).
 *
 * Funciones puras: sin DOM, sin estado global, sin envío de datos. La interfaz
 * (`src/pages/oros/herramientas/interes-compuesto.astro`) solo traduce formulario a
 * `EntradaCalculo` y pinta `ResultadoCalculo`.
 *
 * CONVENCIÓN DE TASA (decisión, ver docs/CALCULADORA.md §2)
 *   La rentabilidad que introduce la persona usuaria es una TASA EFECTIVA ANUAL (EA):
 *   el 5 % significa que 100 € se convierten en 105 € al cabo de un año, se capitalice
 *   como se capitalice. No es un tipo nominal, así que NO se divide entre la frecuencia.
 *   La tasa por periodo se obtiene por conversión efectiva explícita:
 *       i = (1 + r)^(1/m) - 1        con m = periodos de capitalización por año
 *   Consecuencia comprobada en las pruebas: un capital único al 5 % EA da el mismo
 *   capital final con capitalización anual que mensual (1628,8946…), porque el 5 % es
 *   efectivo y no nominal.
 *
 * CONVENCIÓN DE APORTACIÓN
 *   La aportación es POR PERIODO de capitalización, no mensual genérica: si la
 *   frecuencia es trimestral, la aportación se ingresa cada trimestre. El momento
 *   («inicio» o «fin» del periodo) decide si esa aportación devenga el interés del
 *   periodo en el que entra.
 *
 * REDONDEO
 *   El motor no redondea: devuelve coma flotante de doble precisión y es la capa de
 *   presentación la que redondea al céntimo (`redondearCentimos`, `formatearEuros`).
 *   Redondear dentro del bucle introduciría error acumulado y rompería la igualdad
 *   entre la última fila de la tabla y el capital final.
 */

/** Frecuencias de capitalización soportadas. La aportación periódica usa la misma. */
export const FRECUENCIAS = [
  { clave: 'anual', etiqueta: 'Anual', periodosPorAnio: 1, mesesPorPeriodo: 12 },
  { clave: 'semestral', etiqueta: 'Semestral', periodosPorAnio: 2, mesesPorPeriodo: 6 },
  { clave: 'trimestral', etiqueta: 'Trimestral', periodosPorAnio: 4, mesesPorPeriodo: 3 },
  { clave: 'mensual', etiqueta: 'Mensual', periodosPorAnio: 12, mesesPorPeriodo: 1 },
] as const;

export type ClaveFrecuencia = (typeof FRECUENCIAS)[number]['clave'];

/** Momento de la aportación dentro de cada periodo de capitalización. */
export type MomentoAportacion = 'inicio' | 'fin';

/**
 * Límites declarados en la ficha de la herramienta (`herr-interes-compuesto`).
 * Existen para que el motor no acepte entradas que no puede representar con sentido
 * (60 años al 30 % son cifras astronómicas, no un plan financiero) y para acotar el
 * tamaño de la tabla a algo que una página pueda renderizar.
 */
export const LIMITES = {
  capitalMax: 1_000_000,
  aportacionMax: 20_000,
  aniosMax: 60,
  periodosMax: 720,
  tasaMin: -20,
  tasaMax: 30,
  inflacionMin: -5,
  inflacionMax: 20,
} as const;

export interface EntradaCalculo {
  /** Capital inicial en euros. */
  capitalInicial: number;
  /** Aportación por periodo de capitalización, en euros. */
  aportacionPeriodica: number;
  /** Años completos del plazo (entero ≥ 0). */
  anios: number;
  /** Meses sueltos que se suman a los años (entero 0–11). */
  meses: number;
  /** Rentabilidad anual hipotética, en % efectivo anual (5 = 5 %). */
  rentabilidadAnual: number;
  frecuencia: ClaveFrecuencia;
  momentoAportacion: MomentoAportacion;
  /** Inflación anual hipotética en % EA. `null`/`undefined` = no se calcula valor real. */
  inflacionAnual?: number | null;
}

export interface FilaPeriodo {
  /** Número de periodo de capitalización, empezando en 1. */
  periodo: number;
  /** Meses transcurridos al cerrar el periodo. */
  meses: number;
  /** Año natural al que pertenece el cierre de ese periodo (1 = primer año). */
  anio: number;
  /** Capital inicial + aportaciones hechas hasta este periodo (sin intereses). */
  aportadoAcumulado: number;
  /** Interés generado solo en este periodo. */
  interesPeriodo: number;
  /** Interés acumulado desde el inicio. */
  interesAcumulado: number;
  /** Capital al cierre del periodo (aportado + interés acumulado). */
  capital: number;
}

export interface ResultadoCalculo {
  /** Número de periodos de capitalización del plazo. */
  periodos: number;
  /** Meses totales del plazo. */
  meses: number;
  mesesPorPeriodo: number;
  periodosPorAnio: number;
  /** Tasa por periodo en fracción (0,004074… para 5 % EA mensual). */
  tasaPeriodo: number;
  /** Rentabilidad efectiva anual en fracción, eco de la entrada. */
  tasaEfectivaAnual: number;
  capitalInicial: number;
  aportacionPeriodica: number;
  /** Capital inicial + todas las aportaciones. */
  aportado: number;
  capitalFinal: number;
  /** Capital final − aportado. */
  ganancia: number;
  /** Capital final expresado en euros de hoy; `null` si no hay inflación. */
  valorReal: number | null;
  /** Valor real − aportado; `null` si no hay inflación. */
  gananciaReal: number | null;
  /** Una fila por periodo de capitalización. */
  tabla: FilaPeriodo[];
}

export interface ErrorCalculo {
  /** Campo del formulario al que se asocia el error. */
  campo: keyof EntradaCalculo | 'plazo';
  mensaje: string;
}

export type RespuestaCalculo = { ok: true; resultado: ResultadoCalculo } | { ok: false; errores: ErrorCalculo[] };

/* ─────────────────────────── conversión y utilidades ─────────────────────────── */

/** Ficha de la frecuencia pedida. Lanza si la clave no existe (entrada de API, no de formulario). */
export const frecuencia = (clave: ClaveFrecuencia) => {
  const f = FRECUENCIAS.find((x) => x.clave === clave);
  if (!f) throw new Error(`frecuencia desconocida: ${clave}`);
  return f;
};

/**
 * Tasa por periodo a partir de una tasa efectiva anual.
 * `i = (1 + r)^(1/m) - 1`. Documentada aquí y probada en tests/calculadora.test.ts.
 */
export const tasaPorPeriodo = (tasaEfectivaAnual: number, periodosPorAnio: number): number =>
  Math.pow(1 + tasaEfectivaAnual, 1 / periodosPorAnio) - 1;

/** Redondeo monetario al céntimo, medio hacia arriba, solo para presentar. */
export const redondearCentimos = (valor: number): number => {
  const signo = valor < 0 ? -1 : 1;
  return (signo * Math.round(Math.abs(valor) * 100)) / 100;
};

const EUR = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** `1628.8946` → `1.628,89 €`. Redondea al céntimo; nunca se usa para seguir calculando. */
export const formatearEuros = (valor: number): string => EUR.format(redondearCentimos(valor));

/** `0.15` → `15,00 %`. */
export const formatearPorcentaje = (fraccion: number, decimales = 2): string =>
  `${(fraccion * 100).toLocaleString('es-ES', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })} %`;

/**
 * `'5,25'` o `'5.25'` o `'1.234,56'` o `'1 000 €'` → número; `''`/basura → NaN.
 * Convención es-ES: si aparece coma, es el separador decimal y los puntos son de millar;
 * si no hay coma, el punto es decimal. Así el mismo campo acepta lo que teclea una persona
 * en España y lo que devuelve un `input type="number"` en inglés.
 */
export const parsearNumero = (texto: string): number => {
  let limpio = String(texto)
    .trim()
    .replace(/[€%\s\u00A0\u202F]/g, '');
  if (limpio === '') return Number.NaN;
  limpio = limpio.includes(',') ? limpio.replace(/\./g, '').replace(',', '.') : limpio;
  return Number(limpio);
};

/* ─────────────────────────── validación ─────────────────────────── */

const esFinito = (n: number): boolean => Number.isFinite(n);

/** Valida la entrada y devuelve TODOS los errores (no solo el primero: el formulario los pinta juntos). */
export const validarEntrada = (e: EntradaCalculo): ErrorCalculo[] => {
  const errores: ErrorCalculo[] = [];

  if (!esFinito(e.capitalInicial) || e.capitalInicial < 0 || e.capitalInicial > LIMITES.capitalMax)
    errores.push({
      campo: 'capitalInicial',
      mensaje: `Escribe un capital inicial entre 0 y ${LIMITES.capitalMax.toLocaleString('es-ES')} €.`,
    });

  if (!esFinito(e.aportacionPeriodica) || e.aportacionPeriodica < 0 || e.aportacionPeriodica > LIMITES.aportacionMax)
    errores.push({
      campo: 'aportacionPeriodica',
      mensaje: `Escribe una aportación por periodo entre 0 y ${LIMITES.aportacionMax.toLocaleString('es-ES')} €.`,
    });

  if (!esFinito(e.rentabilidadAnual) || e.rentabilidadAnual < LIMITES.tasaMin || e.rentabilidadAnual > LIMITES.tasaMax)
    errores.push({
      campo: 'rentabilidadAnual',
      mensaje: `Escribe una rentabilidad anual entre ${LIMITES.tasaMin} % y ${LIMITES.tasaMax} % (tasa efectiva anual).`,
    });

  if (!Number.isInteger(e.anios) || e.anios < 0 || e.anios > LIMITES.aniosMax)
    errores.push({ campo: 'anios', mensaje: `Escribe los años como número entero, entre 0 y ${LIMITES.aniosMax}.` });

  if (!Number.isInteger(e.meses) || e.meses < 0 || e.meses > 11)
    errores.push({ campo: 'meses', mensaje: 'Elige los meses sueltos como número entero, entre 0 y 11.' });

  const f = FRECUENCIAS.find((x) => x.clave === e.frecuencia);
  if (!f) {
    errores.push({ campo: 'frecuencia', mensaje: 'Elige una de las frecuencias disponibles.' });
    return errores;
  }
  if (e.momentoAportacion !== 'inicio' && e.momentoAportacion !== 'fin')
    errores.push({ campo: 'momentoAportacion', mensaje: 'Elige si la aportación entra al principio o al final del periodo.' });

  const inflacion = e.inflacionAnual ?? null;
  if (inflacion !== null && (!esFinito(inflacion) || inflacion < LIMITES.inflacionMin || inflacion > LIMITES.inflacionMax))
    errores.push({
      campo: 'inflacionAnual',
      mensaje: `Escribe una inflación entre ${LIMITES.inflacionMin} % y ${LIMITES.inflacionMax} %, o déjala vacía.`,
    });

  // Plazo: total de meses positivo y múltiplo exacto del periodo de capitalización.
  const mesesTotales = (Number.isInteger(e.anios) ? e.anios : 0) * 12 + (Number.isInteger(e.meses) ? e.meses : 0);
  if (mesesTotales <= 0) {
    errores.push({ campo: 'plazo', mensaje: 'El plazo debe cubrir al menos un periodo de capitalización.' });
  } else if (mesesTotales % f.mesesPorPeriodo !== 0) {
    errores.push({
      campo: 'plazo',
      mensaje: `Con capitalización ${f.etiqueta.toLowerCase()}, el plazo debe ser múltiplo de ${f.mesesPorPeriodo} ${
        f.mesesPorPeriodo === 1 ? 'mes' : 'meses'
      }.`,
    });
  } else if (mesesTotales / f.mesesPorPeriodo > LIMITES.periodosMax) {
    errores.push({
      campo: 'plazo',
      mensaje: `El plazo no puede pasar de ${LIMITES.periodosMax} periodos de capitalización.`,
    });
  }

  return errores;
};

/* ─────────────────────────── cálculo ─────────────────────────── */

/**
 * Capital al cierre del periodo `k`, en forma cerrada:
 *   C_k = P·(1+i)^k + A·((1+i)^k − 1)/i · (1+i si la aportación es al inicio del periodo)
 * con C_0 = P. Para i = 0 degenera en C_k = P + A·k (sin cociente 0/0).
 */
const capitalEnPeriodo = (p: number, a: number, i: number, k: number, inicio: boolean): number => {
  if (i === 0) return p + a * k;
  const factor = Math.pow(1 + i, k);
  const aportaciones = a * ((factor - 1) / i) * (inicio ? 1 + i : 1);
  return p * factor + aportaciones;
};

/**
 * Calcula capital final, aportaciones, ganancia y la tabla periodo a periodo.
 * Nunca lanza por entradas inválidas: devuelve `{ ok: false, errores }` para que la
 * interfaz pueda anunciarlos de forma accesible.
 */
export const calcularInteresCompuesto = (entrada: EntradaCalculo): RespuestaCalculo => {
  const errores = validarEntrada(entrada);
  if (errores.length > 0) return { ok: false, errores };

  const f = frecuencia(entrada.frecuencia);
  const meses = entrada.anios * 12 + entrada.meses;
  const periodos = meses / f.mesesPorPeriodo;
  const tasa = tasaPorPeriodo(entrada.rentabilidadAnual / 100, f.periodosPorAnio);
  const inicio = entrada.momentoAportacion === 'inicio';
  const p = entrada.capitalInicial;
  const a = entrada.aportacionPeriodica;

  const tabla: FilaPeriodo[] = [];
  let anterior = capitalEnPeriodo(p, a, tasa, 0, inicio); // = p
  let interesAcumulado = 0;
  for (let k = 1; k <= periodos; k += 1) {
    const capital = capitalEnPeriodo(p, a, tasa, k, inicio);
    const aportadoAcumulado = p + a * k;
    // Interés del periodo = aumento de capital menos la aportación que entró en él.
    const interesPeriodo = capital - anterior - a;
    interesAcumulado = capital - aportadoAcumulado;
    const mesesPeriodo = k * f.mesesPorPeriodo;
    tabla.push({
      periodo: k,
      meses: mesesPeriodo,
      anio: Math.ceil(mesesPeriodo / 12),
      aportadoAcumulado,
      interesPeriodo,
      interesAcumulado,
      capital,
    });
    anterior = capital;
  }

  const capitalFinal = tabla[tabla.length - 1].capital;
  const aportado = p + a * periodos;
  const ganancia = capitalFinal - aportado;

  const inflacion = entrada.inflacionAnual ?? null;
  const aniosDecimales = meses / 12;
  const deflactor = inflacion === null ? null : Math.pow(1 + inflacion / 100, aniosDecimales);
  const valorReal = deflactor === null ? null : capitalFinal / deflactor;

  return {
    ok: true,
    resultado: {
      periodos,
      meses,
      mesesPorPeriodo: f.mesesPorPeriodo,
      periodosPorAnio: f.periodosPorAnio,
      tasaPeriodo: tasa,
      tasaEfectivaAnual: entrada.rentabilidadAnual / 100,
      capitalInicial: p,
      aportacionPeriodica: a,
      aportado,
      capitalFinal,
      ganancia,
      valorReal,
      gananciaReal: valorReal === null ? null : valorReal - aportado,
      tabla,
    },
  };
};

/** Error de cálculo con la primera causa legible. Útil para el `aria-live` de resumen. */
export const primerErrorLegible = (errores: ErrorCalculo[]): string =>
  errores.length === 0 ? '' : errores[0].mensaje;

/**
 * Filas de la tabla de presentación: un cierre por año natural más la última fila si
 * el plazo no termina en año cerrado. Con capitalización mensual a 60 años son 60 filas
 * en vez de 720, que es lo que una tabla de página puede mostrar sin ruido.
 */
export const filasAnuales = (tabla: FilaPeriodo[]): FilaPeriodo[] => {
  const filas: FilaPeriodo[] = [];
  for (const fila of tabla) {
    const siguiente = tabla[fila.periodo]; // la tabla está indexada desde 0 con periodo 1..
    if (fila.meses % 12 === 0 || !siguiente) filas.push(fila);
  }
  return filas;
};
