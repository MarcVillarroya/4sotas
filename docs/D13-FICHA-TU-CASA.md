# D13 — Ficha web del short tu-casa-50k en 4sotas

Repo: `/home/mvf/4sotas/site` (Astro SSG, GitHub Pages `MarcVillarroya/4sotas`).
Vídeo ya subido a YouTube: **`mu4mTE_ouJ0`**, privado + `publishAt 2026-10-28T17:30:00Z` (18:30 Madrid). A las 18:30 será público.

## Objetivo
Dejar la ficha del vídeo creada y validada, SIN publicarla en la web todavía (el filtro del sitio exige `estado_youtube: publico` + `privacidad_api: public`). El orquestador ejecutará `publicar-ficha.mjs --commit` a las 18:32.

## 1. Ficha
Crea `src/content/videos/vid-mu4mTE_ouJ0.yaml` copiando el esquema exacto de `src/content/videos/vid-t1zPAoZV05M.yaml`. Valores:

- id: `vid-mu4mTE_ouJ0`
- status: `aprobado`
- universo: `oros`
- creado / publicado / revisado_factual: `2026-10-28`
- sensibilidad: `baja`
- procedencia: `original`
- autorias: redactor `aut-marc-villarroya`, revisor `aut-revision-factual-qa`
- fuentes: `[]`
- seo.descripcion: "Vídeo corto de Sota de Oros sobre el préstamo público TU CASA: hasta 50.000 € al 0 % para la primera vivienda, con un límite permanente al precio de venta."
- seo.noindex: false
- actualizacion.politica: `revision-anual`
- youtube_id: `mu4mTE_ouJ0`
- slug: `tu-casa-50k`
- titulo: `¿50.000 € al 0 % para comprar casa? Ojo al venderla`
- descripcion_corta: "Préstamo público de hasta 50.000 € al 0 % para complementar la hipoteca de la primera vivienda; el capital se devuelve y el precio de venta queda limitado."
- publicado_en: `2026-10-28`
- duracion_iso: `PT53S`
- miniatura: `https://i.ytimg.com/vi/mu4mTE_ouJ0/maxresdefault.jpg`
- miniatura_local: `/assets/videos/mu4mTE_ouJ0.webp`
- estado_youtube: `programado`
- privacidad_api: `private`
- verificado_en: `2026-10-28`
- vistas_al_verificar: 0
- idioma: `es`
- temas: [`tema-vivienda`]
- relacionados: enlaza con la ficha de hipotecas/compra de vivienda que ya exista en `src/content/videos/` (busca por título o slug); si no hay, `[]`.
- transcripcion: false
- capitulos: []
- informacion.estado: `completo`
- informacion.resumen: "El Real Decreto-ley 29/2026 crea el mecanismo TU CASA: un préstamo público de hasta el 20 % del valor de la vivienda y 50.000 € como máximo, al 0 % de interés y sin comisiones, para complementar la hipoteca de la primera vivienda habitual. El capital debe devolverse. La condición que cambia la decisión: el precio máximo de transmisión queda limitado de forma permanente, actualizable por IPC y mejoras admitidas. Los requisitos y el procedimiento dependen todavía de un Acuerdo del Consejo de Ministros."
- informacion.que_cubre: [hasta 20 % y máximo 50.000 €, 0 % interés y 0 comisiones, obligación de devolver el capital, límite permanente al precio de venta con IPC y mejoras, procedimiento aún pendiente]
- informacion.que_no_cubre: ["No afirma que el préstamo pueda solicitarse ya.", "No es asesoramiento financiero."]
- informacion.para_quien: "Para quien se plantea comprar su primera vivienda y quiere entender la contrapartida antes de decidir."
- informacion.origen: `descripcion-oficial`
- informacion.faltan: []
- informacion.heredado: false

## 2. Miniatura local
Genera `public/assets/videos/mu4mTE_ouJ0.webp` (640×360) y `mu4mTE_ouJ0-320.webp` (320×180) desde el frame 0,6 s de `out/tu-casa-50k-V2.1-FINAL.mp4` del proyecto `tu-casa-50k` (o desde el póster aprobado si existe uno mejor). Calidad WebP ~82. Sin texto añadido: la miniatura final la pone Marc en Studio; esto es solo el póster de la ficha.

## 3. Validación (sin commit)
```
npm run check && npm test && npm run build && npm run verificar:plantillas && npm run validate
```
Si `validate` falla por la ficha `programado`, comprueba que el esquema permite `estado_youtube: programado` + `privacidad_api: private` + `status: aprobado`; no cambies el esquema. Reporta la salida real.

## Entregable
`docs/D13-RESULTADO.md` con: ruta de la ficha, hashes de las dos WebP, salida de cada gate, y confirmación de que la ficha NO aparece en `dist/` (sigue programada). No hagas commit ni push.

## REGLA DE CIERRE
No bloquees por dudas de copy: usa los textos de arriba. Si un gate falla, entrega la ficha y el fallo exacto; no toques el esquema ni otras fichas.
