/**
 * Única fuente de rutas y del origen del sitio.
 * La base la inyecta Astro en build (`import.meta.env.BASE_URL`): '' en dominio raíz, '/4sotas' en Pages.
 * Prohibido escribir `href="/oros/..."` a mano en plantillas: siempre `url('/oros/')`.
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

/** El canal real del proyecto ([hecho] audit/inventory.json). Nunca un perfil inventado. */
export const CANAL_YOUTUBE = 'https://www.youtube.com/channel/UCq2xbvKI-0TXaPprjK970OQ';

export const MARCA = '4 Sotas';
export const SECCION = 'Sota de Oros';
