/**
 * Viabilidad de hipoteca: encaje aritmético con los datos del usuario.
 *
 * No es una aprobación bancaria ni una probabilidad: es una comparación de la cuota y el
 * efectivo con umbrales explícitos, declarados como práctica de mercado (docs/FINANZAS.md §5).
 *
 * Cuentas:
 *   gastos      = precio · gastosPct / 100
 *   hipoteca    = precio − entrada
 *   LTV         = hipoteca / precio
 *   cuota       = sistema francés con el TIN introducido
 *   cuotaEstrés = la misma cuota con TIN + 2 puntos
 *   efectivo    = ahorro − entrada − gastos
 *   DTI         = (cuota + otras deudas) / ingresos netos mensuales
 *   ingresosMin = (cuota + otras deudas) / 0,35
 */
import { cuadroFrances } from './amortizacion.ts';
import { formatearEntero } from './numero.ts';
import type { ErrorCampo, Respuesta, ResultadoViabilidad, Veredicto } from './tipos.ts';

export const LIMITES_VIABILIDAD = {
  precioMin: 30000,
  precioMax: 1500000,
  ahorroMax: 1500000,
  gastosMin: 0,
  gastosMax: 20,
  plazoMin: 5,
  plazoMax: 40,
  tinMin: 0,
  tinMax: 10,
  ingresosMin: 500,
  ingresosMax: 20000,
  deudasMax: 10000,
} as const;

/** Umbrales del veredicto. Práctica de mercado, no norma legal. */
export const UMBRALES = {
  holgado: { ltv: 0.8, dti: 0.35, dtiEstres: 0.4, colchonCuotas: 6 },
  justo: { ltv: 0.9, dti: 0.4, dtiEstres: 0.45, colchonCuotas: 3 },
} as const;

/** Puntos porcentuales de la prueba de estrés. */
export const ESTRES_PUNTOS = 2;

/** Referencia de endeudamiento usada para los ingresos mínimos. */
export const DTI_REFERENCIA = 0.35;

export const ETIQUETA_VEREDICTO: Record<Veredicto, string> = {
  holgado: 'Holgado',
  justo: 'Justo',
  'no-encaja': 'No encaja',
};

const eur = (n: number): string => `${formatearEntero(n)} €`;

export function validarViabilidad(entrada: {
  precio: number;
  ahorro: number;
  entrada: number;
  gastosPct: number;
  plazoAnios: number;
  tinAnual: number;
  ingresos: number;
  otrasDeudas: number;
}): ErrorCampo[] {
  const errores: ErrorCampo[] = [];
  const L = LIMITES_VIABILIDAD;

  if (!Number.isFinite(entrada.precio) || entrada.precio < L.precioMin || entrada.precio > L.precioMax)
    errores.push({ campo: 'precio', mensaje: `Escribe un precio entre ${eur(L.precioMin)} y ${eur(L.precioMax)}.` });

  if (!Number.isFinite(entrada.ahorro) || entrada.ahorro < 0 || entrada.ahorro > L.ahorroMax)
    errores.push({ campo: 'ahorro', mensaje: `Escribe un ahorro entre 0 € y ${eur(L.ahorroMax)}.` });

  if (!Number.isFinite(entrada.entrada) || entrada.entrada < 0)
    errores.push({ campo: 'entrada', mensaje: 'Escribe una entrada de 0 € o más.' });
  else if (Number.isFinite(entrada.precio) && entrada.entrada >= entrada.precio)
    errores.push({ campo: 'entrada', mensaje: 'La entrada debe ser menor que el precio para que quede hipoteca.' });

  if (!Number.isFinite(entrada.gastosPct) || entrada.gastosPct < L.gastosMin || entrada.gastosPct > L.gastosMax)
    errores.push({
      campo: 'gastosPct',
      mensaje: `Escribe un porcentaje de gastos entre ${L.gastosMin} % y ${L.gastosMax} % del precio.`,
    });

  if (
    !Number.isFinite(entrada.plazoAnios) ||
    !Number.isInteger(entrada.plazoAnios) ||
    entrada.plazoAnios < L.plazoMin ||
    entrada.plazoAnios > L.plazoMax
  )
    errores.push({ campo: 'plazoAnios', mensaje: `Escribe un plazo entero en años, de ${L.plazoMin} a ${L.plazoMax}.` });

  if (!Number.isFinite(entrada.tinAnual) || entrada.tinAnual < L.tinMin || entrada.tinAnual > L.tinMax)
    errores.push({ campo: 'tinAnual', mensaje: `Escribe un TIN anual entre ${L.tinMin} % y ${L.tinMax} %.` });

  if (!Number.isFinite(entrada.ingresos) || entrada.ingresos < L.ingresosMin || entrada.ingresos > L.ingresosMax)
    errores.push({
      campo: 'ingresos',
      mensaje: `Escribe los ingresos netos mensuales del hogar, de ${eur(L.ingresosMin)} a ${eur(L.ingresosMax)}.`,
    });

  if (!Number.isFinite(entrada.otrasDeudas) || entrada.otrasDeudas < 0 || entrada.otrasDeudas > L.deudasMax)
    errores.push({ campo: 'otrasDeudas', mensaje: `Escribe otras deudas mensuales entre 0 € y ${eur(L.deudasMax)}.` });

  return errores;
}

export function calcularViabilidad(entrada: {
  precio: number;
  ahorro: number;
  entrada: number;
  gastosPct: number;
  plazoAnios: number;
  tinAnual: number;
  ingresos: number;
  otrasDeudas: number;
}): Respuesta<ResultadoViabilidad> {
  const errores = validarViabilidad(entrada);
  if (errores.length > 0) return { ok: false, errores };

  const meses = entrada.plazoAnios * 12;
  const gastos = (entrada.precio * entrada.gastosPct) / 100;
  const hipoteca = entrada.precio - entrada.entrada;
  const ltv = hipoteca / entrada.precio;
  const cuadro = cuadroFrances(hipoteca, entrada.tinAnual, meses);
  const cuotaEstres = cuadroFrances(hipoteca, entrada.tinAnual + ESTRES_PUNTOS, meses).cuota;
  const efectivo = entrada.ahorro - entrada.entrada - gastos;
  const dti = (cuadro.cuota + entrada.otrasDeudas) / entrada.ingresos;
  const dtiEstres = (cuotaEstres + entrada.otrasDeudas) / entrada.ingresos;
  const ingresosMinimos = (cuadro.cuota + entrada.otrasDeudas) / DTI_REFERENCIA;

  const U = UMBRALES;
  const cumpleHolgado =
    ltv <= U.holgado.ltv &&
    dti <= U.holgado.dti &&
    dtiEstres <= U.holgado.dtiEstres &&
    efectivo >= U.holgado.colchonCuotas * cuadro.cuota;
  const cumpleJusto =
    ltv <= U.justo.ltv &&
    dti <= U.justo.dti &&
    dtiEstres <= U.justo.dtiEstres &&
    efectivo >= U.justo.colchonCuotas * cuadro.cuota;

  const veredicto: Veredicto =
    efectivo < 0 ? 'no-encaja' : cumpleHolgado ? 'holgado' : cumpleJusto ? 'justo' : 'no-encaja';

  const motivos: string[] = [];
  if (efectivo < 0) motivos.push('Con este ahorro no se cubren la entrada y los gastos de la compra.');
  if (veredicto !== 'holgado') {
    if (ltv > U.holgado.ltv) motivos.push(`El LTV supera el ${Math.round(U.holgado.ltv * 100)} %.`);
    if (dti > U.holgado.dti) motivos.push(`La cuota y las deudas superan el ${Math.round(U.holgado.dti * 100)} % de los ingresos.`);
    if (dtiEstres > U.holgado.dtiEstres)
      motivos.push(`Con ${ESTRES_PUNTOS} puntos más de tipo, la deuda supera el ${Math.round(U.holgado.dtiEstres * 100)} % de los ingresos.`);
    if (efectivo >= 0 && efectivo < U.holgado.colchonCuotas * cuadro.cuota)
      motivos.push(`Quedan menos de ${U.holgado.colchonCuotas} cuotas de colchón tras la compra.`);
  }

  return {
    ok: true,
    resultado: {
      hipoteca,
      ltv,
      gastos,
      efectivo,
      cuota: cuadro.cuota,
      cuotaEstres,
      dti,
      dtiEstres,
      ingresosMinimos,
      veredicto,
      motivos,
      tabla: cuadro.tabla,
    },
  };
}
