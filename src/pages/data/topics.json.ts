/** /data/topics.json — catálogo de temas troncales publicados (DATA-MODEL.md §6). */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { catalogoTemas } from '../../lib/catalogos.ts';

export const GET: APIRoute = async () => {
  const items = await getCollection('temas');
  const cuerpo = catalogoTemas(items, new Date().toISOString());
  return new Response(JSON.stringify(cuerpo, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
