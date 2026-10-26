# MAINTENANCE · 4 Sotas

Operación del sitio. Complementa `AGENTS.md` (reglas y recetas), `DEPLOY.md` (evidencia del
despliegue) y `docs/CALCULADORA.md` (motor). Los comandos marcados **[verificado]** se ejecutaron
en este repo el 2026-10-26; el resto son procedimientos, no promesas de automatización.

## 1 · Rutina

### En cada cambio de contenido

1. Editar solo `src/content/**` (y, si aplica, el snapshot de inventario).
2. Ejecutar los gates, en este orden:

```bash
npm ci
npm run check
npm test
npm run build
npm run build:fixtures
npm run verificar:plantillas
npm run validate
```

3. Revisar la salida: `0 errores`, `118 tests`, `47 páginas` (sube con contenido nuevo publicado),
   `13 comprobaciones`, `0 bloqueantes`. El único aviso aceptado hoy es
   `W-VIDEO-SIN-FICHA` para `LL1EJttJPrs`.
4. Commit en español, imperativo y con alcance: `feat(guias): añadir guía de ...`,
   `fix(videos): corregir slug de ...`. Un PR por cambio lógico. Sin `--no-verify`.

### Semanal

- `gh run list --repo MarcVillarroya/4sotas --limit 5`: el último run de `main` debe estar en
  `success`; si el job `deploy` no aparece, comprobar `DEPLOY_ENABLED`.
- `curl -sI https://marcvillarroya.github.io/4sotas/ | head -1`: debe responder `200`.
- `curl -s https://marcvillarroya.github.io/4sotas/sitemap-0.xml | grep -c '<loc>'`: comparar con
  las URLs esperadas (46 en la última verificación).
- `npm run publicacion:pendiente`: informe de lo que falta para publicar; no publica nada.

### Mensual / trimestral

- Revisar `actualizacion.proxima_revision` de las entradas publicadas y las fuentes con
  `vigencia_hasta` próxima. `W-CADUCIDAD` avisa a los 365 días de `revisado_factual`;
  `W-FUENTE-CADUCADA` avisa de vigencia vencida.
- Revisar longitudes SEO (`W-SEO-TITULO`, `W-SEO-DESC`) y cruces internos (`W-SIN-CRUCES`).
- `npm ci` desde cero en una copia limpia si hay dudas de desincronización de `node_modules`.

## 2 · Actualización normativa

Contenido YMYL: una norma nueva o una cifra revisada obliga a tocar la fuente, no solo el texto.

1. Verificar la fuente primaria (BOE, AEAT, Seguridad Social, INE, BdE, BCE, CNMV). No se acepta
   prensa como primaria.
2. Actualizar o crear la ficha `src/content/fuentes/src-<kebab>.yaml` con `consultado_en` real,
   `publicado_en` y, si aplica, `vigencia_hasta`. Si la URL cambia, crear ficha nueva y actualizar
   las referencias: los `id` no se reutilizan para otra fuente.
3. Actualizar el texto y el `dato` de cada referencia afectada. Recalcular toda cifra marcada como
   `[cálculo: …]`; si cambia una fórmula, actualizar `docs/CALCULADORA.md` y sus vectores.
4. Registrar revisión: `revisado_factual` a la fecha real, `autorias.revisor` a un autor con rol
   `revisor-factual`, y `actualizacion.proxima_revision`.
5. Gates completos de §1.3. La aprobación del paso a `publicado` es humana: no se firma solo.

Casos especiales:

- **Cambio de tipo de interés / impuestos con calculadora**: subir `version_motor` (semver) en la
  ficha de la herramienta, actualizar `supuestos`/`limites` y `docs/CALCULADORA.md`; `tests/`
  debe seguir apuntando al fichero de vectores existente.
- **Norma que caduca sin sustituto**: dejar la entrada en `revision` y documentar el hueco; no
  publicar una cifra sin vigencia.

## 3 · Vídeos y snapshot de inventario

1. El estado real de YouTube está en `data/inventory-snapshot.json` (copia fechada de
   `audit/inventory.json`, sin tokens). Se actualiza a mano, con fecha en el commit.
2. Solo se fichan vídeos con `privacy_status: public`; el `id` de la ficha es
   `vid-<youtube_id>` y el título/duración se copian de la API, no se inventan.
3. Tras actualizar: gates de §1.3 y comprobar que la watch page no inserta iframes hasta el clic.
4. El token de YouTube nunca entra en el repo ni en el workflow.

## 4 · Despliegue

- Workflow único `.github/workflows/ci.yml`. Job `build` (gates + artefactos) y job `deploy`
  (Pages) que solo corre en `push` a `main` con `vars.DEPLOY_ENABLED == 'true'`.
- El `deploy` publica el artefacto `sitio-dist` ya validado: no reconstruye ni salta gates.
- Pages: `build_type: workflow`, HTTPS forzado, repo público. Sin rama `gh-pages`.
- Comprobaciones:

```bash
gh api repos/MarcVillarroya/4sotas/pages
gh run list --repo MarcVillarroya/4sotas --limit 3
gh run watch <run-id> --repo MarcVillarroya/4sotas
```

- Migración de dominio: ver `AGENTS.md` §9. Cambian `SITE_ORIGIN`/`SITE_BASE` en el workflow,
  `public/CNAME` si aplica, y se vuelven a pasar los gates. El validador bloquea `4sotas.com`.
- `/sitemap.xml` devuelve 404 **por diseño**: el canónico es `/sitemap-index.xml`.

## 5 · Rollback

Camino soportado y coherente con el flujo (no ejecutado en esta pasada):

```bash
git log --oneline -5            # localizar el commit bueno
git revert <sha-malo>           # nuevo commit que deshace; no reescribe historia
git push origin main            # el job build revalida y deploy republica
```

- Preferir `git revert` a `reset --hard`/`push --force`: `main` es la rama desplegada.
- Un revert de contenido puede fallar los gates si deja referencias colgantes: revertir el bloque
  completo (fuente + entradas que la referencian), no una pieza suelta.
- Rollback solo de contenido sin tocar código: editar el contenido y volver a pasar gates; es
  reversible con el mismo procedimiento.
- No hay rollback automático por deployment: la fuente de verdad es `main`.
- Si el fallo es de infraestructura (Pages caído), revisar `gh api .../pages` y los runs antes de
  tocar código.

## 6 · Solución de fallos

| Síntoma / código | Causa habitual | Acción |
|---|---|---|
| `astro check` aborta pidiendo `npm install @astrojs/markdown-remark` | `node_modules` desincronizado del lockfile (paquete presente en `package-lock.json` pero ausente en disco) | `npm ci` y repetir. Ocurrió en esta pasada: tras `npm ci`, check volvió a 0 errores |
| `B-REF-COLGANTE` | referencia a un `id` que no existe | corregir el `id` o crear la entidad |
| `B-REF-PRIVADA` | entrada publicada referencia un borrador | publicar el bloque completo o dejar la entrada en `revision` |
| `B-PUB-*` (`SIN-FECHA`, `SIN-REVISION`, `SIN-FUENTES`, `SIN-DESC`, `SIN-REVISOR`) | falta un requisito de publicación | completar frontmatter con datos reales; no inventar fechas |
| `B-ENLACE-SIN-BASE` / `W-ENLACE-RELATIVO` | enlace escrito a mano fuera del base path | usar ruta raíz `/oros/...` en Markdown o `ruta.*()` en plantillas |
| `B-DRAFT-EN-DIST` | borrador con página en `dist/` | comprobar `publicados()`/`visibles()`; nunca filtrar con `getCollection` sin filtro |
| `B-CANONICA*` | `SITE_ORIGIN`/`SITE_BASE` distintos del build | reconstruir con las dos variables correctas |
| `B-VIDEO-NO-PUBLICO` / `B-VIDEO-ESTADO` | ficha publicada de vídeo privado/oculto o discrepancia con la API | corregir `estado_youtube`/`privacidad_api` o despublicar la ficha |
| `B-VIDEO-INVENTADO` | `youtube_id` ausente del snapshot | añadir el vídeo real al snapshot o retirar la ficha |
| `B-SECRETO` | token/clave en el árbol | retirar el fichero y rotar la credencial; no reescribir el commit sin decidirlo aparte |
| `B-HERRAMIENTA-FANTASMA` | herramienta publicada `no-implementada` | implementar o dejar en borrador |
| `W-CADUCIDAD` / `W-FUENTE-CADUCADA` | revisión o fuente vencida | revisar y actualizar fecha/fuente |
| `W-VIDEO-SIN-FICHA` (`LL1EJttJPrs`) | vídeo público fuera del alcance V1 | aceptado; no silenciar |
| Job `deploy` no aparece | `DEPLOY_ENABLED` no es `true` o el push no es a `main` | revisar `gh variable list --repo MarcVillarroya/4sotas` |
| Sitio 404 en todo el subpath | `SITE_BASE` incorrecto o Pages sin `build_type: workflow` | revisar `astro.config.mjs`, env del workflow y `gh api .../pages` |
| `npm run build` sin páginas nuevas tras publicar | entrada aún en `borrador`/`revision` | `publicados()` solo acepta `status: publicado` |

Regla general: un `B-*` se corrige en el contenido o en los datos, nunca desactivando la regla.
Los `W-*` se documentan; no se silencian.

## 7 · Qué no tocar sin aprobación

Lo mismo que `AGENTS.md` §10: stack, esquema, rutas, política de publicación, dominio,
`robots.txt`, dependencias de cliente y el propio `AGENTS.md`.
