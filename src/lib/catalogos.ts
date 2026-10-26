/**
 * Catálogos JSON derivados (DATA-MODEL.md §6, SEO-AGENT.md §6).
 *
 * Regla única: `items` sale de la misma función de publicación que el resto del sitio
 * (`publicados()`), así que un catálogo no puede contener lo que el HTML no publica.
 * Un vídeo, además, exige `estado_youtube: publico` y `privacidad_api: public`.
 * `schema_version` solo sube si cambia la forma pública (semver, DATA-MODEL §8).
 */
import type { CollectionEntry } from 'astro:content';
import { publicados } from './publicacion.ts';
import { ruta, url } from './rutas.ts';

export const SCHEMA_VERSION = '1.0.0';

export type Catalogo = {
  schema_version: string;
  generated_at: string;
  universo: 'oros';
  items: Record<string, unknown>[];
};

const dia = (d?: Date): string | undefined => (d ? d.toISOString().slice(0, 10) : undefined);

const sobre = (base: Catalogo, items: Record<string, unknown>[]): Catalogo => ({ ...base, items });

export function catalogoArticulos(
  entradas: readonly CollectionEntry<'articulos'>[],
  generatedAt: string,
): Catalogo {
  const items = publicados(entradas).map((e) => ({
    id: e.data.id,
    slug: e.data.slug,
    url: url(ruta.guia(e.data.slug)),
    titulo: e.data.titulo,
    resumen: e.data.resumen,
    publicado: dia(e.data.publicado),
    actualizado: dia(e.data.actualizado ?? e.data.publicado),
    temas: e.data.temas.map((t) => (typeof t === 'string' ? t : t.id)),
    nivel: e.data.nivel,
    tipo: e.data.tipo,
  }));
  return sobre({ schema_version: SCHEMA_VERSION, generated_at: generatedAt, universo: 'oros', items: [] }, items);
}

export function catalogoTemas(entradas: readonly CollectionEntry<'temas'>[], generatedAt: string): Catalogo {
  const items = publicados(entradas).map((e) => ({
    id: e.data.id,
    slug: e.data.slug,
    url: url(ruta.tema(e.data.slug)),
    titulo: e.data.titulo,
    descripcion_corta: e.data.descripcion_corta,
    cluster: e.data.cluster,
    orden: e.data.orden,
    pilar: e.data.pilar ? (typeof e.data.pilar === 'string' ? e.data.pilar : e.data.pilar.id) : undefined,
    actualizado: dia(e.data.actualizado ?? e.data.publicado),
  }));
  return sobre({ schema_version: SCHEMA_VERSION, generated_at: generatedAt, universo: 'oros', items: [] }, items);
}

/** Solo vídeos con ficha publicada y estado real público en la API. Nunca vistas en vivo. */
export function catalogoVideos(entradas: readonly CollectionEntry<'videos'>[], generatedAt: string): Catalogo {
  const items = publicados(entradas)
    .filter((e) => e.data.estado_youtube === 'publico' && e.data.privacidad_api === 'public')
    .sort((a, b) => b.data.publicado_en.getTime() - a.data.publicado_en.getTime())
    .map((e) => ({
      id: e.data.id,
      youtube_id: e.data.youtube_id,
      slug: e.data.slug,
      url: url(ruta.video(e.data.slug)),
      titulo: e.data.titulo,
      descripcion_corta: e.data.descripcion_corta,
      publicado_en: dia(e.data.publicado_en),
      duracion_iso: e.data.duracion_iso,
      estado_youtube: e.data.estado_youtube,
      miniatura: e.data.miniatura,
      temas: e.data.temas.map((t) => (typeof t === 'string' ? t : t.id)),
      vistas_al_verificar: e.data.vistas_al_verificar,
      verificado_en: dia(e.data.verificado_en),
    }));
  return sobre({ schema_version: SCHEMA_VERSION, generated_at: generatedAt, universo: 'oros', items: [] }, items);
}

/** Solo herramientas implementadas (una anunciada y no implementada no se publica). */
export function catalogoHerramientas(
  entradas: readonly CollectionEntry<'herramientas'>[],
  generatedAt: string,
): Catalogo {
  const items = publicados(entradas)
    .filter((e) => e.data.estado_implementacion !== 'no-implementada')
    .map((e) => ({
      id: e.data.id,
      slug: e.data.slug,
      url: url(ruta.herramienta(e.data.slug)),
      titulo: e.data.titulo,
      descripcion: e.data.descripcion,
      estado_implementacion: e.data.estado_implementacion,
      version_motor: e.data.version_motor,
      unidad_salida: e.data.unidad_salida,
      temas: e.data.temas.map((t) => (typeof t === 'string' ? t : t.id)),
      actualizado: dia(e.data.actualizado ?? e.data.publicado),
    }));
  return sobre({ schema_version: SCHEMA_VERSION, generated_at: generatedAt, universo: 'oros', items: [] }, items);
}
