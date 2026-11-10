/**
 * Constructores JSON-LD derivados del modelo (SEO-AGENT.md §5).
 * Reglas duras: sin aggregateRating, sin review, sin offers inventados salvo el precio 0 real
 * de una herramienta gratuita, sin 4sotas.com, sin campos que la página no muestre.
 */
import { CANAL_YOUTUBE, MARCA, SECCION } from './rutas.ts';

export type Nodo = Record<string, unknown>;

const conContexto = (nodes: Nodo[]): Nodo => {
  // La Organization se define una sola vez por grafo: si alguna página la referencia por @id
  // (publisher, founder…) y no la incluye, el @id queda colgando. Se inyecta aquí, en el único
  // punto por el que pasan todos los grafos, en vez de repetirla en cada plantilla.
  const plano = JSON.stringify(nodes);
  const tieneOrganizacion = nodes.some((n) => n['@type'] === 'Organization');
  if (!tieneOrganizacion && plano.includes('#organizacion')) {
    const sitio = nodes.find((n) => typeof n['@id'] === 'string' && String(n['@id']).endsWith('#sitio'));
    const origen = sitio
      ? String(sitio['@id']).replace(/#sitio$/, '')
      : (plano.match(/https:\/\/[^"\\]+?(?=#organizacion)/) ?? [])[0];
    if (origen) nodes = [organizacion(origen), ...nodes];
  }
  return { '@context': 'https://schema.org', '@graph': nodes };
};

/** Grafo JSON-LD: un único `<script type="application/ld+json">` por página. */
export const grafo = (nodes: Nodo[]): Nodo => conContexto(nodes);

export const organizacion = (origen: string): Nodo => ({
  '@type': 'Organization',
  '@id': `${origen}#organizacion`,
  name: MARCA,
  url: `${origen}/`,
  logo: { '@type': 'ImageObject', url: `${origen}/assets/mark.svg`, width: 40, height: 44 },
  inLanguage: 'es-ES',
  // Principios editoriales publicados: metodología y fuentes, no una promesa genérica.
  publishingPrinciples: `${origen}/metodologia/`,
  founder: { '@type': 'Person', name: 'Marc Villarroya', url: `${origen}/sobre-4-sotas/` },
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
  autor: { nombre: string; url?: string };
  seccion?: string;
  citas?: readonly string[];
  /** Imagen de la página (1200×630). Sin ella, Google no da por elegible el rich result de Article. */
  imagen?: string;
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
    image: params.imagen ?? `${origen}/assets/og/4sotas.png`,
    author: { '@type': 'Person', name: params.autor.nombre, ...(params.autor.url ? { url: params.autor.url } : {}) },
    publisher: { '@id': `${origen}#organizacion` },
    isPartOf: { '@id': `${origen}#sitio` },
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
  /** URL del contenido en su plataforma de origen (YouTube). Por defecto, la ficha propia. */
  contentUrl?: string;
  /** Fecha de la última revisión editorial de la ficha, si existe. */
  revisadoISO?: string;
}): Nodo => {
  const origen = new URL(params.url).origin;
  return {
    '@type': 'VideoObject',
    '@id': `${params.url}#video`,
    name: params.nombre,
    description: params.descripcion,
    thumbnailUrl: [...params.miniaturas],
    // Dimensiones reales del póster: sin ellas Google tiene que descargarlo para maquetar.
    width: 640,
    height: 360,
    uploadDate: params.subidoISO,
    duration: params.duracionISO,
    embedUrl: params.embedUrl,
    // El contenido original vive en YouTube; la ficha es la página que lo presenta.
    contentUrl: params.contentUrl ?? params.url,
    url: params.url,
    // dateModified solo si no es anterior a la publicación: una ficha no se modifica antes de existir.
    ...(params.revisadoISO && params.revisadoISO >= params.subidoISO ? { dateModified: params.revisadoISO } : {}),
    inLanguage: 'es-ES',
    publisher: { '@id': `${origen}#organizacion` },
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
