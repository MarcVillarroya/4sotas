/**
 * /rss.xml — novedades del sitio (guías y fichas de vídeo), RSS 2.0.
 * Se deriva del mismo filtro de publicación que el HTML: lo que no está publicado no sale.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { publicados } from '../lib/publicacion.ts';
import { MARCA, ORIGEN_POR_DEFECTO, SECCION, ruta, url } from '../lib/rutas.ts';

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const rfc822 = (d: Date) => d.toUTCString();

export const GET: APIRoute = async ({ site }) => {
  const [articulos, videos] = await Promise.all([getCollection('articulos'), getCollection('videos')]);
  const origen = new URL(url('/'), site ?? new URL(ORIGEN_POR_DEFECTO)).href.replace(/\/$/, '');

  type Item = { titulo: string; url: string; descripcion: string; fecha: Date };

  const items: Item[] = [
    ...publicados(articulos).map((a) => ({
      titulo: a.data.titulo,
      url: `${origen}${ruta.guia(a.data.slug)}`,
      descripcion: a.data.seo.descripcion ?? a.data.resumen,
      fecha: a.data.publicado ?? a.data.actualizado ?? a.data.creado,
    })),
    ...publicados(videos)
      .filter((v) => v.data.estado_youtube === 'publico' && v.data.privacidad_api === 'public')
      .map((v) => ({
        titulo: v.data.titulo,
        url: `${origen}${ruta.video(v.data.slug)}`,
        descripcion: v.data.seo.descripcion ?? v.data.descripcion_corta,
        fecha: v.data.publicado_en ?? v.data.publicado ?? v.data.creado,
      })),
  ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  const cuerpo = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${esc(`${MARCA} · ${SECCION}`)}</title>`,
    `    <link>${esc(`${origen}/`)}</link>`,
    `    <description>${esc('Guías y vídeos de economía personal en España, con fuentes fechadas.')}</description>`,
    '    <language>es-ES</language>',
    `    <lastBuildDate>${rfc822(items[0]?.fecha ?? new Date())}</lastBuildDate>`,
    `    <atom:link href="${esc(`${origen}/rss.xml`)}" rel="self" type="application/rss+xml" />`,
    ...items.map((i) =>
      [
        '    <item>',
        `      <title>${esc(i.titulo)}</title>`,
        `      <link>${esc(i.url)}</link>`,
        `      <guid isPermaLink="true">${esc(i.url)}</guid>`,
        `      <pubDate>${rfc822(i.fecha)}</pubDate>`,
        `      <description>${esc(i.descripcion)}</description>`,
        '    </item>',
      ].join('\n'),
    ),
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  return new Response(cuerpo, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
