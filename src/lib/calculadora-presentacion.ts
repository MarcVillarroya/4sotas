/**
 * Presentación de la calculadora: de números del motor a texto que lee una persona.
 *
 * El motor (`calculadora.ts`) no sabe nada de euros con formato, ni de «cada mes», ni de
 * enlaces: devuelve coma flotante y filas. Aquí vive la traducción a lo visible, y aquí se
 * puede probar sin navegador (tests/calculadora-presentacion.test.ts): si una cifra cambia
 * de aspecto, el fallo se ve en una prueba, no en una captura.
 *
 * Regla: este módulo NO calcula. Solo formatea y elige palabras. Cualquier aritmética que
 * aparezca aquí sería un segundo motor y una fuente de discrepancias.
 */
import {
  FRECUENCIAS,
  formatearEuros,
  formatearPorcentaje,
  type ClaveFrecuencia,
  type ErrorCalculo,
  type EntradaCalculo,
  type FilaPeriodo,
  type ResultadoCalculo,
} from './calculadora.ts';
import { ruta } from './rutas.ts';

/** Importes redondos para textos de ayuda: `1000` → `1000` (es-ES no agrupa cuatro cifras). */
export const miles = (n: number): string => n.toLocaleString('es-ES', { maximumFractionDigits: 0 });

/** Nombre de la aportación según la frecuencia: «cada mes», «cada trimestre»… */
export const nombrePeriodo = (clave: ClaveFrecuencia): string => {
  const f = FRECUENCIAS.find((x) => x.clave === clave);
  if (!f) return 'periodo';
  return f.mesesPorPeriodo === 12 ? 'año' : f.mesesPorPeriodo === 1 ? 'mes' : f.mesesPorPeriodo === 3 ? 'trimestre' : 'semestre';
};

/** `10, 0` → «10 años»; `0, 6` → «6 meses»; `10, 6` → «10 años y 6 meses». */
export const textoPlazo = (anios: number, meses: number): string => {
  const partes: string[] = [];
  if (anios > 0) partes.push(`${anios} ${anios === 1 ? 'año' : 'años'}`);
  if (meses > 0) partes.push(`${meses} ${meses === 1 ? 'mes' : 'meses'}`);
  if (partes.length === 0) return 'sin plazo';
  return partes.join(' y ');
};

/**
 * Una línea que resume qué se ha simulado, en el idioma de quien lo ha escrito.
 * Es el texto que se anuncia y el que queda bajo la cifra grande.
 */
export const resumenEntrada = (entrada: EntradaCalculo, resultado: ResultadoCalculo): string => {
  const periodo = nombrePeriodo(entrada.frecuencia);
  const plazo = textoPlazo(entrada.anios, entrada.meses);
  const tasa = formatearPorcentaje(resultado.tasaEfectivaAnual);

  if (entrada.capitalInicial > 0 && entrada.aportacionPeriodica > 0) {
    return `${miles(entrada.capitalInicial)} € de partida más ${miles(
      entrada.aportacionPeriodica,
    )} € cada ${periodo}, durante ${plazo}, con una rentabilidad del ${tasa} anual.`;
  }
  if (entrada.aportacionPeriodica > 0) {
    return `${miles(entrada.aportacionPeriodica)} € cada ${periodo}, durante ${plazo}, con una rentabilidad del ${tasa} anual.`;
  }
  return `${miles(entrada.capitalInicial)} € de partida, durante ${plazo}, con una rentabilidad del ${tasa} anual.`;
};

/** Ids de las cuatro métricas, en orden. Contrato estable entre plantilla, script y pruebas. */
export const IDS_METRICAS = ['total-aportado', 'total-ganancia', 'tasa-periodo', 'valor-real'] as const;

export type IdMetrica = (typeof IDS_METRICAS)[number];

export interface Metrica {
  /** Id del nodo que la interfaz actualiza. Contrato con el componente y su script. */
  id: IdMetrica;
  etiqueta: string;
  valor: string;
  /** Ayuda corta bajo la cifra; explica la unidad, no el proceso interno. */
  ayuda: string;
}

/** Las cuatro métricas del resultado, en el mismo orden y con los mismos ids que el DOM. */
export const metricasVisibles = (resultado: ResultadoCalculo): Metrica[] => [
  {
    id: 'total-aportado',
    etiqueta: 'Capital aportado',
    valor: formatearEuros(resultado.aportado),
    ayuda: 'Lo que sale de tu bolsillo: capital inicial más todas las aportaciones.',
  },
  {
    id: 'total-ganancia',
    etiqueta: 'Interés generado',
    valor: formatearEuros(resultado.ganancia),
    ayuda: 'Capital final menos lo aportado. Es la parte que produce la rentabilidad.',
  },
  {
    id: 'tasa-periodo',
    etiqueta: 'Tasa de cada periodo',
    valor: formatearPorcentaje(resultado.tasaPeriodo, 4),
    ayuda: 'El porcentaje anual repartido en cada periodo de capitalización.',
  },
  {
    id: 'valor-real',
    etiqueta: 'En euros de hoy',
    valor: resultado.valorReal === null ? 'Sin inflación' : formatearEuros(resultado.valorReal),
    ayuda: 'El capital final descontando la inflación que hayas indicado.',
  },
];

/** Anuncio para el `aria-live`: una frase, con las tres cifras que importan. */
export const textoAnuncio = (resultado: ResultadoCalculo): string =>
  `Resultado actualizado. Capital final ${formatearEuros(resultado.capitalFinal)}, ${formatearEuros(
    resultado.aportado,
  )} aportados e ${formatearEuros(resultado.ganancia)} de intereses.`;

/** Estado neutro tras editar: ni resultado viejo ni error, solo qué falta. */
export const TEXTO_RETIRADO = 'Los datos han cambiado. Pulsa Calcular para ver el resultado.';

/** Estado vacío/erróneo: qué bloquea el cálculo, en una frase sin jerga. */
export const textoError = (errores: ErrorCalculo[]): string => {
  if (errores.length === 0) return 'Para calcular, revisa los datos.';
  if (errores.length === 1) return `Para calcular, revisa esto: ${errores[0].mensaje}`;
  return `Para calcular, revisa esto: ${errores[0].mensaje} Hay ${errores.length - 1} ${
    errores.length === 2 ? 'dato más que revisar' : 'datos más que revisar'
  }.`;
};

export interface FilaVisible {
  anio: number;
  aportado: string;
  interes: string;
  capital: string;
}

/** Filas de la tabla ya formateadas; el componente y el script pintan lo mismo. */
export const filasVisibles = (filas: FilaPeriodo[]): FilaVisible[] =>
  filas.map((fila) => ({
    anio: fila.anio,
    aportado: formatearEuros(fila.aportadoAcumulado),
    interes: formatearEuros(fila.interesAcumulado),
    capital: formatearEuros(fila.capital),
  }));

/**
 * Supuestos en lenguaje de usuario. No repiten la ficha técnica (fórmula, tasa efectiva):
 * explican lo que la cifra asume para que nadie la lea como una previsión.
 */
export const SUPUESTOS_CLAVE: { titulo: string; texto: string }[] = [
  {
    titulo: 'La rentabilidad es tu hipótesis',
    texto: 'Se mantiene igual todo el plazo. Un 5 % anual constante no existe en la realidad: sirve para entender el mecanismo.',
  },
  {
    titulo: 'Los intereses se quedan dentro',
    texto: 'Cada periodo se suman al capital y vuelven a generar intereses. Eso es lo que hace crecer la bola.',
  },
  {
    titulo: 'Aportas siempre lo mismo',
    texto: 'La aportación se repite sin subidas, pausas ni rescates, al principio o al final de cada periodo.',
  },
  {
    titulo: 'Sin comisiones ni impuestos',
    texto: 'Esta cuenta no los incluye. Si tu producto los tiene, el resultado real será menor que esta cifra.',
  },
  {
    titulo: 'La inflación solo cambia la lectura',
    texto: 'Si la rellenas, la cifra se expresa en euros de hoy; no altera el capital final simulado.',
  },
];

export interface DestinoAprender {
  tipo: 'Guía' | 'Vídeo' | 'Glosario';
  /** Colección de la que sale el título real; nunca se escribe a mano en la plantilla. */
  coleccion: 'articulos' | 'videos' | 'glosario';
  slug: string;
  /** Ruta interna SIN la base del despliegue: la plantilla la envuelve con `url()`. */
  href: string;
  /** Qué aporta, en una línea propia. */
  linea: string;
}

/**
 * Enlaces educativos del resultado. Se declaran por slug para que el título, la duración y
 * la definición salgan de la colección; si una entrada desaparece, la tarjeta no se pinta.
 */
export const DESTINOS_APRENDER: DestinoAprender[] = [
  {
    tipo: 'Guía',
    coleccion: 'articulos',
    slug: 'dca-interes-compuesto',
    href: ruta.guia('dca-interes-compuesto'),
    linea: 'La fórmula con aportaciones periódicas, con ejemplos y sus límites.',
  },
  {
    tipo: 'Vídeo',
    coleccion: 'videos',
    slug: 'deuda-o-inversion-1000',
    href: ruta.video('deuda-o-inversion-1000'),
    linea: 'Amortizar deuda o invertir: el mismo dilema, en menos de un minuto.',
  },
  {
    tipo: 'Glosario',
    coleccion: 'glosario',
    slug: 'tae',
    href: ruta.termino('tae'),
    linea: 'Por qué el 5 % que escribes es una tasa anual equivalente y no un tipo nominal.',
  },
  {
    tipo: 'Glosario',
    coleccion: 'glosario',
    slug: 'dca-aportacion-periodica',
    href: ruta.termino('dca-aportacion-periodica'),
    linea: 'Qué significa aportar siempre la misma cantidad, y qué no garantiza.',
  },
];
