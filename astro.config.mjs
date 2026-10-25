// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Origen y base configurables por entorno: nunca hardcodear un dominio no registrado.
const SITE = process.env.SITE_ORIGIN ?? 'https://marcvillarroya.github.io';
const BASE = process.env.SITE_BASE ?? '/4sotas';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  build: { format: 'directory' },
  output: 'static',
  integrations: [sitemap()],
});
