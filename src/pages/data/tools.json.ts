/** /data/tools.json — solo herramientas publicadas e implementadas. */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { catalogoHerramientas } from '../../lib/catalogos.ts';

export const GET: APIRoute = async () => {
  const items = await getCollection('herramientas');
  const cuerpo = catalogoHerramientas(items, new Date().toISOString());
  return new Response(JSON.stringify(cuerpo, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
