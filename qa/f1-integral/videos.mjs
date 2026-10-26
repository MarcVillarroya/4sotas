// Verificación de IDs de vídeo: ficha vs snapshot de la API vs YouTube real (oEmbed + thumbnail).
// Uso: node qa/f1-integral/videos.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const dir = 'src/content/videos';
const inv = JSON.parse(readFileSync('data/inventory-snapshot.json', 'utf8'));
const porId = new Map(inv.videos.map((v) => [v.videoId, v]));
const fichas = readdirSync(dir).filter((f) => f.endsWith('.yaml')).map((f) => {
  const y = parse(readFileSync(join(dir, f), 'utf8'));
  return { archivo: f, id: y.id, youtube: y.youtube_id ?? y.youtubeId ?? y.videoId, status: y.status, titulo: y.titulo ?? y.title, slug: y.slug };
});

const filas = [];
let fallosNetos = 0;
for (const f of fichas) {
  const enSnapshot = porId.get(f.youtube);
  const fila = { archivo: f.archivo, idFicha: f.id, youtube: f.youtube, status: f.status, slug: f.slug, enSnapshot: Boolean(enSnapshot), snapshotTitulo: enSnapshot?.title?.slice(0, 60) ?? null };
  // ¿el id aparece en alguna ficha?
  if (!enSnapshot) { fila.veredicto = 'ID NO ESTÁ EN EL SNAPSHOT DE LA API'; fallosNetos += 1; filas.push(fila); continue; }
  // oEmbed real (sin token): 200 solo si el vídeo existe y es público/embebible
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${f.youtube}&format=json`, { signal: AbortSignal.timeout(15000) });
    fila.oembedStatus = r.status;
    if (r.ok) {
      const j = await r.json();
      fila.oembedTitulo = j.title;
      fila.thumbnail = j.thumbnail_url;
      const t = await fetch(j.thumbnail_url, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
      fila.thumbStatus = t.status;
      fila.matchTituloSnapshot = j.title.trim().slice(0, 40) === (enSnapshot.title ?? '').trim().slice(0, 40);
      fila.veredicto = 'ID REAL (oEmbed 200)';
    } else if (r.status === 401 || r.status === 403) {
      fila.veredicto = `privado/no embebible (oEmbed ${r.status})`;
    } else {
      fila.veredicto = `oEmbed ${r.status}`;
    }
  } catch (e) {
    fila.veredicto = `error de red: ${e.message}`;
  }
  filas.push(fila);
}

// Fichas publicadas que no tengan id real son bloqueantes; las privadas solo si status=publicado
const publicadasSinId = filas.filter((f) => f.status === 'publicado' && !String(f.veredicto).startsWith('ID REAL'));
console.log(filas.map((f) => JSON.stringify(f)).join('\n'));
console.log(`\nRESUMEN fichas=${filas.length} publicadas=${filas.filter((f) => f.status === 'publicado').length} idsNoEnSnapshot=${filas.filter((f) => !f.enSnapshot).length} publicadasSinIdReal=${publicadasSinId.length}`);
process.exit(publicadasSinId.length === 0 ? 0 : 1);
