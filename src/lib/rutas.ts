/**
 * Única fuente de rutas y del origen del sitio.
 * La base la inyecta Astro en build (`import.meta.env.BASE_URL`): '' en dominio raíz, '/4sotas' en Pages.
 * Prohibido escribir `href="/oros/..."` a mano en plantillas: siempre `url(ruta.guia(slug))`.
 */
export const BASE: string = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '');

/** Convierte una ruta de contenido ('/oros/', '/x.png') en URL servible con la base incluida. */
export const conBase = (base: string, p: string): string => `${base}${p.startsWith('/') ? p : `/${p}`}`;

/** Igual que `conBase` con la base real del build. */
export const url = (p: string): string => conBase(BASE, p);

/** Canónica absoluta: el pathname de Astro ya incluye la base. */
export const canonica = (pathname: string, site: URL | undefined): string =>
  new URL(pathname, site ?? ORIGEN_POR_DEFECTO).href;

export const ORIGEN_POR_DEFECTO = 'https://marcvillarroya.github.io';

/** Rutas internas de la V1 que existen como página. */
export const RUTAS = {
  inicio: '/',
  oros: '/oros/',
} as const;

/**
 * Constructoras de ruta tipadas: una función por plantilla generada.
 * Toda ruta termina en '/' (trailingSlash: 'always') y se deriva del `slug` de la entrada,
 * nunca del título. Cambiar un título no mueve ninguna URL.
 */
export const ruta = {
  temas: (): string => '/oros/temas/',
  tema: (slug: string): string => `/oros/temas/${slug}/`,
  guias: (): string => '/oros/guias/',
  guia: (slug: string): string => `/oros/guias/${slug}/`,
  videos: (): string => '/oros/videos/',
  video: (slug: string): string => `/oros/videos/${slug}/`,
  glosario: (): string => '/oros/glosario/',
  termino: (slug: string): string => `/oros/glosario/${slug}/`,
  herramientas: (): string => '/oros/herramientas/',
  herramienta: (slug: string): string => `/oros/herramientas/${slug}/`,
} as const;

/** El canal real del proyecto ([hecho] audit/inventory.json). Nunca un perfil inventado. */
export const CANAL_YOUTUBE = 'https://www.youtube.com/channel/UCq2xbvKI-0TXaPprjK970OQ';

export const MARCA = '4 Sotas';
export const SECCION = 'Sota de Oros';

/** URL canónica de un vídeo en YouTube (enlace directo, funciona sin JS). */
export const verEnYouTube = (id: string): string => `https://www.youtube.com/watch?v=${id}`;

/** URL de inserción sin cookies: solo se usa tras la interacción del usuario. */
export const embedYouTube = (id: string): string => `https://www.youtube-nocookie.com/embed/${id}`;
