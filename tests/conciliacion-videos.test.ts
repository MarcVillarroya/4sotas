import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import { aplicarCambios, conciliar, leerFichas, resolverInterprete, PYTHON_POR_DEFECTO } from '../scripts/conciliar-videos.mjs';

/* Fixture mínima de ficha: solo los campos que la conciliación lee o debe respetar. */
const ficha = (extra: Record<string, unknown> = {}) => ({
  id: 'vid-AAAAAAAAAAA',
  youtube_id: 'AAAAAAAAAAA',
  status: 'revision',
  titulo: 'Título editorial que nadie debe reescribir',
  descripcion_corta: 'Descripción corta editorial que la conciliación no toca nunca.',
  slug: 'pieza-de-prueba',
  publicado_en: '2026-10-01',
  duracion_iso: 'PT53S',
  estado_youtube: 'programado',
  privacidad_api: 'private',
  verificado_en: '2026-10-20',
  miniatura: 'https://i.ytimg.com/vi/AAAAAAAAAAA/maxresdefault.jpg',
  seo: { descripcion: 'Descripción SEO editorial intacta, con longitud suficiente para el esquema.', noindex: false },
  temas: ['tema-ahorro'],
  relacionados: [],
  informacion: {
    estado: 'completo',
    resumen: 'Resumen editorial que la conciliación nunca debe reescribir, porque es copy y no un dato del canal.',
    que_cubre: ['Punto uno del resumen editorial', 'Punto dos del resumen editorial'],
    que_no_cubre: ['Nada, es un fixture'],
    para_quien: 'Para quien prueba la conciliación sin tocar el canal.',
    origen: 'descripcion-oficial',
    faltan: [],
    heredado: false,
  },
  ...extra,
});

const video = (extra: Record<string, unknown> = {}) => ({
  videoId: 'AAAAAAAAAAA',
  title: 'Título real del canal',
  privacy_status: 'public',
  publish_at: null,
  published_at: '2026-10-02T13:30:00Z',
  duration_iso8601: 'PT54S',
  thumbnail_url: 'https://i.ytimg.com/vi/AAAAAAAAAAA/maxresdefault.jpg',
  stats: { viewCount: '321' },
  ...extra,
});

const montar = (fichas: Record<string, Record<string, unknown>>) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), '4sotas-conc-'));
  for (const [archivo, datos] of Object.entries(fichas)) fs.writeFileSync(path.join(dir, archivo), YAML.stringify(datos), 'utf8');
  return dir;
};

test('detecta un vídeo público sin ficha y no crea ni duplica nada', () => {
  const dir = montar({ 'vid-AAAAAAAAAAA.yaml': ficha() });
  try {
    const antes = fs.readdirSync(dir).sort();
    const r = conciliar({ instantanea: { videos: [video(), video({ videoId: 'BCDEFGHIJKL', title: 'Vídeo público sin ficha' })] }, fichas: leerFichas(dir), hoy: '2026-10-27' });
    assert.equal(r.sinFicha.length, 1);
    assert.equal(r.sinFicha[0].youtube_id, 'BCDEFGHIJKL');
    aplicarCambios(leerFichas(dir), r);
    assert.deepEqual(fs.readdirSync(dir).sort(), antes, 'la conciliación no crea fichas nuevas');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('solo actualiza datos factuales: el copy editorial queda byte a byte igual', () => {
  const dir = montar({ 'vid-AAAAAAAAAAA.yaml': ficha() });
  try {
    const entrada = leerFichas(dir)[0];
    const editorialAntes = {
      titulo: entrada.data.titulo,
      descripcion_corta: entrada.data.descripcion_corta,
      seo: entrada.data.seo,
      temas: entrada.data.temas,
      informacion: entrada.data.informacion,
      relacionados: entrada.data.relacionados,
      slug: entrada.data.slug,
    };

    const r = conciliar({ instantanea: { videos: [video()] }, fichas: leerFichas(dir), hoy: '2026-10-27' });
    assert.equal(r.cambios.length, 1);
    const parches = r.cambios[0].parches;
    assert.equal(parches.estado_youtube, 'publico');
    assert.equal(parches.privacidad_api, 'public');
    assert.equal(parches.duracion_iso, 'PT54S');
    assert.equal(parches.vistas_al_verificar, 321);
    assert.equal(parches.publicado_en, '2026-10-02');
    assert.equal(parches.verificado_en, '2026-10-27');
    assert.equal(parches.status, 'publicado', 'un vídeo público con información completa se publica en el sitio');
    for (const clave of ['titulo', 'descripcion_corta', 'seo', 'temas', 'informacion', 'relacionados', 'slug'])
      assert.ok(!(clave in parches), `la conciliación no debe tocar ${clave}`);

    aplicarCambios(leerFichas(dir), r);
    const despues = leerFichas(dir)[0].data;
    assert.equal(despues.titulo, editorialAntes.titulo);
    assert.deepEqual(despues.descripcion_corta, editorialAntes.descripcion_corta);
    assert.deepEqual(despues.seo, editorialAntes.seo);
    assert.deepEqual(despues.informacion, editorialAntes.informacion);
    assert.deepEqual(despues.temas, editorialAntes.temas);
    assert.equal(despues.estado_youtube, 'publico');
    assert.equal(despues.vistas_al_verificar, 321);
    assert.equal(despues.status, 'publicado');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('una ficha con información pendiente se avisa y no se publica aunque el vídeo sea público', () => {
  const pendiente = ficha({
    informacion: { estado: 'pendiente', origen: 'migracion-v2.1', faltan: ['resumen editorial', 'que_cubre'], heredado: true },
  });
  const dir = montar({ 'vid-AAAAAAAAAAA.yaml': pendiente });
  try {
    const r = conciliar({ instantanea: { videos: [video()] }, fichas: leerFichas(dir), hoy: '2026-10-27' });
    assert.equal(r.pendientes.length, 1);
    assert.deepEqual(r.pendientes[0].faltan, ['resumen editorial', 'que_cubre']);
    assert.equal(r.cambios[0].parches.status, undefined, 'no se promueve una ficha sin información completa');
    assert.ok(r.avisos.some((a) => /información está pendiente/.test(a.mensaje)));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('un vídeo que ya no es público no degrada una ficha publicada: se avisa', () => {
  const dir = montar({ 'vid-AAAAAAAAAAA.yaml': ficha({ status: 'publicado', estado_youtube: 'publico', privacidad_api: 'public' }) });
  try {
    const r = conciliar({
      instantanea: { videos: [video({ privacy_status: 'private', publish_at: null, published_at: '2026-10-02T13:30:00Z' })] },
      fichas: leerFichas(dir),
      hoy: '2026-10-27',
    });
    assert.equal(r.cambios[0].parches.estado_youtube, 'oculto');
    assert.equal(r.cambios[0].parches.status, undefined, 'nunca se despublica automáticamente');
    assert.ok(r.avisos.some((a) => /decide si la ficha se archiva/.test(a.mensaje)));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('sin cambios en el canal no se reescribe ninguna ficha', () => {
  const alDia = ficha({ status: 'publicado', estado_youtube: 'publico', privacidad_api: 'public', duracion_iso: 'PT54S', publicado_en: '2026-10-02', vistas_al_verificar: 321, verificado_en: '2026-10-27' });
  const dir = montar({ 'vid-AAAAAAAAAAA.yaml': alDia });
  try {
    const r = conciliar({ instantanea: { videos: [video()] }, fichas: leerFichas(dir), hoy: '2026-10-27' });
    assert.deepEqual(r.cambios, []);
    assert.equal(conciliar({ instantanea: { videos: [] }, fichas: leerFichas(dir), hoy: '2026-10-27' }).sinVideoEnCanal.length, 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/* ─────────────── intérprete de yt_lista.py (ruta --desde-api) ─────────────── */

test('el intérprete por defecto es el venv del canal, nunca python3 del sistema', () => {
  const visto: string[] = [];
  const elegido = resolverInterprete({
    env: { HOME: '/home/prueba' } as NodeJS.ProcessEnv,
    existe: (p: string) => {
      visto.push(p);
      return true;
    },
  });
  assert.equal(elegido, path.join('/home/prueba', PYTHON_POR_DEFECTO));
  assert.equal(elegido, '/home/prueba/venvs/yt-manager/bin/python');
  assert.deepEqual(visto, ['/home/prueba/venvs/yt-manager/bin/python']);
  assert.notEqual(elegido, 'python3');
});

test('YT_PYTHON manda sobre el venv por defecto', () => {
  const elegido = resolverInterprete({
    env: { HOME: '/home/prueba', YT_PYTHON: '/opt/py/bin/python3.12' } as NodeJS.ProcessEnv,
    existe: (p: string) => p === '/opt/py/bin/python3.12',
  });
  assert.equal(elegido, '/opt/py/bin/python3.12');
});

test('sin intérprete falla con un error claro que nombra YT_PYTHON', () => {
  assert.throws(
    () => resolverInterprete({ env: { HOME: '/home/prueba' } as NodeJS.ProcessEnv, existe: () => false }),
    (e: Error) => {
      assert.match(e.message, /no existe el intérprete \/home\/prueba\/venvs\/yt-manager\/bin\/python/);
      assert.match(e.message, /YT_PYTHON/);
      return true;
    },
  );
  assert.throws(
    () => resolverInterprete({ env: { HOME: '/home/prueba', YT_PYTHON: '/no/existe/python' } as NodeJS.ProcessEnv, existe: () => false }),
    /revisa YT_PYTHON/,
  );
});

test('la ruta --desde-api no invoca python3 a secas', () => {
  const fuente = fs.readFileSync(path.join(process.cwd(), 'scripts/conciliar-videos.mjs'), 'utf8');
  assert.equal(/spawnSync\(\s*['"]python3['"]/.test(fuente), false, 'usa resolverInterprete()');
  assert.match(fuente, /resolverInterprete\(/);
});
