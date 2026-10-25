/**
 * Aislamiento de borradores: una sola definición de "publicado".
 * Toda ruta e índice filtra por aquí (VALIDATION.md §4).
 */
export type ConEstado = { data: { status: string } };

export const publicados = <T extends ConEstado>(entries: readonly T[]): T[] =>
  entries.filter((e) => e.data.status === 'publicado');

export const porFechaDesc = <T extends { data: { publicado?: Date } }>(a: T, b: T): number =>
  (b.data.publicado?.getTime() ?? 0) - (a.data.publicado?.getTime() ?? 0);

export const cuentaPublicada = (entries: readonly ConEstado[]): number => publicados(entries).length;
