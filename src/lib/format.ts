/**
 * Formato de fechas y duraciones derivado del dato, nunca escrito a mano.
 * Todas las fechas del frontmatter se parsean como instante: se formatean en UTC para que
 * `2026-10-11` no se convierta en el 10 de octubre en husos negativos.
 */

const FECHA_LARGA = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const FECHA_CORTA = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

/** `11 de octubre de 2026` */
export const fechaLarga = (fecha: Date | undefined): string => (fecha ? FECHA_LARGA.format(fecha) : '');

/** `11/10/2026` */
export const fechaCorta = (fecha: Date | undefined): string => (fecha ? FECHA_CORTA.format(fecha) : '');

/** `2026-10-11`: valor de `datetime` y de JSON-LD. */
export const fechaISO = (fecha: Date | undefined): string => (fecha ? fecha.toISOString().slice(0, 10) : '');

/** Duración ISO-8601 (`PT9M50S`) a texto legible: `9 min 50 s`. */
export const duracionLegible = (iso: string): string => {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return iso;
  const [, h, min, s] = m;
  const partes: string[] = [];
  if (h) partes.push(`${Number(h)} h`);
  if (min) partes.push(`${Number(min)} min`);
  if (s) partes.push(`${Number(s)} s`);
  return partes.length ? partes.join(' ') : '0 s';
};

/** Fecha en formato `YYYY-MM-DD` legible sin depender del huso del visitante. */
export const fechaParaMaquina = (fecha: Date | undefined): string => fechaISO(fecha);

/** Segundo de un capítulo a marca de tiempo `m:ss` / `h:mm:ss`. No inventa capítulos. */
export const marcaTiempo = (segundo: number): string => {
  const total = Math.max(0, Math.floor(segundo));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const dos = (n: number): string => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${dos(m)}:${dos(s)}` : `${m}:${dos(s)}`;
};
