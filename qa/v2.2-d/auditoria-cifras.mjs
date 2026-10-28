// Auditoría de honestidad: toda cifra del bloque `informacion` debe existir en la fuente
// (descripción oficial capturada en audit/yt_raw.json; para DzH02NfDqM4, además el guion de voz).
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import YAML from 'yaml';

const raw = JSON.parse(await readFile(resolve('../audit/yt_raw.json'), 'utf8'));
const desc = Object.fromEntries(raw.videos.map((v) => [v.videoId, v.description || '']));
const guion = await readFile(resolve('packs/guiones/DzH02NfDqM4-voz-lineas.txt'), 'utf8');

const canon = (t) => {
  const n = Number(t.replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(n)) return t;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
};
const nums = (s) => [...(s || '').replace(/\u00a0/g, ' ').matchAll(/\d[\d.]*(?:,\d+)?/g)].map((m) => m[0]);

const files = (await readdir(resolve('src/content/videos'))).filter((f) => f.endsWith('.yaml'));
const out = [];
for (const f of files.sort()) {
  const d = YAML.parse(await readFile(resolve('src/content/videos', f), 'utf8'));
  const info = d.informacion || {};
  const texto = [info.resumen || '', ...(info.que_cubre || []), ...(info.que_no_cubre || []), d.descripcion_corta || ''].join(' ');
  let src = desc[d.youtube_id] || '';
  if (d.youtube_id === 'DzH02NfDqM4') src += ' ' + guion;
  const sn = new Set(nums(src).map(canon));
  const noHalladas = nums(texto).filter((t) => !sn.has(canon(t)));
  out.push({ ficha: f, youtube_id: d.youtube_id, estado: info.estado, heredado: info.heredado, cifras: nums(texto).length, noHalladas });
}
console.log(JSON.stringify(out, null, 1));
console.log('TOTAL fichas:', out.length, '· con cifras no halladas:', out.filter((o) => o.noHalladas.length).length);
