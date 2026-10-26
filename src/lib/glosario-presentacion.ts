/**
 * Etiquetas de presentación para el glosario.
 *
 * Los datos de `src/content/glosario` guardan la categoría como slug interno
 * (`nomina`, `inflacion`…). Publicarla tal cual deja sin tildes ni mayúsculas un
 * texto visible, así que la vista usa estas etiquetas. No crea categorías nuevas:
 * si un término trae una categoría desconocida, se devuelve tal cual y el test lo
 * detecta.
 */
const ETIQUETAS: Record<string, string> = {
  ahorro: 'Ahorro',
  banca: 'Banca y crédito',
  fiscal: 'Fiscalidad',
  inflacion: 'Inflación',
  inversion: 'Inversión',
  nomina: 'Nómina',
  vivienda: 'Vivienda e hipoteca',
};

export const CATEGORIAS_GLOSARIO = Object.keys(ETIQUETAS);

export const etiquetaCategoria = (categoria: string): string => ETIQUETAS[categoria] ?? categoria;
