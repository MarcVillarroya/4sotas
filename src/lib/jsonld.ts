/**
 * Constructores JSON-LD derivados del modelo (SEO-AGENT.md §5).
 * Reglas duras: sin aggregateRating, sin review, sin offers inventados, sin 4sotas.com.
 */
import { CANAL_YOUTUBE, MARCA } from './rutas.ts';

export type Nodo = Record<string, unknown>;

const conContexto = (nodes: Nodo[]): Nodo => ({
  '@context': 'https://schema.org',
  '@graph': nodes,
});

export const organizacion = (origen: string): Nodo => ({
  '@type': 'Organization',
  '@id': `${origen}#organizacion`,
  name: MARCA,
  url: `${origen}/`,
  inLanguage: 'es-ES',
  // sameAs solo con URL verificada: el canal real del proyecto.
  sameAs: [CANAL_YOUTUBE],
});

export const sitioWeb = (origen: string): Nodo => ({
  '@type': 'WebSite',
  '@id': `${origen}#sitio`,
  name: MARCA,
  url: `${origen}/`,
  inLanguage: 'es-ES',
  publisher: { '@id': `${origen}#organizacion` },
});

export const paginaWeb = (params: { url: string; nombre: string; descripcion: string; tipo?: string }): Nodo => ({
  '@type': params.tipo ?? 'WebPage',
  '@id': `${params.url}#pagina`,
  url: params.url,
  name: params.nombre,
  description: params.descripcion,
  inLanguage: 'es-ES',
  isPartOf: { '@type': 'WebSite', url: new URL('/', params.url).href },
});

/** Grafo de portada: Organization + WebSite + WebPage. */
export const grafoInicio = (params: { origen: string; url: string; nombre: string; descripcion: string }): Nodo =>
  conContexto([
    organizacion(params.origen),
    sitioWeb(params.origen),
    paginaWeb({ url: params.url, nombre: params.nombre, descripcion: params.descripcion }),
  ]);

/** Grafo de sección: WebSite + CollectionPage. */
export const grafoSeccion = (params: {
  origen: string;
  url: string;
  nombre: string;
  descripcion: string;
}): Nodo =>
  conContexto([
    sitioWeb(params.origen),
    paginaWeb({ url: params.url, nombre: params.nombre, descripcion: params.descripcion, tipo: 'CollectionPage' }),
  ]);
