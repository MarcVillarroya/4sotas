/**
 * 4 Sotas · contrato del pack editorial de vídeo (V2.2-A).
 *
 * Una sola fuente por pieza: el pack (`metadatos.yaml`) describe lo que se publica en YouTube
 * y lo que se escribe en la ficha del sitio. De aquí salen, sin copiar nada a mano:
 *   · la descripción de YouTube (resumen + puntos + capítulos + fuentes + aviso),
 *   · la ficha web (`src/content/videos/vid-<id>.yaml`).
 *
 * Reglas duras que este módulo implementa:
 *   · Si falta un campo, se dice cuál: `validarPack()` devuelve `{ campo, mensaje }`.
 *   · Ningún capítulo, cifra ni resumen se inventa: los capítulos vienen del pack con sus
 *     segundos reales y la descripción solo repite lo que el pack declara.
 *   · Nada de red ni de disco aquí: las comprobaciones de existencia de fichero se inyectan
 *     (`existe`), para poder probar el contrato sin tocar el sistema de ficheros.
 *
 * Contrato completo y plantilla: /home/mvf/4sotas/v2.2/VIDEO-INFO.md
 */

export const VERSION_CONTRATO = '1.0.0';

/** Campos obligatorios del pack, en el orden en que se documentan. */
export const CAMPOS_OBLIGATORIOS = [
  'titulo',
  'slug',
  'descripcion_corta',
  'seo_descripcion',
  'resumen_editorial',
  'que_cubre',
  'que_no_cubre',
  'para_quien',
  'temas',
  'keywords',
  'fuentes',
  'disclaimer',
  'publicar_en',
  'miniatura',
  'video',
] as const;

/** Límites declarados (los mismos que el esquema de contenido). */
export const LIMITES = {
  resumen: { min: 140, max: 420 },
  descripcion_corta: { min: 40, max: 220 },
  seo_descripcion: { min: 50, max: 160 },
  para_quien: { min: 20, max: 200 },
  que_cubre: { min: 2, max: 4 },
  que_no_cubre: { min: 1, max: 2 },
  temas: { min: 1, max: 3 },
  keywords: { min: 3, max: 15 },
  fuentes: { min: 1, max: 8 },
  capitulos: { min: 3, max: 30 },
  separacion_minima_capitulos: 10,
} as const;

export type ErrorPack = { campo: string; mensaje: string };
export type ResultadoPack = { ok: boolean; errores: ErrorPack[] };

export type CapituloPack = { titulo: string; segundo: number };

export type Pack = {
  titulo?: string;
  slug?: string;
  descripcion_corta?: string;
  seo_descripcion?: string;
  resumen_editorial?: string;
  que_cubre?: string[];
  que_no_cubre?: string[];
  para_quien?: string;
  temas?: string[];
  keywords?: string[];
  serie?: string;
  relacionados?: string[];
  fuentes?: string[];
  disclaimer?: string;
  capitulos?: CapituloPack[];
  transcripcion?: { estado?: string; fuente?: string };
  guion?: string;
  publicar_en?: string;
  miniatura?: string;
  video?: string;
  duracion_iso?: string;
  youtube_id?: string;
  autorias?: { redactor?: string; revisor?: string };
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REF_TEMA = /^tema-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REF_SERIE = /^ser-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REF_VIDEO = /^vid-[A-Za-z0-9_-]{11}$/;
const ID_YT = /^[A-Za-z0-9_-]{11}$/;
/** ISO 8601 con zona explícita: `2026-11-02T18:00:00+01:00` o `...Z`. */
const ISO_CON_ZONA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})$/;

const esTexto = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const largo = (v: string) => v.trim().length;

/** `0:00`, `1:07`, `1:02:03`: la misma notación que YouTube exige en la descripción. */
export function marcaTiempo(segundo: number): string {
  const s = Math.max(0, Math.trunc(segundo));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
}

/** Capítulos ordenados y sin segundos repetidos, tal como se publican. */
export function capitulosOrdenados(capitulos: CapituloPack[] | undefined): CapituloPack[] {
  if (!Array.isArray(capitulos)) return [];
  return [...capitulos].sort((a, b) => a.segundo - b.segundo);
}

/**
 * Valida el pack completo. `existe` sirve para comprobar que las fuentes y los ficheros
 * citados están de verdad en disco; si no se pasa, esas comprobaciones se omiten.
 */
export function validarPack(pack: unknown, opciones: { existe?: (ruta: string) => boolean } = {}): ResultadoPack {
  const errores: ErrorPack[] = [];
  const err = (campo: string, mensaje: string) => errores.push({ campo, mensaje });
  const p = (pack ?? {}) as Pack;

  if (typeof pack !== 'object' || pack === null || Array.isArray(pack)) {
    return { ok: false, errores: [{ campo: 'pack', mensaje: 'el pack debe ser un objeto YAML con los campos del contrato' }] };
  }

  /* ── textos obligatorios con longitud declarada ── */
  const textos: Array<[keyof Pack, string, { min: number; max: number }]> = [
    ['descripcion_corta', 'descripcion_corta', LIMITES.descripcion_corta],
    ['seo_descripcion', 'seo_descripcion', LIMITES.seo_descripcion],
    ['resumen_editorial', 'resumen_editorial', LIMITES.resumen],
    ['para_quien', 'para_quien', LIMITES.para_quien],
    ['disclaimer', 'disclaimer', { min: 20, max: 300 }],
  ];
  for (const [clave, nombre, lim] of textos) {
    const v = p[clave];
    if (!esTexto(v)) {
      err(nombre, `falta el campo obligatorio "${nombre}"`);
      continue;
    }
    const n = largo(v);
    if (n < lim.min || n > lim.max) err(nombre, `"${nombre}" tiene ${n} caracteres y el contrato exige entre ${lim.min} y ${lim.max}`);
  }

  if (!esTexto(p.titulo)) err('titulo', 'falta el campo obligatorio "titulo"');
  else if (largo(p.titulo) < 5 || largo(p.titulo) > 120) err('titulo', '"titulo" debe tener entre 5 y 120 caracteres');

  if (!esTexto(p.slug)) err('slug', 'falta el campo obligatorio "slug"');
  else if (!SLUG.test(p.slug)) err('slug', '"slug" debe ser kebab-case minúsculo sin acentos (ej: como-leer-una-nomina)');

  /* ── listas de puntos editoriales ── */
  const listas: Array<[keyof Pack, string, { min: number; max: number }]> = [
    ['que_cubre', 'que_cubre', LIMITES.que_cubre],
    ['que_no_cubre', 'que_no_cubre', LIMITES.que_no_cubre],
  ];
  for (const [clave, nombre, lim] of listas) {
    const v = p[clave];
    if (!Array.isArray(v) || v.length === 0) {
      err(nombre, `falta el campo obligatorio "${nombre}" (${lim.min}–${lim.max} puntos)`);
      continue;
    }
    if (v.length < lim.min || v.length > lim.max) err(nombre, `"${nombre}" necesita entre ${lim.min} y ${lim.max} puntos (hay ${v.length})`);
    v.forEach((punto, i) => {
      if (!esTexto(punto)) err(`${nombre}[${i}]`, `"${nombre}[${i}]" está vacío`);
      else if (largo(punto) < 8 || largo(punto) > 160) err(`${nombre}[${i}]`, `"${nombre}[${i}]" debe tener entre 8 y 160 caracteres`);
    });
  }

  /* ── referencias del modelo ── */
  if (!Array.isArray(p.temas) || p.temas.length === 0) err('temas', 'falta el campo obligatorio "temas" (1–3 referencias tema-*)');
  else {
    if (p.temas.length < LIMITES.temas.min || p.temas.length > LIMITES.temas.max)
      err('temas', `"temas" necesita entre ${LIMITES.temas.min} y ${LIMITES.temas.max} referencias (hay ${p.temas.length})`);
    p.temas.forEach((t, i) => {
      if (!esTexto(t) || !REF_TEMA.test(t)) err(`temas[${i}]`, `"temas[${i}]" debe ser una referencia "tema-..."`);
    });
  }
  if (p.serie !== undefined && (!esTexto(p.serie) || !REF_SERIE.test(p.serie)))
    err('serie', '"serie" debe ser una referencia "ser-..." cuando se declara');
  if (p.relacionados !== undefined) {
    if (!Array.isArray(p.relacionados)) err('relacionados', '"relacionados" debe ser una lista de "vid-<youtube_id>"');
    else
      p.relacionados.forEach((r, i) => {
        if (!esTexto(r) || !REF_VIDEO.test(r)) err(`relacionados[${i}]`, `"relacionados[${i}]" debe ser "vid-" + youtube_id (11 caracteres)`);
      });
  }

  /* ── keywords = tags de YouTube ── */
  if (!Array.isArray(p.keywords) || p.keywords.length === 0) err('keywords', 'falta el campo obligatorio "keywords" (3–15 etiquetas reales del vídeo)');
  else {
    if (p.keywords.length < LIMITES.keywords.min || p.keywords.length > LIMITES.keywords.max)
      err('keywords', `"keywords" necesita entre ${LIMITES.keywords.min} y ${LIMITES.keywords.max} etiquetas (hay ${p.keywords.length})`);
    p.keywords.forEach((k, i) => {
      if (!esTexto(k)) err(`keywords[${i}]`, `"keywords[${i}]" está vacía`);
    });
  }

  /* ── fuentes y aviso ── */
  if (!Array.isArray(p.fuentes) || p.fuentes.length === 0) err('fuentes', 'falta el campo obligatorio "fuentes" (al menos una fuente o atribución real)');
  else {
    if (p.fuentes.length > LIMITES.fuentes.max) err('fuentes', `"fuentes" admite como máximo ${LIMITES.fuentes.max} entradas`);
    p.fuentes.forEach((f, i) => {
      if (!esTexto(f)) err(`fuentes[${i}]`, `"fuentes[${i}]" está vacía`);
    });
  }

  /* ── duración real, si se declara en el pack ── */
  if (p.duracion_iso !== undefined && !/^PT(?:\d+H)?(?:\d+M)?(?:\d+S)?$/.test(String(p.duracion_iso)))
    err('duracion_iso', '"duracion_iso" debe ser ISO 8601 de duración (ej: PT1M5S)');

  /* ── fecha de publicación programada: ISO con zona ── */
  if (!esTexto(p.publicar_en)) err('publicar_en', 'falta el campo obligatorio "publicar_en" (ISO 8601 con zona)');
  else if (!ISO_CON_ZONA.test(p.publicar_en))
    err('publicar_en', `"publicar_en" debe ser ISO 8601 con zona explícita (ej: 2026-11-02T18:00:00+01:00), no "${p.publicar_en}"`);
  else if (Number.isNaN(Date.parse(p.publicar_en))) err('publicar_en', '"publicar_en" no es una fecha válida');

  /* ── ficheros citados: miniatura, vídeo y fuente de la transcripción ── */
  for (const [clave, nombre] of [
    ['miniatura', 'miniatura'],
    ['video', 'video'],
  ] as const) {
    const v = p[clave];
    if (!esTexto(v)) err(nombre, `falta el campo obligatorio "${nombre}" (ruta real del fichero)`);
    else if (opciones.existe && !opciones.existe(v)) err(nombre, `"${nombre}" apunta a un fichero que no existe: ${v}`);
  }

  const hayTranscripcion = p.transcripcion && esTexto(p.transcripcion.fuente);
  const hayGuion = esTexto(p.guion);
  if (!hayTranscripcion && !hayGuion) {
    err('transcripcion', 'falta la fuente del texto: "transcripcion.fuente" o "guion" (de dónde sale lo que se dice en el vídeo)');
  } else {
    if (p.transcripcion !== undefined) {
      const estado = p.transcripcion.estado;
      if (!esTexto(estado) || !['revisada', 'automatica'].includes(estado))
        err('transcripcion.estado', '"transcripcion.estado" debe ser "revisada" o "automatica"');
      if (hayTranscripcion && opciones.existe && !opciones.existe(p.transcripcion.fuente as string))
        err('transcripcion.fuente', `"transcripcion.fuente" no existe: ${p.transcripcion.fuente}`);
    }
    if (hayGuion && opciones.existe && !opciones.existe(p.guion as string)) err('guion', `"guion" no existe: ${p.guion}`);
  }

  /* ── capítulos: solo si existen, y con segundos reales ── */
  if (p.capitulos !== undefined) {
    if (!Array.isArray(p.capitulos)) err('capitulos', '"capitulos" debe ser una lista de { titulo, segundo }');
    else if (p.capitulos.length > 0) {
      const caps = p.capitulos;
      if (caps.length < LIMITES.capitulos.min)
        err('capitulos', `"capitulos" exige al menos ${LIMITES.capitulos.min} capítulos para que YouTube los acepte (hay ${caps.length})`);
      caps.forEach((c, i) => {
        if (!esTexto(c?.titulo) || largo(c.titulo) > 120) err(`capitulos[${i}].titulo`, `"capitulos[${i}].titulo" falta o supera 120 caracteres`);
        if (typeof c?.segundo !== 'number' || !Number.isInteger(c.segundo) || c.segundo < 0)
          err(`capitulos[${i}].segundo`, `"capitulos[${i}].segundo" debe ser un entero de segundos reales`);
      });
      if (errores.every((e) => !e.campo.startsWith('capitulos'))) {
        if (caps[0].segundo !== 0) err('capitulos', '"capitulos" debe empezar en 0:00 (primer capítulo del vídeo)');
        for (let i = 1; i < caps.length; i++) {
          const salto = caps[i].segundo - caps[i - 1].segundo;
          if (salto <= 0) err('capitulos', `"capitulos" debe ir en orden creciente de segundos (falla en "${caps[i].titulo}")`);
          else if (salto < LIMITES.separacion_minima_capitulos)
            err('capitulos', `"capitulos" exige al menos ${LIMITES.separacion_minima_capitulos} s entre capítulos (falla en "${caps[i].titulo}")`);
        }
      }
    }
  }

  /* ── autorías opcionales, con la forma del modelo ── */
  if (p.autorias !== undefined) {
    if (typeof p.autorias !== 'object' || p.autorias === null) err('autorias', '"autorias" debe ser un objeto { redactor, revisor }');
    else {
      if (p.autorias.redactor !== undefined && !/^aut-[a-z0-9-]+$/.test(String(p.autorias.redactor)))
        err('autorias.redactor', '"autorias.redactor" debe ser una referencia "aut-..."');
      if (p.autorias.revisor !== undefined && !/^aut-[a-z0-9-]+$/.test(String(p.autorias.revisor)))
        err('autorias.revisor', '"autorias.revisor" debe ser una referencia "aut-..."');
    }
  }

  return { ok: errores.length === 0, errores };
}

/**
 * Descripción de YouTube derivada del pack. No añade ni una cifra: repite el resumen, los
 * puntos y los capítulos del pack, y cierra con las fuentes y el aviso declarados.
 */
export function descripcionYouTube(pack: Pack): string {
  const caps = capitulosOrdenados(pack.capitulos);
  const bloques: string[] = [];

  if (esTexto(pack.resumen_editorial)) bloques.push(pack.resumen_editorial.trim());

  if (Array.isArray(pack.que_cubre) && pack.que_cubre.length) {
    bloques.push(['EN ESTE VÍDEO', ...pack.que_cubre.filter(esTexto).map((p) => `· ${p.trim()}`)].join('\n'));
  }
  if (esTexto(pack.para_quien)) bloques.push(`PARA QUIÉN\n${pack.para_quien.trim()}`);

  if (caps.length) {
    bloques.push(['CAPÍTULOS', ...caps.map((c) => `${marcaTiempo(c.segundo)} ${c.titulo.trim()}`)].join('\n'));
  }

  if (Array.isArray(pack.fuentes) && pack.fuentes.length) {
    bloques.push(['FUENTES Y ATRIBUCIONES', ...pack.fuentes.filter(esTexto).map((f) => `· ${f.trim()}`)].join('\n'));
  }

  if (esTexto(pack.disclaimer)) bloques.push(pack.disclaimer.trim());

  if (Array.isArray(pack.keywords) && pack.keywords.length) {
    bloques.push(pack.keywords.filter(esTexto).map((k) => `#${k.trim().replace(/^#/, '').replace(/\s+/g, '')}`).join(' '));
  }

  return bloques.join('\n\n');
}

export type RespuestaYouTube = {
  youtubeId: string;
  /** `public`, `unlisted` o `private` tal como lo devuelve la API. */
  privacidad: 'public' | 'unlisted' | 'private';
  /** `publishedAt` de la API en ISO (para un programado, la fecha de subida). */
  publicadoEn: string;
  duracionISO: string;
  /** `publishAt` de la API cuando el vídeo está programado. */
  programadoPara?: string | null;
  vistas?: number;
  miniatura?: string;
};

const fechaDe = (iso: string): string => new Date(iso).toISOString().slice(0, 10);

/** Estado editorial del vídeo en YouTube, derivado de la respuesta de la API. */
export function estadoYouTube(r: RespuestaYouTube): 'publico' | 'programado' | 'oculto' | 'eliminado' {
  if (r.privacidad === 'public') return 'publico';
  if (r.privacidad === 'private' && r.programadoPara) return 'programado';
  return 'oculto';
}

/**
 * Ficha web (`src/content/videos/vid-<id>.yaml`) a partir del pack y de lo que responde
 * YouTube. Todo lo editorial sale del pack; todo lo factual, de la API.
 */
export function fichaDesdePack(
  pack: Pack,
  api: RespuestaYouTube,
  opciones: { hoy?: string; statusMinimo?: boolean } = {},
): Record<string, unknown> {
  const hoy = opciones.hoy ?? new Date().toISOString().slice(0, 10);
  const estado = estadoYouTube(api);
  const publicoEnSitio = estado === 'publico';

  const ficha: Record<string, unknown> = {
    id: `vid-${api.youtubeId}`,
    // Un vídeo no público no se publica en el sitio (aislamiento de no publicados, V2.1).
    status: publicoEnSitio ? 'publicado' : 'revision',
    universo: 'oros',
    creado: hoy,
    publicado: hoy,
    revisado_factual: hoy,
    sensibilidad: 'baja',
    procedencia: 'original',
    autorias: {
      redactor: pack.autorias?.redactor ?? 'aut-marc-villarroya',
      revisor: pack.autorias?.revisor ?? 'aut-revision-factual-qa',
    },
    fuentes: [],
    seo: { descripcion: pack.seo_descripcion, noindex: false },
    actualizacion: { politica: 'revision-anual' },
    youtube_id: api.youtubeId,
    slug: pack.slug,
    titulo: pack.titulo,
    descripcion_corta: pack.descripcion_corta,
    publicado_en: fechaDe(estado === 'programado' && api.programadoPara ? api.programadoPara : api.publicadoEn),
    duracion_iso: api.duracionISO,
    miniatura: api.miniatura ?? `https://i.ytimg.com/vi/${api.youtubeId}/maxresdefault.jpg`,
    miniatura_local: `/assets/videos/${api.youtubeId}.webp`,
    insercion: 'disponible',
    estado_youtube: estado,
    privacidad_api: api.privacidad,
    verificado_en: hoy,
    idioma: 'es',
    temas: pack.temas,
    relacionados: pack.relacionados ?? [],
    transcripcion: false,
    capitulos: capitulosOrdenados(pack.capitulos),
    informacion: {
      estado: 'completo',
      resumen: pack.resumen_editorial,
      que_cubre: pack.que_cubre,
      que_no_cubre: pack.que_no_cubre,
      para_quien: pack.para_quien,
      origen: 'paquete-publicacion',
      faltan: [],
      heredado: false,
    },
  };
  if (pack.serie) ficha.serie = pack.serie;
  if (typeof api.vistas === 'number') ficha.vistas_al_verificar = api.vistas;
  return ficha;
}

/** ¿La ficha tiene información editorial completa? (lo que muestra la página y exige el esquema) */
export function informacionCompleta(informacion: { estado?: string } | undefined): boolean {
  return informacion?.estado === 'completo';
}
