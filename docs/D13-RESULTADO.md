# D13 — Resultado: ficha web del short `tu-casa-50k`

Fecha: 2026-10-28 · Tarea Kanban: `t_ba47ff08` · Sin commit ni push (según encargo).

## 1. Ficha creada

- Ruta: `src/content/videos/vid-mu4mTE_ouJ0.yaml` (nueva, untracked)
- Esquema: copia del contrato de `src/content/videos/vid-t1zPAoZV05M.yaml` + `src/content.config.ts`
- Estado: `status: aprobado`, `estado_youtube: programado`, `privacidad_api: private` → **no publicable** por el filtro del sitio (`getStaticPaths` exige `publico` + `public`)
- `relacionados: [vid-wsseghAWiMw]` (`comprar-piso-250k`, tema-vivienda: la ficha de hipoteca/compra de vivienda que ya existe). Es la única ficha del catálogo sobre compra de vivienda. Al no estar publicada todavía, `resolver(...)` del template la filtra y no se pinta el enlace; queda declarada para cuando esa ficha se publique (2026-11-01).

### Dos ajustes obligados por el esquema (no se tocó el esquema)

Los textos del encargo no caben literalmente en el contrato Zod de `videos`:

1. `informacion.resumen` tenía 505 caracteres; el máximo es 420 (`z.string().min(140).max(420)`).
   Se recortó a 416 caracteres conservando todos los datos: RDL 29/2026, 20 % / 50.000 € máximo, 0 % y sin comisiones, hipoteca de primera vivienda, devolución del capital, límite permanente al precio de venta con IPC y mejoras, procedimiento pendiente de Acuerdo del Consejo de Ministros.
   Cambios de redacción: «al 0 % de interés» → «al 0 %», «primera vivienda habitual» → «primera vivienda», «actualizable por IPC y mejoras admitidas» → «con actualización por IPC y mejoras».
2. `informacion.que_cubre` tenía 5 puntos; el máximo es 4 (`z.array(...).max(4)`).
   Se fusionaron los dos últimos en un punto: «Límite permanente al precio de venta (IPC y mejoras ampliadas); procedimiento pendiente de acuerdo». Los otros tres puntos quedan como los dio el encargo.

Ningún otro campo se separó del encargo. `seo.descripcion` (155 car., límite 160), `descripcion_corta` (155, límite 220), `titulo` (51, límite 120) y `para_quien` (102, límite 200) entran sin cambios.

## 2. Miniatura local

Origen: fotograma exacto a 0,6 s de `/home/mvf/Escritorio/Proyectos/tu-casa-50k/out/tu-casa-50k-V2.1-FINAL.mp4` (1080×1920, 30 fps, 52,167 s).
Composición: pilarbox con fondo desenfocado del propio fotograma (misma convención que las miniaturas locales ya publicadas, p. ej. `t1zPAoZV05M.webp`). Sin texto añadido. WebP `-quality 82 -compression_level 6` (libwebp de ffmpeg 9.0.1).

| Archivo | Dimensiones | Bytes | SHA-256 |
|---|---|---|---|
| `public/assets/videos/mu4mTE_ouJ0.webp` | 640×360 | 10.702 | `aa6598ffedb27a182f706215493b2af5df79e46eb1b253d26a41d56127204146` |
| `public/assets/videos/mu4mTE_ouJ0-320.webp` | 320×180 | 4.388 | `2b0dd19f8e57a323119a5ddb6ce6ed8554f63476c14f43825a0675e51d613298` |

Verificado a ojo: el centro muestra la casa, el personaje y el cartel «50.000 EUR»; sin bandas negras.

## 3. Gates (salida real)

Ejecutados desde `/home/mvf/4sotas/site`, en cadena, sin commit.

### `npm run check` → exit 0
```
Result (105 files):
- 0 errors
- 0 warnings
- 10 hints
```

### `npm test` → exit 0
```
ℹ tests 164
ℹ pass 164
ℹ fail 0
```

### `npm run build` → exit 0
```
[build] 51 page(s) built in 876ms
[@astrojs/sitemap] `sitemap-index.xml` created at `dist`
[build] Complete!
```

### `npm run verificar:plantillas` → exit 0
```
verificar-plantillas: ok · 14 comprobaciones correctas · 0 fallos
```

### `npm run validate` → **exit 1 (FALLA)**
```
WARN W-VIDEO-SIN-FICHA audit/inventory.json: vídeo público sin ficha en el sitio: LL1EJttJPrs
FAIL B-VIDEO-INVENTADO src/content/videos/vid-mu4mTE_ouJ0.yaml: youtube_id mu4mTE_ouJ0 no está en audit/inventory.json
validate-content: bloqueado · 1 bloqueantes · 1 avisos · contenido {"sotas":4,"temas":8,"articulos":9,"videos":14,"series":1,"herramientas":2,"glosario":14,"fuentes":44,"autores":2} · dist 51 html / 50 urls en sitemap
```

#### Diagnóstico del fallo (no es del esquema)

`validate-content.mjs` §B4 contrasta cada `youtube_id` de las fichas con `data/inventory-snapshot.json`. Ese snapshot se generó el **2026-10-28T12:00:00+01:00** (15 vídeos, con `wsseghAWiMw` dentro) y **no puede contener** `mu4mTE_ouJ0`, subido esa tarde en privado con `publishAt 2026-10-28T17:30:00Z`.

- El esquema **sí** admite la combinación pedida: `estado_youtube: programado` + `privacidad_api: private` + `status: aprobado` es válido (solo se exige coherencia `publico`→`public`, y prohíbe `status: publicado` con vídeo no público). `astro check` (que valida Zod contra las fichas) sale con 0 errores.
- El aviso `W-VIDEO-SIN-FICHA LL1EJttJPrs` es previo y ajeno a esta tarea (ese vídeo público no tiene ficha en el sitio).
- Refrescar `data/inventory-snapshot.json` exige lectura real de la API de YouTube (token fuera de este repo; `yt_lista.py`/`yt_verify.py` viven en el perfil `orchestrator`). No se ha tocado: es pipeline de auditoría, fuera del alcance de esta card, y añadir la entrada a mano sería inventar una verificación `verificado_api`.

**Consecuencia a tener en cuenta al publicar:** `.github/workflows/pages.yml` (deploy) solo ejecuta `npm run build`, así que el deploy no se rompe; pero `.github/workflows/ci.yml` **sí** ejecuta `npm run validate`, así que CI quedará en rojo en `main` hasta que el snapshot incluya `mu4mTE_ouJ0`.

## 4. La ficha NO aparece en `dist/`

Comprobado tras el build:

- `dist/oros/videos/` contiene 12 fichas publicadas; no existe `dist/oros/videos/tu-casa-50k/`.
- `grep -rl "mu4mTE_ouJ0" dist/` → sin resultados (ni HTML, ni JSON-LD, ni listados).
- `grep -c "tu-casa" dist/sitemap-0.xml` → `0`.

Los dos WebP sí se copian a `dist/assets/videos/` porque viven en `public/` (mismo comportamiento que el resto de pósters); `dist/` es artefacto de build, no se versiona.

## 5. Qué queda pendiente (para el orquestador)

1. Refrescar `data/inventory-snapshot.json` con una lectura real de la API que incluya `mu4mTE_ouJ0` (privado/programado) → desbloquea `npm run validate`.
2. A las 18:32, `node scripts/publicar-ficha.mjs --youtube-id mu4mTE_ouJ0 --commit`.
3. Commit de esta card (ficha + 2 WebP) es independiente y no se ha hecho aquí.

## Estado del árbol de trabajo

```
 M qa/validate-report.json          (artefacto del propio `npm run validate`; ya venía modificado)
?? src/content/videos/vid-mu4mTE_ouJ0.yaml
?? public/assets/videos/mu4mTE_ouJ0.webp
?? public/assets/videos/mu4mTE_ouJ0-320.webp
?? docs/D13-RESULTADO.md
```
