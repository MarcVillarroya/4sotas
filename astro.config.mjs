// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import enlacesConBase from './scripts/remark-enlaces-base.mjs';
import jerarquiaEditorial from './scripts/remark-jerarquia.mjs';

// Origen y base configurables por entorno: nunca hardcodear un dominio no registrado.
const SITE = process.env.SITE_ORIGIN ?? 'https://marcvillarroya.github.io';
const BASE = process.env.SITE_BASE ?? '/4sotas';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  build: { format: 'directory' },
  output: 'static',
  markdown: {
    // Los cuerpos Markdown escriben enlaces raíz (`/oros/...`): se prefijan con la base
    // del despliegue para que no queden fuera de `/4sotas/`.
    remarkPlugins: [[enlacesConBase, { base: BASE }], jerarquiaEditorial],
  },
  integrations: [sitemap()],
});
