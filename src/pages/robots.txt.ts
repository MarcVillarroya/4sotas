/**
 * robots.txt derivado: el `Sitemap:` se compone desde el origen configurado (nunca a mano).
 * Política de agentes decidida en architecture/SEO-AGENT.md §3.
 */
import type { APIRoute } from 'astro';
import { ORIGEN_POR_DEFECTO, url } from '../lib/rutas.ts';

export const GET: APIRoute = ({ site }) => {
  const origen = site ?? new URL(ORIGEN_POR_DEFECTO);
  const sitemap = new URL(url('/sitemap-index.xml'), origen).href;

  const cuerpo = [
    '# 4 Sotas — sitio de proyecto en GitHub Pages (/4sotas/)',
    '# Aviso: en un sitio de proyecto, los rastreadores solo leen /robots.txt en la raíz del origen',
    '# (marcvillarroya.github.io), no en /4sotas/robots.txt. Estas reglas quedan como documentación de',
    '# intención; el control efectivo se hace con <meta name="robots"> en cada página.',
    'User-agent: *',
    'Allow: /',
    '',
    '# Búsqueda: permitida explícitamente',
    'User-agent: Googlebot',
    'Allow: /',
    'User-agent: Bingbot',
    'Allow: /',
    'User-agent: OAI-SearchBot',
    'Allow: /',
    'User-agent: PerplexityBot',
    'Allow: /',
    'User-agent: ChatGPT-User',
    'Allow: /',
    '',
    '# Entrenamiento: denegado por defecto (decisión del propietario)',
    'User-agent: GPTBot',
    'Disallow: /',
    'User-agent: ClaudeBot',
    'Disallow: /',
    'User-agent: Google-Extended',
    'Disallow: /',
    'User-agent: CCBot',
    'Disallow: /',
    'User-agent: Bytespider',
    'Disallow: /',
    '',
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');

  return new Response(cuerpo, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
