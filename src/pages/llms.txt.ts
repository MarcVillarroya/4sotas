/**
 * /llms.txt — resumen para agentes. Especificación: https://llmstxt.org
 * Complemento, nunca sustituto de HTML o sitemap: se deriva de las mismas colecciones
 * y del mismo filtro de publicación, así que no puede desviarse del sitio real.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { publicados } from '../lib/publicacion.ts';
import { MARCA, ORIGEN_POR_DEFECTO, SECCION, ruta, url } from '../lib/rutas.ts';
import { SCHEMA_VERSION } from '../lib/catalogos.ts';

const fecha = (d?: Date) => (d ? d.toISOString().slice(0, 10) : '');

export const GET: APIRoute = async ({ site }) => {
  const [temas, articulos, videos, glosario, herramientas] = await Promise.all([
    getCollection('temas'),
    getCollection('articulos'),
    getCollection('videos'),
    getCollection('glosario'),
    getCollection('herramientas'),
  ]);

  // Origen con base incluida: `site` es solo el origen, la base la aporta `url()`.
  const origen = new URL(url('/'), site ?? new URL(ORIGEN_POR_DEFECTO)).href.replace(/\/$/, '');
  const temasOk = publicados(temas).sort((a, b) => a.data.orden - b.data.orden);
  const articulosOk = publicados(articulos).sort(
    (a, b) =>
      (b.data.publicado ?? b.data.creado).getTime() - (a.data.publicado ?? a.data.creado).getTime(),
  );
  const videosOk = publicados(videos)
    .filter((v) => v.data.estado_youtube === 'publico' && v.data.privacidad_api === 'public')
    .sort(
      (a, b) =>
        (b.data.publicado_en ?? b.data.publicado ?? b.data.creado).getTime() -
        (a.data.publicado_en ?? a.data.publicado ?? a.data.creado).getTime(),
    );
  const glosarioOk = publicados(glosario).sort((a, b) => a.data.termino.localeCompare(b.data.termino, 'es'));
  const herramientasOk = publicados(herramientas).filter(
    (h) => h.data.estado_implementacion !== 'no-implementada',
  );

  const ultima = [...articulosOk, ...videosOk]
    .map((e) => e.data.actualizado ?? e.data.publicado ?? e.data.creado)
    .filter((d): d is Date => d instanceof Date)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const lineas = [
    `# ${MARCA} · ${SECCION}`,
    '',
    '> Publicación editorial en español sobre economía personal en España: nómina e IRPF, inflación, ahorro, inversión, banca y vivienda. Cada cifra lleva fuente oficial y fecha de consulta. No es asesoramiento financiero individualizado.',
    '',
    `${MARCA} es un proyecto editorial independiente. Escribe y revisa Marc Villarroya. El contenido es HTML estático, sin muros de pago, sin cookies propias y sin registro. Idioma: es-ES. Última actualización de contenido: ${fecha(ultima) || 'sin fecha'}.`,
    '',
    '## Canónico',
    '',
    `- [${origen}/](${origen}/) es la única URL canónica del sitio. \`www.${origen.replace(/^https?:\/\//, '')}\` redirige aquí y no debe citarse.`,
    `- Versión con el texto completo de todas las páginas: ${origen}/llms-full.txt`,
    `- Mapa del sitio: ${origen}/sitemap-index.xml`,
    '',
    '## Secciones',
    '',
    `- [Temas troncales](${origen}${ruta.temas()}): ${temasOk.length} recorridos editoriales con orden de lectura recomendado.`,
    `- [Guías](${origen}${ruta.guias()}): ${articulosOk.length} explicadores con fuentes fechadas y revisión factual.`,
    `- [Vídeos](${origen}${ruta.videos()}): ${videosOk.length} fichas de vídeos del canal, con datos verificados en YouTube.`,
    `- [Glosario](${origen}${ruta.glosario()}): ${glosarioOk.length} términos con definición corta, ejemplo y uso.`,
    `- [Herramientas](${origen}${ruta.herramientas()}): ${herramientasOk.length} calculadoras que funcionan en el navegador sin enviar datos.`,
    '',
    '## Datos para agentes',
    '',
    `- [Guías](${origen}/data/catalog.json) · [Temas](${origen}/data/topics.json) · [Vídeos](${origen}/data/videos.json) · [Herramientas](${origen}/data/tools.json) · [Glosario](${origen}/data/glossary.json): JSON plano sin autenticación, \`schema_version\` ${SCHEMA_VERSION}. Cada catálogo cubre una colección; no hay un único fichero con todo.`,
    `- [Novedades RSS](${origen}/rss.xml): guías y vídeos ordenados por fecha.`,
    '',
    '## Temas',
    '',
    ...temasOk.map(
      (t) => `- [${t.data.titulo}](${origen}${ruta.tema(t.data.slug)}): ${t.data.descripcion_corta}`,
    ),
    '',
  ];

  if (articulosOk.length) {
    lineas.push(
      '## Guías',
      '',
      ...articulosOk.map(
        (a) =>
          `- [${a.data.titulo}](${origen}${ruta.guia(a.data.slug)}): ${a.data.seo.descripcion ?? a.data.resumen} (${fecha(a.data.publicado ?? a.data.creado)})`,
      ),
      '',
    );
  }
  if (videosOk.length) {
    lineas.push(
      '## Vídeos',
      '',
      ...videosOk.map(
        (v) =>
          `- [${v.data.titulo}](${origen}${ruta.video(v.data.slug)}): vídeo de YouTube ${v.data.youtube_id}, ${v.data.duracion_iso} (${fecha(v.data.publicado_en ?? v.data.publicado)}).`,
      ),
      '',
    );
  }
  if (glosarioOk.length) {
    lineas.push(
      '## Glosario',
      '',
      ...glosarioOk.map(
        (g) => `- [${g.data.termino}](${origen}${ruta.termino(g.data.slug)}): ${g.data.definicion_corta}`,
      ),
      '',
    );
  }
  if (herramientasOk.length) {
    lineas.push(
      '## Herramientas',
      '',
      ...herramientasOk.map(
        (h) => `- [${h.data.titulo}](${origen}${ruta.herramienta(h.data.slug)}): ${h.data.descripcion}`,
      ),
      '',
    );
  }

  lineas.push(
    '## Cómo citar',
    '',
    `- Cita el título de la página y su URL canónica. Si mencionas una cifra, incluye la fecha de publicación o de revisión que figura en la propia página.`,
    `- La fuente primaria de cada dato está enlazada en la sección «Fuentes» de cada guía y en ${origen}/metodologia/.`,
    `- No atribuyas recomendaciones de inversión: el sitio explica cálculos y normativa, no aconseja carteras.`,
    '',
    '## Límites',
    '',
    '- Contenido con fecha de vigencia: las cifras fiscales y los tipos cambian; comprueba la fecha antes de reutilizar un número.',
    '- Sin ratings, sin precios de terceros y sin recomendaciones individualizadas.',
    '- Lo que no está publicado en HTML tampoco aparece aquí: los borradores no se listan.',
    '- Para entrenamiento de modelos, consulta `Content-Signal` en /robots.txt.',
    '',
  );

  return new Response(lineas.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
