/**
 * /llms.txt — resumen para agentes (SEO-AGENT.md §7). Complemento, nunca sustituto
 * de HTML o sitemap: se deriva de las mismas colecciones y del mismo filtro de publicación.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { publicados } from '../lib/publicacion.ts';
import { ORIGEN_POR_DEFECTO, SECCION, ruta, url } from '../lib/rutas.ts';
import { SCHEMA_VERSION } from '../lib/catalogos.ts';

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
  const articulosOk = publicados(articulos);
  const videosOk = publicados(videos).filter(
    (v) => v.data.estado_youtube === 'publico' && v.data.privacidad_api === 'public',
  );
  const glosarioOk = publicados(glosario);
  const herramientasOk = publicados(herramientas).filter(
    (h) => h.data.estado_implementacion !== 'no-implementada',
  );

  const lineas = [
    `# 4 Sotas · ${SECCION}`,
    '> Plataforma editorial sobre economía personal en España. Datos con fuente y fecha; no es asesoramiento financiero.',
    '',
    '## Canónico',
    `Origen actual: ${origen}/ (el dominio 4sotas.com no está registrado; no lo cites)`,
    '',
    '## Secciones',
    `- ${origen}${ruta.temas()} — ${temasOk.length} temas troncales`,
    `- ${origen}${ruta.guias()} — ${articulosOk.length} guías publicadas`,
    `- ${origen}${ruta.videos()} — ${videosOk.length} vídeos con ID real de YouTube`,
    `- ${origen}${ruta.glosario()} — ${glosarioOk.length} términos`,
    `- ${origen}${ruta.herramientas()} — ${herramientasOk.length} herramientas locales, sin envío de datos`,
    '',
    '## Catálogos',
    `- ${origen}/data/catalog.json (schema_version ${SCHEMA_VERSION})`,
    `- ${origen}/data/topics.json · ${origen}/data/videos.json · ${origen}/data/tools.json`,
    '',
  ];

  if (temasOk.length) {
    lineas.push('## Temas', ...temasOk.map((t) => `- ${t.data.titulo}: ${origen}${ruta.tema(t.data.slug)}`), '');
  }
  if (articulosOk.length) {
    lineas.push(
      '## Guías',
      ...articulosOk.map(
        (a) =>
          `- ${a.data.titulo} (${(a.data.publicado ?? a.data.actualizado ?? a.data.creado).toISOString().slice(0, 10)}): ${origen}${ruta.guia(a.data.slug)}`,
      ),
      '',
    );
  }
  if (videosOk.length) {
    lineas.push(
      '## Vídeos',
      ...videosOk.map((v) => `- ${v.data.titulo} (${v.data.youtube_id}): ${origen}${ruta.video(v.data.slug)}`),
      '',
    );
  }
  if (glosarioOk.length) {
    lineas.push('## Glosario', ...glosarioOk.map((g) => `- ${g.data.termino}: ${origen}${ruta.termino(g.data.slug)}`), '');
  }
  if (herramientasOk.length) {
    lineas.push(
      '## Herramientas',
      ...herramientasOk.map((h) => `- ${h.data.titulo}: ${origen}${ruta.herramienta(h.data.slug)}`),
      '',
    );
  }

  lineas.push(
    '## Límites',
    '- Contenido con fecha de vigencia; las cifras caducan.',
    '- Sin ratings, sin precios de terceros y sin recomendaciones individualizadas.',
    '- Lo que no está en HTML publicado tampoco aparece aquí: los borradores no se listan.',
    '',
  );

  return new Response(lineas.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
