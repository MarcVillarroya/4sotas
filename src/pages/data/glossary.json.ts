/** /data/glossary.json — glosario completo, misma función de publicación que el HTML. */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { catalogoGlosario } from '../../lib/catalogos.ts';

export const GET: APIRoute = async () => {
  const items = await getCollection('glosario');
  const cuerpo = catalogoGlosario(items, new Date().toISOString());
  return new Response(JSON.stringify(cuerpo, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
