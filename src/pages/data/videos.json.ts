/** /data/videos.json — solo vídeos con ficha publicada y estado público comprobado. */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { catalogoVideos } from '../../lib/catalogos.ts';

export const GET: APIRoute = async () => {
  const items = await getCollection('videos');
  const cuerpo = catalogoVideos(items, new Date().toISOString());
  return new Response(JSON.stringify(cuerpo, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
