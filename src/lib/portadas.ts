import type { CollectionEntry } from 'astro:content';
import { publicados, idRef, porFechaDesc } from './publicacion.ts';

/** Selección compartida, sin duplicar inventarios ni incluir borradores. */
export async function contenidoPortadas() {
  const { getCollection } = await import('astro:content');
  const [ts, as, vs, hs, gs] = await Promise.all([
    getCollection('temas'), getCollection('articulos'), getCollection('videos'),
    getCollection('herramientas'), getCollection('glosario'),
  ]);
  return seleccionarPortadas(ts, as, vs, hs, gs);
}

/** Función pura para probar reglas editoriales y aislamiento de publicación. */
export function seleccionarPortadas(
  ts: CollectionEntry<'temas'>[], as: CollectionEntry<'articulos'>[],
  vs: CollectionEntry<'videos'>[], hs: CollectionEntry<'herramientas'>[],
  gs: CollectionEntry<'glosario'>[],
) {
  const temas = publicados(ts).sort((a, b) => a.data.orden - b.data.orden);
  const guias = publicados(as).sort(porFechaDesc);
  const videos = publicados(vs)
    .filter(v => v.data.estado_youtube === 'publico' && v.data.privacidad_api === 'public')
    .sort((a, b) => b.data.publicado_en.getTime() - a.data.publicado_en.getTime() || a.id.localeCompare(b.id));
  const herramientas = publicados(hs).filter(h => h.data.estado_implementacion !== 'no-implementada');
  const iniciales = guias.filter(g => g.data.destacado).slice(0, 3);
  const referencias = new Set(iniciales.flatMap(g => g.data.glosario.map(idRef)));
  const glosario = publicados(gs).filter(g => referencias.has(g.id))
    .sort((a, b) => a.data.termino.localeCompare(b.data.termino, 'es')).slice(0, 6);
  const mapa = temas.map(t => ({
    tema: t,
    guias: guias.filter(g => g.data.temas.some(r => idRef(r) === t.id)).length,
    videos: videos.filter(v => v.data.temas.some(r => idRef(r) === t.id)).length,
  }));
  return { temas, guias, iniciales, videos, destacado: videos[0], recientes: videos.slice(0, 3),
    calculadora: herramientas.find(h => h.data.slug === 'interes-compuesto'), glosario, mapa };
}
