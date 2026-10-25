/**
 * Constructores JSON-LD derivados del modelo (SEO-AGENT.md §5).
 * Reglas duras: sin aggregateRating, sin review, sin offers inventados salvo el precio 0 real
 * de una herramienta gratuita, sin 4sotas.com, sin campos que la página no muestre.
 */
import { CANAL_YOUTUBE, MARCA, SECCION } from './rutas.ts';

export type Nodo = Record<string, unknown>;

const conContexto = (nodes: Nodo[]): Nodo => ({
  '@context': 'https://schema.org',
  '@graph': nodes,
});

/** Grafo JSON-LD: un único `<script type="application/ld+json">` por página. */
export const grafo = (nodes: Nodo[]): Nodo => conContexto(nodes);

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

/* ─────────────────────────── migas de pan ─────────────────────────── */

export type Miga = { nombre: string; url: string };

/** Migas reales: la última no se enlaza (es la página actual) pero sí se declara. */
export const migas = (items: readonly Miga[], urlPagina: string): Nodo => ({
  '@type': 'BreadcrumbList',
  '@id': `${urlPagina}#migas`,
  itemListElement: items.map((miga, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: miga.nombre,
    item: miga.url,
  })),
});

/** Lista ordenada de páginas (catálogos de temas, guías, vídeos, glosario). */
export const lista = (params: {
  url: string;
  nombre: string;
  elementos: readonly { url: string; nombre?: string }[];
}): Nodo => ({
  '@type': 'ItemList',
  '@id': `${params.url}#lista`,
  name: params.nombre,
  numberOfItems: params.elementos.length,
  itemListElement: params.elementos.map((e, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: e.url,
    ...(e.nombre ? { name: e.nombre } : {}),
  })),
});

/* ─────────────────────────── artículo / guía ─────────────────────────── */

export const articulo = (params: {
  url: string;
  titular: string;
  descripcion: string;
  publicadoISO?: string;
  actualizadoISO?: string;
  tipo?: 'Article' | 'BlogPosting';
  autor: { nombre: string };
  seccion?: string;
  citas?: readonly string[];
}): Nodo => {
  const origen = new URL(params.url).origin;
  return {
    '@type': params.tipo ?? 'Article',
    '@id': `${params.url}#articulo`,
    headline: params.titular,
    description: params.descripcion,
    // Sin fecha no se declara fecha: un borrador no tiene `publicado` y inventarla sería mentir al rastreador.
    ...(params.publicadoISO ? { datePublished: params.publicadoISO } : {}),
    ...(params.publicadoISO || params.actualizadoISO
      ? { dateModified: params.actualizadoISO || params.publicadoISO }
      : {}),
    inLanguage: 'es-ES',
    author: { '@type': 'Person', name: params.autor.nombre },
    publisher: { '@id': `${origen}#organizacion`, '@type': 'Organization', name: MARCA, url: `${origen}/` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${params.url}#pagina`, url: params.url },
    isAccessibleForFree: true,
    ...(params.seccion ? { articleSection: params.seccion } : {}),
    ...(params.citas?.length
      ? { citation: params.citas.map((u) => ({ '@type': 'CreativeWork', url: u })) }
      : {}),
  };
};

/* ─────────────────────────── vídeo ─────────────────────────── */

export const videoObjeto = (params: {
  url: string;
  nombre: string;
  descripcion: string;
  miniaturas: readonly string[];
  subidoISO: string;
  duracionISO: string;
  embedUrl: string;
}): Nodo => {
  const origen = new URL(params.url).origin;
  return {
    '@type': 'VideoObject',
    '@id': `${params.url}#video`,
    name: params.nombre,
    description: params.descripcion,
    thumbnailUrl: [...params.miniaturas],
    uploadDate: params.subidoISO,
    duration: params.duracionISO,
    embedUrl: params.embedUrl,
    // El contenido canónico es la watch page: la ficha propia, no el reproductor externo.
    contentUrl: params.url,
    url: params.url,
    inLanguage: 'es-ES',
    publisher: { '@id': `${origen}#organizacion`, '@type': 'Organization', name: MARCA, url: `${origen}/` },
    isPartOf: { '@type': 'WebPage', '@id': `${params.url}#pagina`, url: params.url },
    // Sin interactionStatistic: no publicamos vistas que caducan.
  };
};

/* ─────────────────────────── glosario ─────────────────────────── */

export const conjuntoTerminos = (params: {
  url: string;
  nombre: string;
  descripcion: string;
  terminos: readonly { nombre: string; url: string }[];
}): Nodo => ({
  '@type': 'DefinedTermSet',
  '@id': `${params.url}#glosario`,
  name: params.nombre,
  description: params.descripcion,
  url: params.url,
  inLanguage: 'es-ES',
  hasDefinedTerm: params.terminos.map((t) => ({
    '@type': 'DefinedTerm',
    '@id': `${t.url}#termino`,
    name: t.nombre,
    url: t.url,
  })),
});

export const terminoDefinido = (params: {
  url: string;
  nombre: string;
  descripcion: string;
  conjunto: { url: string; nombre: string };
  sinonimos?: readonly string[];
}): Nodo => ({
  '@type': 'DefinedTerm',
  '@id': `${params.url}#termino`,
  name: params.nombre,
  description: params.descripcion,
  url: params.url,
  inLanguage: 'es-ES',
  inDefinedTermSet: {
    '@type': 'DefinedTermSet',
    '@id': `${params.conjunto.url}#glosario`,
    name: params.conjunto.nombre,
    url: params.conjunto.url,
  },
  ...(params.sinonimos?.length ? { alternateName: [...params.sinonimos] } : {}),
});

/* ─────────────────────────── herramienta ─────────────────────────── */

/** Solo para herramientas realmente disponibles y gratuitas: sin ratings ni precios de terceros. */
export const aplicacionSoftware = (params: {
  url: string;
  nombre: string;
  descripcion: string;
  version?: string;
}): Nodo => {
  const origen = new URL(params.url).origin;
  return {
    '@type': 'SoftwareApplication',
    '@id': `${params.url}#aplicacion`,
    name: params.nombre,
    description: params.descripcion,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    inLanguage: 'es-ES',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    url: params.url,
    ...(params.version ? { softwareVersion: params.version } : {}),
    publisher: { '@id': `${origen}#organizacion`, '@type': 'Organization', name: MARCA, url: `${origen}/` },
  };
};

/** Nombre del conjunto de términos usado en JSON-LD y en la interfaz. */
export const NOMBRE_GLOSARIO = `Glosario · ${SECCION}`;
