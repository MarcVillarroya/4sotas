/**
 * /llms-full.txt — texto completo del contenido publicado, en Markdown plano, para agentes
 * que necesitan leer sin trocear HTML. Se deriva de las mismas colecciones y del mismo filtro
 * de publicación que el resto del sitio: no es una copia mantenida a mano.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { publicados } from '../lib/publicacion.ts';
import { MARCA, ORIGEN_POR_DEFECTO, SECCION, ruta, url } from '../lib/rutas.ts';

const fecha = (d?: Date) => (d ? d.toISOString().slice(0, 10) : '');
const plural = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`;

/**
 * Baja dos niveles los encabezados del cuerpo: cada página ya abre con `## <título>`,
 * así que su `#`/`##` original debe colgar de ahí y no romper la jerarquía del documento.
 */
const cuerpoRebajado = (md: string): string =>
  md.replace(/^(#{1,6})\s+/gm, (_, h: string) => `${'#'.repeat(Math.min(6, h.length + 2))} `);

export const GET: APIRoute = async ({ site }) => {
  const [temas, articulos, videos, glosario, herramientas, fuentes] = await Promise.all([
    getCollection('temas'),
    getCollection('articulos'),
    getCollection('videos'),
    getCollection('glosario'),
    getCollection('herramientas'),
    getCollection('fuentes'),
  ]);

  const origen = new URL(url('/'), site ?? new URL(ORIGEN_POR_DEFECTO)).href.replace(/\/$/, '');

  const fuentesPorId = new Map(fuentes.map((f) => [f.id, f.data]));
  const citaFuente = (ref: unknown): string => {
    const id = typeof ref === 'string' ? ref : String((ref as { id?: string })?.id ?? '');
    const f = fuentesPorId.get(id);
    return f ? `  - ${f.editor}: ${f.titulo} — ${f.url} (consultado ${fecha(f.consultado_en)})` : '';
  };

  const temasOk = publicados(temas).sort((a, b) => a.data.orden - b.data.orden);
  const articulosOk = publicados(articulos).sort(
    (a, b) => (b.data.publicado ?? b.data.creado).getTime() - (a.data.publicado ?? a.data.creado).getTime(),
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

  const lineas: string[] = [
    `# ${MARCA} · ${SECCION} — contenido completo`,
    '',
    '> Publicación editorial en español sobre economía personal en España. Cada cifra lleva fuente oficial y fecha. No es asesoramiento financiero individualizado.',
    '',
    `Origen canónico: ${origen}/`,
    `Resumen para agentes: ${origen}/llms.txt`,
    `Idioma: es-ES. Contenido dinámico: ninguno; este texto se genera en el build desde las mismas fuentes que el HTML.`,
    '',
    '## Índice',
    '',
    `- ${plural(temasOk.length, 'tema', 'temas')}`,
    `- ${plural(articulosOk.length, 'guía', 'guías')}`,
    `- ${plural(videosOk.length, 'ficha de vídeo', 'fichas de vídeo')}`,
    `- ${plural(glosarioOk.length, 'término', 'términos')} de glosario`,
    `- ${plural(herramientasOk.length, 'herramienta', 'herramientas')}`,
    '',
    '---',
    '',
    '# Temas troncales',
    '',
  ];

  for (const t of temasOk) {
    lineas.push(
      `## ${t.data.titulo}`,
      '',
      `URL: ${origen}${ruta.tema(t.data.slug)}`,
      `Orden: ${t.data.orden}. Actualizado: ${fecha(t.data.actualizado ?? t.data.publicado ?? t.data.creado)}.`,
      '',
      t.data.descripcion_corta,
      '',
    );
    if (t.body?.trim()) lineas.push(cuerpoRebajado(t.body.trim()), '');
  }

  lineas.push('---', '', '# Guías', '');

  for (const a of articulosOk) {
    lineas.push(
      `## ${a.data.titulo}`,
      '',
      `URL: ${origen}${ruta.guia(a.data.slug)}`,
      `Publicada: ${fecha(a.data.publicado ?? a.data.creado)}. Revisión factual: ${fecha(a.data.revisado_factual)}. Tipo: ${a.data.tipo}. Nivel: ${a.data.nivel}.`,
      '',
      `**Respuesta corta.** ${a.data.resumen}`,
      '',
    );
    if (a.body?.trim()) lineas.push(cuerpoRebajado(a.body.trim()), '');
    if (a.data.preguntas?.length) {
      lineas.push('### Preguntas que responde esta página', '');
      for (const p of a.data.preguntas) lineas.push(`- **${p.pregunta}** ${p.respuesta}`);
      lineas.push('');
    }
    const citas = (a.data.fuentes ?? []).map((f) => citaFuente(f.fuente)).filter(Boolean);
    if (citas.length) lineas.push('### Fuentes', '', ...citas, '');
  }

  lineas.push('---', '', '# Fichas de vídeo', '');

  for (const v of videosOk) {
    lineas.push(
      `## ${v.data.titulo}`,
      '',
      `URL: ${origen}${ruta.video(v.data.slug)}`,
      `Vídeo: https://www.youtube.com/watch?v=${v.data.youtube_id} · Duración: ${v.data.duracion_iso} · Publicado: ${fecha(v.data.publicado_en ?? v.data.publicado)}.`,
      '',
      v.data.descripcion_corta,
      '',
    );
    if (v.data.informacion?.resumen) lineas.push(v.data.informacion.resumen, '');
    if (v.data.informacion?.que_cubre?.length) {
      lineas.push('Qué cubre:', '', ...v.data.informacion.que_cubre.map((x) => `- ${x}`), '');
    }
    if (v.data.capitulos?.length) {
      lineas.push(
        'Capítulos:',
        '',
        ...v.data.capitulos.map((c) => {
          const s = c.segundo ?? 0;
          const mm = String(Math.floor(s / 60)).padStart(2, '0');
          const ss = String(s % 60).padStart(2, '0');
          return `- ${mm}:${ss} ${c.titulo}`;
        }),
        '',
      );
    }
  }

  lineas.push('---', '', '# Glosario', '');

  for (const g of glosarioOk) {
    lineas.push(
      `## ${g.data.termino}`,
      '',
      `URL: ${origen}${ruta.termino(g.data.slug)}`,
      '',
      g.data.definicion_corta,
      '',
    );
    if (g.body?.trim()) lineas.push(cuerpoRebajado(g.body.trim()), '');
  }

  lineas.push('---', '', '# Herramientas', '');

  for (const h of herramientasOk) {
    lineas.push(
      `## ${h.data.titulo}`,
      '',
      `URL: ${origen}${ruta.herramienta(h.data.slug)}`,
      `Calcula en el navegador, sin enviar datos. Estado: ${h.data.estado_implementacion}. Versión del motor: ${h.data.version_motor}.`,
      '',
      h.data.descripcion,
      '',
      `**Fórmula.** ${h.data.formula}`,
      '',
    );
    if (h.data.supuestos?.length) lineas.push('Supuestos:', '', ...h.data.supuestos.map((x) => `- ${x}`), '');
    if (h.data.limites?.length) lineas.push('Límites:', '', ...h.data.limites.map((x) => `- ${x}`), '');
  }

  const total = [temasOk.length, articulosOk.length, videosOk.length, glosarioOk.length, herramientasOk.length];

  lineas.push(
    '---',
    '',
    '## Uso y cita',
    '',
    '- Cita el título de la página y su URL canónica; si usas una cifra, incluye la fecha de publicación o revisión.',
    '- Las fuentes primarias enlazadas arriba son la referencia de cada dato; la metodología completa está en ' +
      `${origen}/metodologia/.`,
    '- No atribuyas recomendaciones de inversión: el sitio explica cálculos y normativa.',
    `- Generado en el build el ${new Date().toISOString().slice(0, 10)}. Recuento: ${total.join(' / ')} (temas / guías / vídeos / términos / herramientas).`,
    '',
  );

  return new Response(lineas.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
