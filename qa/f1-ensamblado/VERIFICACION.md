# F1 · Ensamblado de contenido, catálogos y navegación · verificación

Todo lo que sigue es salida real de comandos ejecutados en
`/home/mvf/4sotas/site/.worktrees/t_89e4e004` (rama `wt/t_89e4e004`, sobre `9b6f5d8`) el 26-oct-2026.
No hay cifras estimadas ni resultados de memoria.

## 0 · Punto de partida y fusiones

| paso | comando | resultado |
|---|---|---|
| rama base | `git merge --ff-only wt/t_a85e410a` | fast-forward `138b50e..9b6f5d8` (plantillas + calculadora) |
| validador canónico | `cp architecture/scripts/validate-content.mjs site/scripts/` | `sha256 79e7de57…921` (SHA vigente tras `t_e10fce1f`) |
| tests canónicos | `cp architecture/tests/validate-content.test.mjs site/tests/` | `sha256 f67fe581…b81cb` (48 tests) |
| dependencias | `cp -al ../../node_modules ./node_modules` | reutiliza el árbol instalado del repo |

## 1 · Contenido importado (recuento real, del validador)

```
contenido {"sotas":4,"temas":8,"articulos":9,"videos":11,"series":1,"herramientas":2,"glosario":14,"fuentes":44,"autores":1}
```

- `temas`: 8 ficheros = **7 temas reales** (`tema-nomina`, `tema-inflacion`, `tema-ahorro`, `tema-inversion`,
  `tema-banca`, `tema-vivienda`, `tema-burbujas`) + 1 fixture.
- `articulos`: 9 ficheros = **8 artículos reales** + 1 fixture.
- `videos`: **11 fichas reales** (todas del snapshot, `privacy_status: public`; la ficha de prueba anterior se
  sustituyó por el registro real verificado del mismo `youtube_id`, no se duplicó).
- `glosario`: 14 ficheros = **12 términos reales** + 2 fixtures.
- `fuentes`: 44 ficheros = **43 reales** tras deduplicar por URL + 1 fixture.
- `sotas`: 4 (Oros activa, tres previstas), sin cambios.
- `herramientas`: 2 = 1 calculadora real + 1 fixture.

Recuento de ficheros reales comprobado con:

```bash
for c in temas articulos glosario videos; do printf "%s %s\n" "$c" "$(ls src/content/$c | grep -v fixture | grep -v .gitkeep | wc -l)"; done
```

## 2 · Deduplicación de fuentes (por URL, sin perder el dato)

Cinco fuentes del carril B eran la misma URL que una del carril A. Se conservó el id descriptivo del carril A
(que además trae `cita`) y se reescribieron las referencias del contenido del carril B:

| id eliminado | id conservado |
|---|---|
| `src-s2-01` | `src-ine-ipc-septiembre-2026` |
| `src-s2-05` | `src-bde-euribor-septiembre-2026` |
| `src-s2-06`, `src-s5-07` | `src-bde-comparador-tipos-comisiones` |
| `src-s3-05` | `src-bde-consulta-endeudamiento-40` |
| `src-s1-11` | `src-legia-art66-escala-ahorro` |

`fuentes` referenciadas pero inexistentes: **0** (comprobado antes de importar y confirmado por el validador).

## 3 · Correcciones de forma (sin inventar datos)

- Cuatro `nota_verificacion` superaban el máximo de 240 caracteres del esquema (`src-s4-01`, `src-s6-01`,
  `src-s6-02`, `src-s7-05`): se reescribieron conservando todas las cifras, el estado de verificación y los
  avisos “pendiente antes de publicar”. No se añadió ninguna afirmación nueva.
- Un enlace interno del contenido apuntaba a un slug inexistente:
  `src/content/temas/tema-burbujas.md`: `/oros/videos/crisis-de-2008/` → `/oros/videos/crisis-de-2008-espana/`.
  Detectado por `B-ENLACE-ROTO` en el build de fixtures, no a ojo.

## 4 · Comandos de verificación (salida real)

```
$ npm run check
Result (52 files):
- 0 errors
- 0 warnings
- 0 hints

$ npm test
ℹ tests 116
ℹ pass 116
ℹ fail 0

$ npm run build
03:50:01 [build] 8 page(s) built in 754ms
[build] Complete!

$ npm run validate
WARN W-VIDEO-SIN-FICHA audit/inventory.json: vídeo público sin ficha en el sitio: LL1EJttJPrs
validate-content: ok · 0 bloqueantes · 1 avisos · contenido {...} · dist 8 html / 7 urls en sitemap

$ npm run build:fixtures
03:50:02 [build] 52 page(s) built in 806ms

$ npm run verificar:plantillas
verificar-plantillas: ok · 13 comprobaciones correctas · 0 fallos

$ npm run publicacion:pendiente
publicacion:pendiente · contenido 45 · publicadas 0 · sin publicar 45 · sin metadata pendiente 0 ·
con refs a no publicadas 45
```

## 5 · Cero enlaces internos rotos (grafo completo, no solo lo publicado)

El build público tiene 8 páginas porque **nada está publicado**. Para probar el grafo completo se valida el
build de fixtures, que renderiza las 52 páginas con todo el contenido importado:

```
$ node scripts/validate-content.mjs --root . --dist dist-fixtures \
    --inventory data/inventory-snapshot.json \
    --site https://marcvillarroya.github.io --base /4sotas
44 B-DRAFT-EN-DIST          ← esperado: el build de fixtures contiene borradores a propósito
0 B-ENLACE-ROTO
0 B-ENLACE-SIN-BASE
0 B-CANONICA*
1 W-VIDEO-SIN-FICHA         ← LL1EJttJPrs, público y fuera de alcance V1
```

Comprobación independiente del prefijo de base:

```bash
grep -rho 'href="/4sotas/[^"]*"' dist-fixtures | sort -u | wc -l   # 55 enlaces internos distintos, todos con base
grep -rho 'href="/\(oros\|assets\|data\)[^"]*"' dist-fixtures | sort -u | wc -l   # 0 sin base
```

Sin el plugin `scripts/remark-enlaces-base.mjs` este mismo comando daba **19 `B-ENLACE-SIN-BASE`**: los enlaces
raíz escritos dentro del Markdown (`/oros/guias/...`) se serializaban sin la base del despliegue.

## 6 · Catálogos y `llms.txt`

| endpoint | ítems en build público | por qué |
|---|---|---|
| `/data/catalog.json` | 0 | 0 artículos publicados |
| `/data/topics.json` | 0 | 0 temas publicados |
| `/data/videos.json` | 0 | 0 fichas de vídeo publicadas |
| `/data/tools.json` | 0 | 0 herramientas publicadas |
| `/llms.txt` | conteos 0/0/0/0 | misma regla de publicación |

Que estén a cero es correcto y verificable, pero **un catálogo vacío no demuestra la lógica**, así que
`tests/catalogos.test.ts` prueba los cuatro constructores con entradas sintéticas (7 tests):

- entra el publicado y no el `revision`/`archivado`;
- vídeo: exige ficha publicada **y** `estado_youtube: publico` + `privacidad_api: public` (el programado y el
  oculto quedan fuera aunque su ficha esté publicada) y se ordena por fecha descendente;
- herramienta: la `no-implementada` no entra, la `beta` publicada sí;
- URL de catálogo derivada de `ruta.*`, no del título;
- ningún catálogo publica borradores aunque la colección esté llena.

## 7 · Estado editorial: por qué no se publica

Decisión registrada, no omisión:

1. `exigirPublicacion` del esquema exige `publicado` **y** `revisado_factual` para cualquier `status: publicado`.
2. El contenido se entregó en `revision` porque la revisión factual con revisor **no está asignada**
   (`content/grupo-a/README-HANDOFF.md:76`, `content/grupo-b/README.md:28-31`) y el propietario no ha autorizado
   publicar cifras sensibles.
3. No se ha escrito ninguna fecha de revisión factual que no haya ocurrido.

El grafo está conectado: al publicar una sola pieza (probado con las 11 fichas de vídeo y la calculadora, que
temporalmente se marcaron `publicado` y después se revirtieron) el validador canónico devuelve **13
`B-REF-PRIVADA`** (“temas referencia … con status=revision desde una entrada publicada”). La publicación es por
tanto un **interruptor único** sobre el bloque editorial completo, no una decisión por fichero.

Informe derivado, regenerable con `npm run publicacion:pendiente`:
`qa/f1-ensamblado/PUBLICACION-PENDIENTE.md` + `qa/f1-ensamblado/publicacion.json` (45 entradas, 0 publicadas,
45 con referencias a entradas no publicadas, 0 con metadata pendiente distinta de las tres fechas/SEO).

## 8 · Pendiente (no se rellena, se documenta)

- Revisión factual con revisor asignado y paso a `publicado` del bloque editorial completo.
- Comprobación HTTP real de las 24 URLs del carril A (el dossier solo verificó fragmentos de índice).
- Cifras de vivienda: re-ejecutar `calculos.py` y corregir los tres datos marcados `CORREGIR` antes de publicarlas.
- `W-VIDEO-SIN-FICHA` de `LL1EJttJPrs`: se mantiene a propósito (vídeo real fuera de alcance V1).
