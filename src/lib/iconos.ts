/**
 * Un solo mapa de cluster editorial a objeto temático de V2.1.
 *
 * Vive aquí y no en cada plantilla para que un tema nuevo no acabe con un icono
 * distinto en el portal, en el índice de temas y en la ficha de un vídeo.
 * Los nombres corresponden a `public/assets/v2.1/topics/<nombre>-{24,32,40}.svg`.
 */
export const ICONO_TEMA: Record<string, string> = {
  nomina: 'nomina',
  fiscal: 'impuestos',
  impuestos: 'impuestos',
  inflacion: 'inflacion',
  ahorro: 'ahorro',
  inversion: 'inversion',
  banca: 'banca',
  vivienda: 'vivienda',
  historia: 'historia',
  burbujas: 'historia',
};

/** Nombre del objeto temático para un cluster; `null` si el cluster no tiene arte propio. */
export const iconoDeCluster = (cluster: string): string | null => ICONO_TEMA[cluster] ?? null;
