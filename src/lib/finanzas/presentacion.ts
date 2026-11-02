/**
 * Textos y utilidades de presentación compartidas por las tres calculadoras.
 *
 * Se usa en dos contextos:
 *  - en build, para los textos fijos de la página (sin DOM);
 *  - dentro del `<script>` de Astro, para repintar el resultado (con DOM).
 *
 * Regla: aquí solo se redondea al formatear. Ningún cálculo financiero vive en este archivo.
 */
import { formatearEuros, formatearPorcentaje } from './numero.ts';
import type { ErrorCampo, FilaAnual } from './tipos.ts';

export const TEXTO_RETIRADO = 'Datos modificados: pulsa Calcular para ver el resultado actualizado.';
export const AVISO_CAMBIOS = 'Los datos han cambiado: pulsa Calcular para ver el resultado nuevo.';
export const AVISO_SIN_JS =
  'Tu navegador no ejecuta el cálculo: verás el ejemplo calculado al publicar la página, pero no tus propias cifras. La fórmula, los supuestos y los límites siguen a la vista.';

/** Errores → una frase para `role="status"` (no sustituye al error de cada campo). */
export const textoError = (errores: readonly ErrorCampo[]): string =>
  errores.length === 0
    ? ''
    : errores.length === 1
      ? `Hay un dato por corregir: ${errores[0]!.mensaje}`
      : `Hay ${errores.length} datos por corregir: ${errores[0]!.mensaje}`;

/** `842.21…` → `'843,21 €'` (alias semántico para las plantillas). */
export const euros = formatearEuros;
/** `0.2811` → `'28,11 %'`. */
export const porcentaje = formatearPorcentaje;

/** Celdas de una fila anual, ya formateadas. Orden = orden de columnas de la tabla. */
export const celdasFilaAnual = (fila: FilaAnual): string[] => [
  String(fila.anio),
  String(fila.cuotas),
  formatearEuros(fila.intereses),
  formatearEuros(fila.amortizado),
  formatearEuros(fila.pendiente),
];

/* ─────────────── utilidades de DOM (solo dentro del <script> del navegador) ─────────────── */

const porId = (id: string): HTMLElement | null => document.getElementById(id);

/** Valor crudo de un control, o `''` si no existe. */
export const valorDe = (id: string): string =>
  (porId(id) as HTMLInputElement | HTMLSelectElement | null)?.value ?? '';

export const escribir = (id: string, texto: string): void => {
  const nodo = porId(id);
  if (nodo) nodo.textContent = texto;
};

/** Limpia los párrafos `error-<campo>` y retira `aria-invalid`. */
export const limpiarErrores = (campos: readonly string[]): void => {
  for (const campo of campos) {
    const parrafo = porId(`error-${campo}`);
    if (parrafo) {
      parrafo.textContent = '';
      parrafo.hidden = true;
    }
    porId(campo)?.removeAttribute('aria-invalid');
  }
};

/** Pinta cada error junto a su campo y marca el control. */
export const pintarErrores = (errores: readonly ErrorCampo[]): void => {
  for (const error of errores) {
    const parrafo = porId(`error-${error.campo}`);
    if (parrafo) {
      parrafo.textContent = error.mensaje;
      parrafo.hidden = false;
    }
    porId(error.campo)?.setAttribute('aria-invalid', 'true');
  }
};

/** Aviso general del resultado (`#aviso-resultado`). */
export const mostrarAviso = (texto: string, tono: 'neutro' | 'error'): void => {
  const aviso = porId('aviso-resultado');
  if (!aviso) return;
  aviso.textContent = texto;
  aviso.dataset.tono = tono;
  aviso.hidden = false;
};

export const ocultarAviso = (): void => {
  const aviso = porId('aviso-resultado');
  if (!aviso) return;
  aviso.textContent = '';
  aviso.hidden = true;
};

/** Sustituye el cuerpo de la tabla anual; la tabla es la fuente de verdad del dato. */
export const pintarTablaAnual = (filas: readonly FilaAnual[]): void => {
  const cuerpo = porId('tabla-anual-cuerpo');
  if (!cuerpo) return;
  cuerpo.replaceChildren(
    ...filas.map((fila) => {
      const tr = document.createElement('tr');
      const [anio, cuotas, intereses, amortizado, pendiente] = celdasFilaAnual(fila);
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = anio!;
      tr.append(th);
      for (const celda of [cuotas, intereses, amortizado, pendiente]) {
        const td = document.createElement('td');
        td.textContent = celda!;
        tr.append(td);
      }
      return tr;
    }),
  );
};
