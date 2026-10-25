/**
 * Aislamiento de borradores: una sola definición de "publicado" (VALIDATION.md §4).
 *
 * `publicados()` es la regla real: `status === 'publicado'`.
 * `visibles()` es lo que usan las plantillas y añade una única excepción explícita:
 * el build de fixtures (`PUBLIC_FIXTURES=1`), que sirve para verificar plantillas con
 * datos de prueba. Ese build nunca es el artefacto publicado y el validador lo demuestra:
 * con el build normal, cualquier borrador con página en `dist/` es bloqueante
 * (`B-DRAFT-EN-DIST`).
 */
export type ConEstado = { data: { status: string } };

export const publicados = <T extends ConEstado>(entries: readonly T[]): T[] =>
  entries.filter((e) => e.data.status === 'publicado');

/**
 * Interruptor de fixtures. Solo lo activa `npm run build:fixtures`; en el build público
 * la variable no existe y `visibles()` equivale a `publicados()`.
 */
export const INCLUIR_BORRADORES = import.meta.env?.PUBLIC_FIXTURES === '1';

/** Entradas que puede renderizar el build actual (publicadas, o todas en modo fixtures). */
export const visibles = <T extends ConEstado>(entries: readonly T[]): T[] =>
  INCLUIR_BORRADORES ? [...entries] : publicados(entries);

export const porFechaDesc = <T extends { data: { publicado?: Date } }>(a: T, b: T): number =>
  (b.data.publicado?.getTime() ?? 0) - (a.data.publicado?.getTime() ?? 0);

export const cuentaPublicada = (entries: readonly ConEstado[]): number => publicados(entries).length;

/** Id de una referencia del modelo (Astro 7 la resuelve como `{ id, collection }` o string). */
export type Referencia = string | { id: string } | undefined | null;

export const idRef = (ref: Referencia): string | undefined => {
  if (!ref) return undefined;
  return typeof ref === 'string' ? ref : ref.id;
};

/**
 * Resuelve una lista de referencias a entradas visibles, en el orden declarado.
 * Las referencias a borradores se descartan: un enlace interno nunca apunta a algo que
 * el build actual no ha generado (sería un enlace roto).
 */
export const resolver = <T extends { id: string }>(
  refs: readonly Referencia[] | undefined,
  disponibles: readonly T[],
): T[] => {
  if (!refs?.length) return [];
  const porId = new Map(disponibles.map((e) => [e.id, e]));
  return refs.map(idRef).flatMap((id) => {
    const hit = id ? porId.get(id) : undefined;
    return hit ? [hit] : [];
  });
};
