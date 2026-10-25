/**
 * 4 Sotas · regresiones CLI de referencias por colección (B3).
 *
 * Invoca el validador real por subprocess y comprueba exit code + reporte --json.
 * Sin dependencias nuevas: node:test, node:assert, node:fs, node:child_process.
 *
 * Ejecución:
 *   node --test tests/validate-content.test.mjs
 *   VALIDATOR_PATH=/ruta/a/scripts/validate-content.mjs node --test tests/validate-content.test.mjs
 *
 * Variables:
 *   VALIDATOR_PATH  ruta del script a probar. Default: ../scripts/validate-content.mjs
 *                   relativo a este archivo.
 *
 * Nota: el script importa `yaml`; debe ser resoluble desde su propia ubicación
 * (node_modules en un ancestro de scripts/). Si no lo es, el validador sale con
 * exit 2 y "falta la dependencia yaml" — el error se reporta tal cual.
 *
 * Fixtures: JSON sintéticos en mkdtempSync(TMPDIR), borrados en el mismo test.
 */
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const VALIDATOR = path.resolve(process.env.VALIDATOR_PATH ?? path.join(TEST_DIR, '..', 'scripts', 'validate-content.mjs'));

const TEMP_ROOTS = [];
after(() => {
  for (const dir of TEMP_ROOTS) fs.rmSync(dir, { recursive: true, force: true });
});

/* ───────────────────────── utilidades de ejecución ───────────────────────── */

function materializar(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), '4sotas-refs-'));
  TEMP_ROOTS.push(root);
  for (const [rel, data] of Object.entries(files)) {
    const destino = path.join(root, 'src', 'content', rel);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, `${JSON.stringify(data, null, 2)}\n`);
  }
  return root;
}

function ejecutar(files) {
  assert.ok(fs.existsSync(VALIDATOR), `no existe el validador en ${VALIDATOR} (usa VALIDATOR_PATH)`);
  const root = materializar(files);
  const jsonOut = path.join(root, 'report.json');
  const res = spawnSync(process.execPath, [VALIDATOR, '--root', root, '--json', jsonOut], {
    encoding: 'utf8',
    env: { ...process.env, SITE_ORIGIN: undefined, SITE_BASE: undefined },
  });
  const stdout = res.stdout ?? '';
  const stderr = res.stderr ?? '';
  assert.notEqual(res.status, 2, `el validador no pudo arrancar: ${stderr.trim() || stdout.trim()}`);
  assert.ok(fs.existsSync(jsonOut), `no se generó el reporte --json. stdout=${stdout} stderr=${stderr}`);
  const report = JSON.parse(fs.readFileSync(jsonOut, 'utf8'));
  fs.rmSync(root, { recursive: true, force: true });
  return { status: res.status, stdout, stderr, report };
}

/** Bloqueantes de referencia (B3), sin ruido de otras reglas. */
const refs = (report) => report.blockers.filter((b) => b.code === 'B-REF-COLGANTE' || b.code === 'B-REF-PRIVADA');

function assertColgante(report, campo, valor, destino) {
  const esperado = `${campo} = "${valor}" no existe en ${destino}`;
  const hit = report.blockers.find((b) => b.code === 'B-REF-COLGANTE' && b.msg === esperado);
  assert.ok(hit, `falta B-REF-COLGANTE "${esperado}". Obtenidos: ${JSON.stringify(report.blockers)}`);
  return hit;
}

function assertSinBloqueantes(report, status) {
  assert.deepEqual(report.blockers, [], `bloqueantes inesperados: ${JSON.stringify(report.blockers)}`);
  assert.equal(status, 0, 'exit code debería ser 0 sin bloqueantes');
  assert.equal(report.verdict, 'ok');
}

const clonar = (files) => JSON.parse(JSON.stringify(files));

/* ─────────────────────── fixture sintético: matriz válida ─────────────────────── */

const VID_A = 'vid-AAAAAAAAAAA';
const VID_B = 'vid-BBBBBBBBBBB';
const DESCRIPCION = 'Descripción sintética de prueba con longitud suficiente para el validador.';

/** Campos mínimos para una entrada `status: publicado` que no dispare B-PUB-* (sensibilidad baja). */
const CAMPOS_PUBLICADO = {
  status: 'publicado',
  publicado: '2025-03-01',
  revisado_factual: '2025-09-01',
  sensibilidad: 'baja',
  seo: { descripcion: DESCRIPCION, noindex: false },
};

/**
 * Matriz válida: cada ruta de referencia declarada en content.config.ts resuelta
 * a una entrada existente de la colección correcta. Todo en borrador salvo que
 * un caso concreto lo cambie.
 */
function matriz() {
  return {
    'autores/aut-ana.json': { id: 'aut-ana', nombre_publico: 'Ana Sintética', rol: ['redactor'] },
    'autores/aut-luis.json': { id: 'aut-luis', nombre_publico: 'Luis Sintético', rol: ['revisor-factual'] },
    'fuentes/src-boe.json': {
      id: 'src-boe',
      titulo: 'Boletín oficial sintético',
      editor: 'BOE',
      url: 'https://example.org/boe-sintetico',
      tipo: 'oficial',
      jurisdiccion: 'ES',
      consultado_en: '2025-01-15',
    },
    'temas/tema-nomina.json': {
      id: 'tema-nomina',
      slug: 'tema-nomina',
      titulo: 'Nómina sintética',
      status: 'borrador',
      autorias: { redactor: 'aut-ana', revisor: 'aut-luis' },
      fuentes: [{ fuente: 'src-boe', dato: 'dato sintético contrastado' }],
      pilar: 'art-guia',
      temas_relacionados: ['tema-fiscal'],
      videos_destacados: [VID_A],
      herramientas: ['herr-sueldo'],
    },
    'temas/tema-fiscal.json': { id: 'tema-fiscal', slug: 'tema-fiscal', titulo: 'Fiscal sintético', status: 'borrador' },
    'articulos/art-guia.json': {
      id: 'art-guia',
      slug: 'art-guia',
      titulo: 'Guía sintética de nómina',
      status: 'borrador',
      autorias: { redactor: 'aut-ana' },
      fuentes: [{ fuente: 'src-boe' }],
      temas: ['tema-nomina'],
      videos: [VID_A],
      herramientas: ['herr-sueldo'],
      glosario: ['glo-salario'],
      serie: 'ser-basicos',
    },
    'videos/vid-a.json': {
      id: VID_A,
      youtube_id: 'AAAAAAAAAAA',
      slug: 'video-uno',
      titulo: 'Vídeo sintético uno',
      status: 'borrador',
      temas: ['tema-nomina'],
      serie: 'ser-basicos',
      relacionados: [VID_B],
    },
    'videos/vid-b.json': {
      id: VID_B,
      youtube_id: 'BBBBBBBBBBB',
      slug: 'video-dos',
      titulo: 'Vídeo sintético dos',
      status: 'borrador',
      temas: ['tema-nomina'],
    },
    'series/ser-basicos.json': {
      id: 'ser-basicos',
      slug: 'ser-basicos',
      titulo: 'Serie sintética básicos',
      status: 'borrador',
      temas: ['tema-nomina'],
    },
    'herramientas/herr-sueldo.json': {
      id: 'herr-sueldo',
      slug: 'herr-sueldo',
      titulo: 'Calculadora de sueldo neto',
      status: 'borrador',
      temas: ['tema-nomina'],
    },
    'glosario/glo-salario.json': {
      id: 'glo-salario',
      slug: 'glo-salario',
      termino: 'Salario',
      status: 'borrador',
      relacionados: ['glo-ipc'],
    },
    'glosario/glo-ipc.json': { id: 'glo-ipc', slug: 'glo-ipc', termino: 'IPC', status: 'borrador' },
  };
}

/* ───────────────────────────── matriz válida ───────────────────────────── */

test('matriz válida: todas las rutas de referencia declaradas resuelven (exit 0)', () => {
  const { status, report } = ejecutar(matriz());
  assertSinBloqueantes(report, status);
  assert.deepEqual(report.entries, {
    sotas: 0,
    temas: 2,
    articulos: 1,
    videos: 2,
    series: 1,
    herramientas: 1,
    glosario: 2,
    fuentes: 1,
    autores: 2,
  });
  assert.equal(report.verdict, 'ok');
});

test('sin colecciones: solo avisos W-CONTENT-DIR, exit 0', () => {
  const { status, report } = ejecutar({});
  assert.equal(status, 0);
  assert.equal(report.verdict, 'ok');
  assert.deepEqual(report.blockers, []);
  assert.ok(report.warnings.some((w) => w.code === 'W-CONTENT-DIR' && w.where === 'glosario'));
});

/* ────────────────────── glosario.relacionados = glosario ────────────────────── */

test('glosario.relacionados a id ausente: B-REF-COLGANTE en glosario', () => {
  const files = clonar(matriz());
  files['glosario/glo-salario.json'].relacionados = ['glo-sin-existir'];
  const { status, report } = ejecutar(files);

  assert.equal(status, 1);
  assert.equal(report.verdict, 'bloqueado');
  assert.equal(refs(report).length, 1, JSON.stringify(report.blockers));
  const b = assertColgante(report, 'relacionados', 'glo-sin-existir', 'glosario');
  assert.equal(b.where, 'src/content/glosario/glo-salario.json');
});

test('glosario.relacionados no acepta ids de video existentes (sin fallback global)', () => {
  const files = clonar(matriz());
  files['glosario/glo-salario.json'].relacionados = [VID_A];
  const { status, report } = ejecutar(files);

  assert.equal(status, 1);
  assert.equal(refs(report).length, 1, JSON.stringify(report.blockers));
  assertColgante(report, 'relacionados', VID_A, 'glosario');
});

test('glosario.relacionados con varios valores: solo falla el colgante', () => {
  const files = clonar(matriz());
  files['glosario/glo-salario.json'].relacionados = ['glo-ipc', 'glo-fantasma'];
  const { status, report } = ejecutar(files);

  assert.equal(status, 1);
  assert.equal(refs(report).length, 1, JSON.stringify(report.blockers));
  assertColgante(report, 'relacionados', 'glo-fantasma', 'glosario');
});

/* ──────────────────────── videos.relacionados = videos ──────────────────────── */

test('videos.relacionados a id de video válido: exit 0', () => {
  const files = clonar(matriz());
  files['videos/vid-b.json'].relacionados = [VID_A];
  const { status, report } = ejecutar(files);
  assertSinBloqueantes(report, status);
});

test('videos.relacionados a id ausente: B-REF-COLGANTE en videos', () => {
  const files = clonar(matriz());
  files['videos/vid-a.json'].relacionados = ['vid-ZZZZZZZZZZZ'];
  const { status, report } = ejecutar(files);

  assert.equal(status, 1);
  assert.equal(refs(report).length, 1, JSON.stringify(report.blockers));
  assertColgante(report, 'relacionados', 'vid-ZZZZZZZZZZZ', 'videos');
});

test('videos.relacionados no acepta ids de glosario existentes', () => {
  const files = clonar(matriz());
  files['videos/vid-a.json'].relacionados = ['glo-ipc'];
  const { status, report } = ejecutar(files);

  assert.equal(status, 1);
  assert.equal(refs(report).length, 1, JSON.stringify(report.blockers));
  assertColgante(report, 'relacionados', 'glo-ipc', 'videos');
});

/* ───────────────────── B-REF-PRIVADA (fuga de borrador) ───────────────────── */

test('glosario publicado que referencia un glosario en revision: B-REF-PRIVADA', () => {
  const files = clonar(matriz());
  Object.assign(files['glosario/glo-salario.json'], CAMPOS_PUBLICADO, { relacionados: ['glo-ipc'] });
  files['glosario/glo-ipc.json'].status = 'revision';
  const { status, report } = ejecutar(files);

  assert.equal(status, 1);
  assert.deepEqual(
    report.blockers.map((b) => b.code),
    ['B-REF-PRIVADA'],
    JSON.stringify(report.blockers),
  );
  const b = report.blockers[0];
  assert.equal(b.msg, 'relacionados referencia "glo-ipc" con status=revision desde una entrada publicada (fuga de borrador)');
  assert.equal(b.where, 'src/content/glosario/glo-salario.json');
});

test('videos publicado que referencia un video en borrador: B-REF-PRIVADA', () => {
  const files = {
    'videos/vid-a.json': {
      ...CAMPOS_PUBLICADO,
      id: VID_A,
      youtube_id: 'AAAAAAAAAAA',
      slug: 'video-uno',
      titulo: 'Vídeo sintético publicado',
      estado_youtube: 'publico',
      privacidad_api: 'public',
      temas: ['tema-publicado'],
      relacionados: [VID_B],
    },
    'videos/vid-b.json': {
      id: VID_B,
      youtube_id: 'BBBBBBBBBBB',
      slug: 'video-dos',
      titulo: 'Vídeo sintético en borrador',
      status: 'borrador',
      temas: ['tema-publicado'],
    },
    'temas/tema-publicado.json': {
      ...CAMPOS_PUBLICADO,
      id: 'tema-publicado',
      slug: 'tema-publicado',
      titulo: 'Tema sintético publicado',
    },
  };
  const { status, report } = ejecutar(files);

  assert.equal(status, 1);
  assert.deepEqual(
    report.blockers.map((b) => b.code),
    ['B-REF-PRIVADA'],
    JSON.stringify(report.blockers),
  );
  assert.equal(
    report.blockers[0].msg,
    'relacionados referencia "vid-BBBBBBBBBBB" con status=borrador desde una entrada publicada (fuga de borrador)',
  );
});

test('borrador que referencia borrador: sin B-REF-PRIVADA', () => {
  const files = clonar(matriz());
  files['glosario/glo-salario.json'].relacionados = ['glo-ipc'];
  const { status, report } = ejecutar(files);
  assertSinBloqueantes(report, status);
});

/* ────────────────────────── temas: rutas declaradas ────────────────────────── */

test('temas: pilar, temas_relacionados, videos_destacados y herramientas válidos', () => {
  const { status, report } = ejecutar(matriz());
  assertSinBloqueantes(report, status);
});

test('temas: las cuatro rutas colgantes se detectan con su destino correcto', () => {
  const files = clonar(matriz());
  Object.assign(files['temas/tema-nomina.json'], {
    pilar: 'art-inexistente',
    temas_relacionados: ['tema-inexistente'],
    videos_destacados: ['vid-QQQQQQQQQQQ'],
    herramientas: ['herr-inexistente'],
  });
  const { status, report } = ejecutar(files);

  assert.equal(status, 1);
  assert.deepEqual(
    report.blockers.map((b) => b.code),
    ['B-REF-COLGANTE', 'B-REF-COLGANTE', 'B-REF-COLGANTE', 'B-REF-COLGANTE'],
    JSON.stringify(report.blockers),
  );
  assertColgante(report, 'pilar', 'art-inexistente', 'articulos');
  assertColgante(report, 'temas_relacionados', 'tema-inexistente', 'temas');
  assertColgante(report, 'videos_destacados', 'vid-QQQQQQQQQQQ', 'videos');
  assertColgante(report, 'herramientas', 'herr-inexistente', 'herramientas');
});

test('temas.temas_relacionados no acepta ids de articulo (mismo nombre, otro destino)', () => {
  const files = clonar(matriz());
  files['temas/tema-nomina.json'].temas_relacionados = ['art-guia'];
  const { status, report } = ejecutar(files);

  assert.equal(status, 1);
  assert.equal(refs(report).length, 1, JSON.stringify(report.blockers));
  assertColgante(report, 'temas_relacionados', 'art-guia', 'temas');
});

test('temas.videos_destacados no acepta ids de tema existentes', () => {
  const files = clonar(matriz());
  files['temas/tema-nomina.json'].videos_destacados = ['tema-fiscal'];
  const { status, report } = ejecutar(files);

  assert.equal(status, 1);
  assert.equal(refs(report).length, 1, JSON.stringify(report.blockers));
  assertColgante(report, 'videos_destacados', 'tema-fiscal', 'videos');
});

/* ──────────────────────── articulos: rutas declaradas ──────────────────────── */

test('articulos: temas, videos, herramientas, glosario y serie válidos', () => {
  const { status, report } = ejecutar(matriz());
  assertSinBloqueantes(report, status);
});

test('articulos: las cinco rutas colgantes se detectan con su destino correcto', () => {
  const files = clonar(matriz());
  Object.assign(files['articulos/art-guia.json'], {
    temas: ['tema-inexistente'],
    videos: ['vid-QQQQQQQQQQQ'],
    herramientas: ['herr-inexistente'],
    glosario: ['glo-inexistente'],
    serie: 'ser-inexistente',
  });
  const { status, report } = ejecutar(files);

  assert.equal(status, 1);
  assert.equal(refs(report).length, 5, JSON.stringify(report.blockers));
  assertColgante(report, 'temas', 'tema-inexistente', 'temas');
  assertColgante(report, 'videos', 'vid-QQQQQQQQQQQ', 'videos');
  assertColgante(report, 'herramientas', 'herr-inexistente', 'herramientas');
  assertColgante(report, 'glosario', 'glo-inexistente', 'glosario');
  assertColgante(report, 'serie', 'ser-inexistente', 'series');
});

/* ────────────────────────── videos: rutas declaradas ────────────────────────── */

test('videos: temas, serie y relacionados válidos', () => {
  const { status, report } = ejecutar(matriz());
  assertSinBloqueantes(report, status);
});

test('videos: las tres rutas colgantes se detectan con su destino correcto', () => {
  const files = clonar(matriz());
  Object.assign(files['videos/vid-b.json'], {
    temas: ['tema-inexistente'],
    serie: 'ser-inexistente',
    relacionados: ['vid-QQQQQQQQQQQ'],
  });
  const { status, report } = ejecutar(files);

  assert.equal(status, 1);
  assert.equal(refs(report).length, 3, JSON.stringify(report.blockers));
  assertColgante(report, 'temas', 'tema-inexistente', 'temas');
  assertColgante(report, 'serie', 'ser-inexistente', 'series');
  assertColgante(report, 'relacionados', 'vid-QQQQQQQQQQQ', 'videos');
});

/* ────────────────── series y herramientas: solo temas ────────────────── */

test('series y herramientas: temas válidos', () => {
  const { status, report } = ejecutar(matriz());
  assertSinBloqueantes(report, status);
});

test('series y herramientas: temas colgantes apuntan a temas', () => {
  const files = clonar(matriz());
  files['series/ser-basicos.json'].temas = ['tema-inexistente'];
  files['herramientas/herr-sueldo.json'].temas = ['art-guia'];
  const { status, report } = ejecutar(files);

  assert.equal(status, 1);
  assert.equal(refs(report).length, 2, JSON.stringify(report.blockers));
  assertColgante(report, 'temas', 'tema-inexistente', 'temas');
  assertColgante(report, 'temas', 'art-guia', 'temas');
});

/* ───────────── referencias anidadas: autorias y fuentes ───────────── */

test('autorias.redactor/revisor y fuentes.fuente válidos (rutas anidadas)', () => {
  const { status, report } = ejecutar(matriz());
  assertSinBloqueantes(report, status);
});

test('autorias y fuentes colgantes se reportan con ruta completa del campo', () => {
  const files = clonar(matriz());
  Object.assign(files['temas/tema-nomina.json'], {
    autorias: { redactor: 'aut-nadie', revisor: 'aut-tampoco' },
    fuentes: [{ fuente: 'src-nadie' }],
  });
  const { status, report } = ejecutar(files);

  assert.equal(status, 1);
  assert.equal(refs(report).length, 3, JSON.stringify(report.blockers));
  assertColgante(report, 'autorias.redactor', 'aut-nadie', 'autores');
  assertColgante(report, 'autorias.revisor', 'aut-tampoco', 'autores');
  assertColgante(report, 'fuentes.fuente', 'src-nadie', 'fuentes');
});

test('fuentes.fuente no acepta ids de autor existentes', () => {
  const files = clonar(matriz());
  files['articulos/art-guia.json'].fuentes = [{ fuente: 'aut-ana' }];
  const { status, report } = ejecutar(files);

  assert.equal(status, 1);
  assert.equal(refs(report).length, 1, JSON.stringify(report.blockers));
  assertColgante(report, 'fuentes.fuente', 'aut-ana', 'fuentes');
});

test('referencias de fuentes en varias entradas se validan una a una', () => {
  const files = clonar(matriz());
  files['articulos/art-guia.json'].fuentes = [{ fuente: 'src-boe' }, { fuente: 'src-inexistente' }];
  const { status, report } = ejecutar(files);

  assert.equal(status, 1);
  assert.equal(refs(report).length, 1, JSON.stringify(report.blockers));
  assertColgante(report, 'fuentes.fuente', 'src-inexistente', 'fuentes');
});
