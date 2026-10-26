/**
 * Derivaciones del catálogo de vídeos.
 *
 * Regla dura: aquí no se inventa nada que la ficha no declare. El formato editorial
 * se calcula solo con la duración ISO real de la API (Short: 60 s o menos; Largo: más de 60 s)
 * y las rutas de miniatura local salen del `youtube_id`, que es el nombre del archivo.
 */

/** Duración ISO-8601 de la API (`PT9M50S`) a segundos. Devuelve 0 si no se puede leer. */
export const segundosDeDuracion = (iso: string): number => {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return 0;
  const [, h, min, s] = m;
  return Number(h ?? 0) * 3600 + Number(min ?? 0) * 60 + Number(s ?? 0);
};

/** Umbral explícito del segmento editorial: una pieza de un minuto o menos es un Short. */
export const SEGUNDOS_SHORT = 60;

/** `true` si la duración real es de 60 s o menos. No afirma que YouTube la publique como Short. */
export const esShort = (iso: string): boolean => segundosDeDuracion(iso) <= SEGUNDOS_SHORT;

export type Formato = 'Short' | 'Largo';

/** Rótulo editorial de duración derivado del dato, nunca escrito a mano. */
export const formato = (iso: string): Formato => (esShort(iso) ? 'Short' : 'Largo');

/** Duración en reloj (`0:53`, `9:50`, `1:02:05`) para el rótulo de la portada. */
export const duracionReloj = (iso: string): string => {
  const total = Math.max(0, segundosDeDuracion(iso));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const dos = (n: number): string => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${dos(m)}:${dos(s)}` : `${m}:${dos(s)}`;
};

/** Ruta local de la variante de 320×180 a partir de la de 640×360. */
export const miniatura320 = (local: string): string =>
  local.endsWith('.webp') ? `${local.slice(0, -'.webp'.length)}-320.webp` : local;

/**
 * `srcset` con las dos variantes WebP descargadas. Ambas existen en `public/assets/videos/`;
 * si faltara la de 320, el navegador pediría la de 640 y no se rompe el diseño.
 */
export const srcsetMiniatura = (local: string): string => `${miniatura320(local)} 320w, ${local} 640w`;

/** `sizes` del listado: una columna a 390, dos a 768, tres a 1440. */
export const SIZES_CATALOGO = '(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw';

/** `sizes` de una portada a ancho completo de columna (destacado y ficha). */
export const SIZES_PORTADA = '(max-width: 1000px) 100vw, 640px';
