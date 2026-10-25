/**
 * Derivación SEO: nada se escribe a mano por página (SEO-AGENT.md §2).
 * Todos los valores se obtienen del modelo o de constantes de marca.
 */
import { MARCA } from './rutas.ts';

export const LIMITE_TITULO = 65;
export const LIMITE_DESCRIPCION = 160;

const normalizar = (t: string): string => t.replace(/\s+/g, ' ').trim();

/** Recorta por palabras y añade elipsis sin superar `max` caracteres. */
export const recortar = (texto: string, max: number): string => {
  const t = normalizar(texto);
  if (t.length <= max) return t;
  const corte = t.slice(0, max - 1);
  const espacio = corte.lastIndexOf(' ');
  const base = espacio > max * 0.5 ? corte.slice(0, espacio) : corte;
  return `${base.trimEnd()}…`;
};

/**
 * Título del documento: seo.titulo ?? titulo, con sufijo de marca si cabe.
 * Nunca supera LIMITE_TITULO: primero se descarta el sufijo, después se recorta.
 */
export const tituloDocumento = (titulo: string, seoTitulo?: string, sufijo: string = ''): string => {
  const base = normalizar(seoTitulo ?? titulo);
  if (sufijo) {
    const completo = `${base} · ${sufijo}`;
    if (completo.length <= LIMITE_TITULO) return completo;
  }
  return recortar(base, LIMITE_TITULO);
};

/** Descripción: 50-160 caracteres tras normalizar. */
export const metaDescripcion = (descripcion: string): string => recortar(descripcion, LIMITE_DESCRIPCION);

/** OG: ruta de asset relativa a la raíz del sitio; aquí se convierte en absoluta. */
export const ogAbsoluta = (canonica: string, asset: string): string => new URL(asset, canonica).href;

export const SUFIJO_MARCA = MARCA;
