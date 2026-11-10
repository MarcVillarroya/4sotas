/**
 * robots.txt derivado: una única fuente de verdad (el fichero público `public/robots.txt`
 * ya no existe). El `Sitemap:` se compone desde el origen configurado.
 *
 * Política de agentes (decidida por el propietario, revisable):
 *  - Búsqueda y respuesta con cita: permitidas explícitamente (Google, Bing y los
 *    rastreadores de respuesta de OpenAI, Anthropic, Perplexity y Apple).
 *  - Entrenamiento de modelos: denegado por defecto.
 *  - Content-Signal lo declara de forma legible para los agentes que lo leen.
 */
import type { APIRoute } from 'astro';
import { ORIGEN_POR_DEFECTO, url } from '../lib/rutas.ts';

export const GET: APIRoute = ({ site }) => {
  const origen = site ?? new URL(ORIGEN_POR_DEFECTO);
  const sitemap = new URL(url('/sitemap-index.xml'), origen).href;
  const llms = new URL(url('/llms.txt'), origen).href;

  const cuerpo = [
    `# 4 Sotas — ${origen.origin}`,
    `# Guía para agentes: ${llms}`,
    '',
    'Content-Signal: search=yes, ai-input=yes, ai-train=no',
    '',
    'User-agent: *',
    'Allow: /',
    'Disallow: /wp-admin/',
    'Disallow: /wp-login.php',
    'Disallow: /xmlrpc.php',
    '',
    '# ── Búsqueda: permitida ──',
    'User-agent: Googlebot',
    'Allow: /',
    'User-agent: Googlebot-Image',
    'Allow: /',
    'User-agent: Bingbot',
    'Allow: /',
    'User-agent: DuckDuckBot',
    'Allow: /',
    'User-agent: Applebot',
    'Allow: /',
    '',
    '# ── Agentes de IA que responden citando la fuente: permitidos ──',
    'User-agent: OAI-SearchBot',
    'Allow: /',
    'User-agent: ChatGPT-User',
    'Allow: /',
    'User-agent: Claude-SearchBot',
    'Allow: /',
    'User-agent: Claude-User',
    'Allow: /',
    'User-agent: PerplexityBot',
    'Allow: /',
    'User-agent: Perplexity-User',
    'Allow: /',
    '',
    '# ── Rastreadores de entrenamiento: denegados por defecto ──',
    'User-agent: GPTBot',
    'Disallow: /',
    'User-agent: ClaudeBot',
    'Disallow: /',
    'User-agent: Google-Extended',
    'Disallow: /',
    'User-agent: Applebot-Extended',
    'Disallow: /',
    'User-agent: CCBot',
    'Disallow: /',
    'User-agent: Bytespider',
    'Disallow: /',
    'User-agent: meta-externalagent',
    'Disallow: /',
    '',
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');

  return new Response(cuerpo, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
