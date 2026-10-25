#!/usr/bin/env node
/**
 * Genera las imágenes Open Graph estáticas (1200×630) desde design/tokens.css.
 * No se ejecuta en CI: las PNG resultantes se versionan en public/assets/og/.
 * Uso: node scripts/build-og.mjs [ruta-a-chromium]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const TMP = path.join(ROOT, '.og-tmp');
const SALIDA = path.join(ROOT, 'public/assets/og');
const CHROMIUM =
  process.argv[2] ?? ['/snap/bin/chromium', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));

if (!CHROMIUM) {
  console.error('build-og: no se encontró Chromium. Pasa la ruta como argumento.');
  process.exit(2);
}

const TARJETAS = [
  {
    fichero: '4sotas.png',
    etiqueta: 'Cuatro palos. Una mirada curiosa.',
    titulo: 'La vida no viene con instrucciones.',
    pie: '4 Sotas · economía cotidiana en España',
  },
  {
    fichero: 'oros.png',
    etiqueta: 'Sota de Oros · economía cotidiana',
    titulo: 'Tu dinero, con las cartas claras.',
    pie: 'Fuentes fechadas. Sin promesas de rentabilidad.',
  },
];

const escapar = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const html = (t) => `<!doctype html>
<html lang="es-ES"><head><meta charset="utf-8">
<style>
@font-face{font-family:Inter;src:url('file://${ROOT}/src/assets/fonts/inter-latin-400-normal.woff2') format('woff2');font-weight:400;font-display:block}
@font-face{font-family:Inter;src:url('file://${ROOT}/src/assets/fonts/inter-latin-700-normal.woff2') format('woff2');font-weight:700;font-display:block}
@font-face{font-family:'Archivo Black';src:url('file://${ROOT}/src/assets/fonts/archivo-black-latin-400-normal.woff2') format('woff2');font-weight:400;font-display:block}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#0b1526;color:#f6f0e4;font-family:Inter,sans-serif;padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}
.marco{position:absolute;inset:24px;border:2px solid #f0d878;pointer-events:none}
.etiqueta{font:700 24px 'Archivo Black',sans-serif;text-transform:uppercase;letter-spacing:.06em;color:#f0d878}
h1{font-family:'Archivo Black',sans-serif;font-weight:400;font-size:82px;line-height:1.02;letter-spacing:-.03em;max-width:16ch}
.pie{font-size:28px;color:#bdc8d8;max-width:28ch;border-top:1px solid #74869d;padding-top:24px}
.sello{position:absolute;right:72px;top:56px;width:150px;height:165px}
</style></head>
<body><div class="marco"></div>
<div><p class="etiqueta">${escapar(t.etiqueta)}</p></div>
<img class="sello" src="file://${ROOT}/public/assets/mark.svg" alt="" width="150" height="165">
<h1>${escapar(t.titulo)}</h1>
<p class="pie">${escapar(t.pie)}</p>
</body></html>`;

fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(SALIDA, { recursive: true });

for (const t of TARJETAS) {
  const ficheroHtml = path.join(TMP, `${t.fichero}.html`);
  fs.writeFileSync(ficheroHtml, html(t));
  const destino = path.join(SALIDA, t.fichero);
  execFileSync(
    CHROMIUM,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=1200,630',
      `--screenshot=${destino}`,
      `file://${ficheroHtml}`,
    ],
    { stdio: 'pipe' },
  );
  const bytes = fs.statSync(destino).size;
  console.log(`og: ${t.fichero} ${bytes} bytes`);
}

fs.rmSync(TMP, { recursive: true, force: true });
