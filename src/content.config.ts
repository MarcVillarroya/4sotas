// 4 Sotas · content collections (Astro 7.4.2 · Zod 4 vía `astro/zod`)
// Fuente canónica: /home/mvf/4sotas/architecture/content.config.ts
// Copiar tal cual a `site/src/content.config.ts`. No añadir campos fuera de este contrato:
// si hace falta uno nuevo, se documenta primero en architecture/DATA-MODEL.md.
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/* ─────────────────────────── primitivas compartidas ─────────────────────────── */

const ESTADOS = ['borrador', 'revision', 'aprobado', 'publicado', 'archivado'] as const;
const SENSIBILIDAD = ['baja', 'media', 'alta'] as const;
const POLITICA = ['revision-anual', 'revision-semestral', 'cuando-cambie-normativa', 'puntual'] as const;
const PROCEDENCIA = ['original', 'derivado-video', 'actualizacion', 'invitado'] as const;
const NIVEL = ['basico', 'intermedio', 'avanzado'] as const;
const CLUSTER = ['nomina', 'fiscal', 'inflacion', 'ahorro', 'inversion', 'banca', 'vivienda', 'historia'] as const;

const status = z.enum(ESTADOS).default('borrador');
const universo = z.enum(['oros']); // ampliar solo con decisión explícita del propietario
const sensibilidad = z.enum(SENSIBILIDAD).default('media');
const politica = z.enum(POLITICA).default('revision-anual');
const procedencia = z.enum(PROCEDENCIA).default('original');
const cluster = z.enum(CLUSTER);
const fecha = z.coerce.date();
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'color hex #RRGGBB');

const slug = z
  .string()
  .min(3)
  .max(72)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug: minúsculas/números separados por guion simple, sin acentos ni barra');

const idConPrefijo = (prefijo: string) =>
  z
    .string()
    .min(prefijo.length + 3)
    .max(80)
    .regex(new RegExp(`^${prefijo}-[a-z0-9]+(?:-[a-z0-9]+)*$`), `id permanente: "${prefijo}-" + kebab-case`);

/** Ruta de asset relativa a la raíz del sitio, SIN base path (la base se añade al renderizar). */
const rutaAsset = z
  .string()
  .regex(/^\/(?:[a-z0-9._-]+\/)*[a-z0-9._-]+\.(?:png|jpg|jpeg|webp|avif|svg)$/, 'asset: ruta /... con extensión de imagen, sin base path');

const seo = z
  .object({
    titulo: z.string().min(10).max(65).optional(),
    descripcion: z.string().min(50).max(160).optional(),
    og: rutaAsset.optional(),
    noindex: z.boolean().default(false),
    // `canonical` NO se declara nunca: se deriva de origen + ruta (ver ROUTES.md).
  })
  .strict();

const actualizacion = z
  .object({
    politica: politica,
    proxima_revision: fecha.optional(),
  })
  .strict();

const autorias = z
  .object({
    redactor: reference('autores'),
    revisor: reference('autores').optional(), // obligatorio si sensibilidad != baja al publicar
    revision_externa: z.string().max(160).optional(),
  })
  .strict();

const fuenteRef = z
  .object({
    fuente: reference('fuentes'),
    dato: z.string().max(240).optional(), // qué afirma esta fuente en el texto
  })
  .strict();

/** Campos presentes en toda entidad publicable. */
const base = {
  id: z.string(),
  status: status,
  universo: universo.default('oros'),
  creado: fecha,
  actualizado: fecha.optional(),
  publicado: fecha.optional(),
  revisado_factual: fecha.optional(),
  sensibilidad: sensibilidad,
  procedencia: procedencia,
  autorias: autorias,
  fuentes: z.array(fuenteRef).default([]),
  seo: seo.default({ noindex: false }),
  actualizacion: actualizacion,
  destacado: z.boolean().default(false),
};

/* ─────────────────────────── reglas de publicación ─────────────────────────── */

type Publicable = {
  status: (typeof ESTADOS)[number];
  publicado?: Date;
  revisado_factual?: Date;
  sensibilidad: (typeof SENSIBILIDAD)[number];
  fuentes: readonly unknown[];
  seo: { descripcion?: string; noindex: boolean };
};

/** Bloqueante: nada se publica sin fecha, sin fuente (si es YMYL) y sin revisor factual. */
function exigirPublicacion(v: Publicable, ctx: z.RefinementCtx, opciones: { exigeFuente?: boolean } = {}) {
  const exigeFuente = opciones.exigeFuente ?? true;
  if (v.status !== 'publicado') return;
  if (!v.publicado) ctx.addIssue({ code: 'custom', path: ['publicado'], message: 'status=publicado exige fecha `publicado`' });
  if (!v.revisado_factual)
    ctx.addIssue({ code: 'custom', path: ['revisado_factual'], message: 'status=publicado exige fecha `revisado_factual`' });
  if (v.sensibilidad !== 'baja' && !v.revisado_factual)
    ctx.addIssue({ code: 'custom', path: ['revisado_factual'], message: 'contenido YMYL sin revisión factual registrada' });
  if (exigeFuente && v.sensibilidad !== 'baja' && v.fuentes.length === 0)
    ctx.addIssue({ code: 'custom', path: ['fuentes'], message: 'status=publicado y sensibilidad != baja exigen >= 1 fuente' });
  if (!v.seo.descripcion) ctx.addIssue({ code: 'custom', path: ['seo', 'descripcion'], message: 'status=publicado exige seo.descripcion' });
  if (v.seo.noindex) ctx.addIssue({ code: 'custom', path: ['seo', 'noindex'], message: 'un contenido publicado no puede ser noindex' });
}

/* ─────────────────────────────── colecciones ─────────────────────────────── */

const sotas = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/sotas', generateId: ({ data }) => String(data.id) }),
  schema: z
    .object({
      id: idConPrefijo('sota'),
      palo: z.enum(['oros', 'copas', 'espadas', 'bastos']),
      nombre: z.string().min(3).max(40),
      lema: z.string().min(10).max(160),
      estado: z.enum(['activa', 'prevista', 'sin-contenido']),
      promesa: z.string().min(20).max(280).optional(), // solo si estado=activa
      color_acento: hex,
      creado: fecha,
    })
    .strict()
    .superRefine((v, ctx) => {
      if (v.estado === 'activa' && !v.promesa)
        ctx.addIssue({ code: 'custom', path: ['promesa'], message: 'un universo activo declara promesa editorial' });
      if (v.estado === 'activa' && v.palo !== 'oros')
        ctx.addIssue({ code: 'custom', path: ['estado'], message: 'V1 solo activa Oros (BRIEF, reglas duras)' });
      if (v.palo === 'oros' && v.estado !== 'activa')
        ctx.addIssue({ code: 'custom', path: ['estado'], message: 'oros es el universo activo de la V1' });
    }),
});

const temas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/temas', generateId: ({ data }) => String(data.id) }),
  schema: z
    .object({
      ...base,
      id: idConPrefijo('tema'),
      slug: slug,
      titulo: z.string().min(3).max(80),
      descripcion_corta: z.string().min(40).max(200),
      cluster: cluster,
      orden: z.number().int().min(1).max(99),
      icono: z.string().regex(/^[a-z0-9-]+$/).optional(),
      pilar: reference('articulos').optional(), // artículo troncal del tema
      temas_relacionados: z.array(reference('temas')).max(4).default([]),
      videos_destacados: z.array(reference('videos')).max(3).default([]),
      herramientas: z.array(reference('herramientas')).max(3).default([]),
    })
    .strict()
    .superRefine(exigirPublicacion),
});

const articulos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articulos', generateId: ({ data }) => String(data.id) }),
  schema: z
    .object({
      ...base,
      id: idConPrefijo('art'),
      slug: slug,
      titulo: z.string().min(10).max(90),
      resumen: z.string().min(60).max(220),
      tipo: z.enum(['guia', 'explicador', 'analisis']),
      nivel: z.enum(NIVEL),
      temas: z.array(reference('temas')).min(1).max(3),
      videos: z.array(reference('videos')).max(3).default([]),
      herramientas: z.array(reference('herramientas')).max(2).default([]),
      glosario: z.array(reference('glosario')).max(6).default([]),
      serie: reference('series').optional(),
      orden_en_serie: z.number().int().min(1).max(50).optional(),
      preguntas: z
        .array(z.object({ pregunta: z.string().min(8).max(120), respuesta: z.string().min(40).max(400) }).strict())
        .max(6)
        .default([]), // FAQPage solo si describen la página, sin invención
    })
    .strict()
    .superRefine((v, ctx) => {
      exigirPublicacion(v, ctx);
      if (v.serie && !v.orden_en_serie)
        ctx.addIssue({ code: 'custom', path: ['orden_en_serie'], message: 'artículo en serie exige orden_en_serie' });
      if (v.status === 'publicado' && v.preguntas.length > 0 && v.sensibilidad === 'alta' && !v.revisado_factual)
        ctx.addIssue({ code: 'custom', path: ['preguntas'], message: 'FAQ en contenido sensible exige revisión factual' });
    }),
});

const videos = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/videos', generateId: ({ data }) => String(data.id) }),
  schema: z
    .object({
      ...base,
      id: z.string().regex(/^vid-[A-Za-z0-9_-]{11}$/, 'id de vídeo: "vid-" + youtube_id'),
      youtube_id: z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'youtube_id: 11 caracteres'),
      slug: slug,
      titulo: z.string().min(5).max(120), // título real de la API, no el nombre de carpeta
      descripcion_corta: z.string().min(40).max(220),
      publicado_en: fecha,
      duracion_iso: z.string().regex(/^PT(?:\d+H)?(?:\d+M)?(?:\d+S)?$/),
      miniatura: z.url(),
      miniatura_local: rutaAsset.optional(),
      estado_youtube: z.enum(['publico', 'programado', 'oculto', 'eliminado']),
      privacidad_api: z.enum(['public', 'unlisted', 'private']),
      verificado_en: fecha, // último contraste con la API
      vistas_al_verificar: z.number().int().min(0).optional(),
      idioma: z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/).default('es'),
      temas: z.array(reference('temas')).min(1).max(3),
      serie: reference('series').optional(),
      relacionados: z.array(reference('videos')).max(3).default([]),
      transcripcion: z.boolean().default(false),
      capitulos: z.array(z.object({ titulo: z.string().max(120), segundo: z.number().int().min(0) }).strict()).default([]),
    })
    .strict()
    .superRefine((v, ctx) => {
      exigirPublicacion(v, ctx, { exigeFuente: false });
      if (v.id !== `vid-${v.youtube_id}`)
        ctx.addIssue({ code: 'custom', path: ['id'], message: 'id debe ser "vid-" + youtube_id' });
      if (v.estado_youtube === 'publico' && v.privacidad_api !== 'public')
        ctx.addIssue({ code: 'custom', path: ['privacidad_api'], message: 'estado_youtube=publico exige privacidad_api=public' });
      if (v.estado_youtube !== 'publico' && v.status === 'publicado')
        ctx.addIssue({
          code: 'custom',
          path: ['status'],
          message: 'un vídeo no público no puede publicarse en el sitio (aislamiento de no publicados)',
        });
    }),
});

const series = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/series', generateId: ({ data }) => String(data.id) }),
  schema: z
    .object({
      ...base,
      id: idConPrefijo('ser'),
      slug: slug,
      titulo: z.string().min(5).max(90),
      descripcion: z.string().min(40).max(220),
      estado: z.enum(['abierta', 'cerrada']),
      temas: z.array(reference('temas')).min(1).max(2),
      entregas_previstas: z.number().int().min(2).max(50).optional(),
    })
    .strict()
    .superRefine(exigirPublicacion),
});

const herramientas = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/herramientas', generateId: ({ data }) => String(data.id) }),
  schema: z
    .object({
      ...base,
      id: idConPrefijo('herr'),
      slug: slug,
      titulo: z.string().min(5).max(80),
      descripcion: z.string().min(40).max(220),
      tipo: z.literal('calculadora'),
      estado_implementacion: z.enum(['no-implementada', 'beta', 'estable']),
      version_motor: z.string().regex(/^\d+\.\d+\.\d+$/),
      formula: z.string().min(10).max(400),
      unidad_salida: z.enum(['EUR', 'EUR-por-mes', 'porcentaje']),
      parametros: z
        .array(
          z
            .object({
              clave: z.string().regex(/^[a-z][a-zA-Z0-9]{2,23}$/),
              etiqueta: z.string().min(3).max(60),
              tipo: z.enum(['moneda', 'porcentaje', 'entero']),
              defecto: z.number(),
              min: z.number(),
              max: z.number(),
              paso: z.number().positive(),
            })
            .strict(),
        )
        .min(1)
        .max(10),
      supuestos: z.array(z.string().min(20).max(240)).min(2).max(8),
      limites: z.array(z.string().min(20).max(240)).min(1).max(8),
      tests: z.string().regex(/^tests\/[a-z0-9-]+\.(?:ts|mjs)$/),
      temas: z.array(reference('temas')).min(1).max(2),
    })
    .strict()
    .superRefine((v, ctx) => {
      exigirPublicacion(v, ctx);
      if (v.status === 'publicado' && v.estado_implementacion === 'no-implementada')
        ctx.addIssue({
          code: 'custom',
          path: ['estado_implementacion'],
          message: 'herramienta anunciada pero no implementada (regla dura)',
        });
      if (v.estado_implementacion === 'estable' && v.status === 'publicado' && !v.revisado_factual)
        ctx.addIssue({ code: 'custom', path: ['revisado_factual'], message: 'calculadora estable exige revisión factual' });
    }),
});

const glosario = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/glosario', generateId: ({ data }) => String(data.id) }),
  schema: z
    .object({
      ...base,
      id: idConPrefijo('glo'),
      slug: slug,
      termino: z.string().min(2).max(60),
      definicion_corta: z.string().min(40).max(160),
      ejemplo: z.string().min(20).max(240),
      categoria: cluster,
      sinonimos: z.array(z.string().max(40)).max(4).default([]),
      relacionados: z.array(reference('glosario')).max(6).default([]),
    })
    .strict()
    .superRefine(exigirPublicacion),
});

const fuentes = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/fuentes', generateId: ({ data }) => String(data.id) }),
  schema: z
    .object({
      id: idConPrefijo('src'),
      titulo: z.string().min(5).max(200),
      editor: z.string().min(2).max(80), // AEAT, INE, BOE, BdE, BCE, CNMV, Seguridad Social...
      url: z.url(),
      tipo: z.enum(['primaria', 'oficial', 'secundaria', 'academica']),
      jurisdiccion: z.enum(['ES', 'ES-CT', 'UE', 'OTRA']),
      consultado_en: fecha,
      publicado_en: fecha.optional(),
      vigencia_hasta: fecha.optional(),
      cita: z.string().max(300).optional(),
      acceso: z.enum(['publico', 'requiere-navegador', 'de-pago']).default('publico'),
      archivo_local: z.string().max(200).optional(), // nunca en el repo si tiene derechos
      nota_verificacion: z.string().max(240).optional(),
    })
    .strict()
    .superRefine((v, ctx) => {
      if (v.acceso === 'de-pago' && !v.nota_verificacion)
        ctx.addIssue({ code: 'custom', path: ['nota_verificacion'], message: 'fuente de pago exige nota de acceso/verificación' });
      if (v.vigencia_hasta && v.vigencia_hasta < v.consultado_en)
        ctx.addIssue({ code: 'custom', path: ['vigencia_hasta'], message: 'vigencia_hasta anterior a la consulta' });
    }),
});

const autores = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/autores', generateId: ({ data }) => String(data.id) }),
  schema: z
    .object({
      id: idConPrefijo('aut'),
      nombre_publico: z.string().min(2).max(80),
      rol: z.array(z.enum(['redactor', 'revisor-factual', 'editor'])).min(1),
      bio: z.string().min(40).max(400).optional(), // solo hechos verificables
      perfil_url: z.url().optional(),
      contacto: z.email().optional(),
      creditos_verificados: z.boolean().default(false),
      titulacion_declarada: z.string().max(120).optional(), // PROHIBIDO si creditos_verificados=false
      creado: fecha,
    })
    .strict()
    .superRefine((v, ctx) => {
      if (v.titulacion_declarada && !v.creditos_verificados)
        ctx.addIssue({
          code: 'custom',
          path: ['titulacion_declarada'],
          message: 'no se declaran titulaciones sin verificación (BRIEF: no inventar títulos)',
        });
    }),
});

export const collections = { sotas, temas, articulos, videos, series, herramientas, glosario, fuentes, autores };
