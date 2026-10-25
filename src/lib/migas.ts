/**
 * Migas de pan: una sola lista alimenta la navegación visible y el `BreadcrumbList`.
 * Se derivan de la ruta real de la página, no de texto libre.
 */
import { url } from './rutas.ts';
import { migas as migasJsonld, type Nodo } from './jsonld.ts';

export type MigaRuta = { nombre: string; ruta: string };
export type MigaVisual = { nombre: string; href?: string };

/** URL absoluta de una ruta interna, con la base del build incluida. */
export const absoluta = (rutaInterna: string, origen: string): string => new URL(url(rutaInterna), origen).href;

/**
 * Devuelve la miga visible (la última sin enlace, porque es la página actual) y el nodo JSON-LD.
 * `canonica` es la URL de la página; su origen se usa para absolutizar las demás.
 */
export const prepararMigas = (
  items: readonly MigaRuta[],
  canonica: string,
): { visual: MigaVisual[]; jsonld: Nodo } => {
  const origen = new URL(canonica).origin;
  // La última miga es la página actual: se usa su canónica tal cual, no una reconstrucción.
  const absolutas = items.map((m, i) =>
    i === items.length - 1 ? canonica : absoluta(m.ruta, origen),
  );
  return {
    visual: items.map((m, i) => ({
      nombre: m.nombre,
      href: i === items.length - 1 ? undefined : absolutas[i],
    })),
    jsonld: migasJsonld(
      items.map((m, i) => ({ nombre: m.nombre, url: absolutas[i] as string })),
      canonica,
    ),
  };
};
