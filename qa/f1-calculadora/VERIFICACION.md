# Verificación · calculadora de interés compuesto (F1)

Fecha: 26-oct-2026 · Motor 1.0.0 · Perfil `software-engineer` · Tarjeta `t_a85e410a`

Todo lo de este informe se ejecutó en el worktree `.worktrees/t_a85e410a` sobre la base
`02ed365` (plantillas editoriales ya integradas). No hay cifras estimadas: cada bloque copia la
salida real del comando.

## 1 · Comandos y resultados

| Comando | Resultado real |
|---|---|
| `npm run test:calculadora` | `tests 27 · pass 27 · fail 0` |
| `npm test` | `tests 86 · pass 86 · fail 0` (59 previas + 27 nuevas) |
| `npm run check` | `Result (44 files): 0 errors, 0 warnings, 0 hints` |
| `npm run build` | `8 page(s) built` (build público; la ficha en `revision` no genera página) |
| `npm run build:fixtures` | `15 page(s) built` (incluye `/oros/herramientas/interes-compuesto/`) |
| `npm run verificar:plantillas` | `ok · 13 comprobaciones correctas · 0 fallos` |
| `npm run validate` | `ok · 0 bloqueantes · 11 avisos` (los 11 `W-VIDEO-SIN-FICHA` preexistentes) |

## 2 · Vectores independientes

Los 14 vectores están en `tests/calculadora.ts` y su deducción en `docs/CALCULADORA.md` §5. Se
calcularon con `decimal.Decimal` de Python a 40 dígitos, fuera del motor. Muestra de la salida del
motor contrastada con Python en la misma sesión:

| Caso | Motor (página/consola) | Decimal independiente |
|---|---|---|
| 1.000 € + 100 €/mes, 5 % EA, 10 años | 17.065,21 € | 17065.21075692403300185971451406347477285 |
| 1.000 € + 100 €/mes, 7 % EA, 10 años | 19.072,32 € | 19072.32448290311050375042016614203146758 |
| 1.000 € + 100 €/mes, 7 % EA, 20 años | 54.623,32 € | 54623.32211882340609775977446973109089190 |
| Valor real con 3 % de inflación (10 años) | 14.191,60 € | 14191.60059066403390687754572990203329589 |
| 200 €/mes, 5 % EA, 20 años (vector V6) | 81.160,90 € | 81160.897063560684794144456847834918692034389466968 |

## 3 · Verificación funcional en navegador

Servido el build de fixtures con base raíz (`SITE_BASE=/ PUBLIC_FIXTURES=1 astro build --outDir
dist-qa`, `python3 -m http.server`), conducido con Chrome for Testing 156 vía CDP.

Comprobado con la página cargada:

- Render inicial sin JS: `17.065,21 €`, tabla de 10 filas (un cierre por año) y SVG
  `viewBox="0 0 640 300"`.
- Cambiar rentabilidad a 7 % actualiza el importe a `19.072,32 €` y la tasa por periodo a
  `0,5654 %` **sin recarga** (marca `window.__sinRecarga` intacta).
- Inflación 3 % hace aparecer `valor real = 14.191,60 €`.
- Plazo 20 años: 20 filas en la tabla y `role="status"` anuncia
  `Resultado actualizado: 54.623,32 € de capital final.`
- Capital vacío: error visible `El capital inicial debe estar entre 0 y 1.000.000 €.` y
  `aria-invalid="true"` en el campo; el importe anterior no se sobrescribe con basura.
- 1 año y 1 mes con capitalización trimestral: `Con capitalización trimestral, el plazo debe ser
  múltiplo de 3 meses.`
- Teclado: foco en `capitalInicial`, escritura directa, `Tab` pasa a `aportacionPeriodica`,
  `requestSubmit()` no recarga. `outline` computado tras `Tab`: `solid 3px`.
- Estructura: `h1` = 1, 0 `id` duplicados, 9 controles y todos con `label[for]`, `0` iframes,
  `<caption>` en la tabla y `th scope="col"`, `0` overflow horizontal en 1280, 1440, 768 y 390.
- JSON-LD de la página: `WebSite`, `WebPage`, `SoftwareApplication`, `BreadcrumbList`; sin
  `aggregateRating`/`reviewCount`; `offers.price = "0"`.
- Estado declarado visible: «Beta»; fórmula de la ficha idéntica a la que ejecuta el motor.
- Ejemplos publicados (recalculados en cada build): 1628,89 € · 81.160,90 € · 44.936,82 € en euros
  de hoy, coherentes con V2, V6 y V13.

## 4 · Capturas

`qa/f1-calculadora/calculadora-1440.png`, `calculadora-768.png`, `calculadora-390.png`
(1440×2800, 768×2800, 390×2800, `chrome-headless-shell` 156). El juicio perceptivo y las
correcciones de acabado corresponden a la tarjeta de QA visual (`t_455d6972`); aquí solo se
comprueba geometría y contenido.

Medidas del layout (viewport 1280): formulario 557 px de ancho, caja de resultado 557 px,
tabla 505 px dentro de la columna derecha, altura de documento 4.409 px, sin solapamientos.

## 5 · Aislamiento de borradores

La ficha `herr-interes-compuesto` está en `status: revision`, como el resto del contenido en esta
fase. Consecuencia verificada: el build público tiene 8 páginas y **no** incluye la calculadora;
el build de fixtures tiene 15 y sí la incluye, con `verificar:plantillas` en verde (ningún
borrador con página en el build público). Publicarla exige dos cambios editoriales, no de código:
`status: publicado` + `publicado`, y repuntar `temas[0]` de `tema-fixture-demo` a `tema-ahorro`
cuando ese tema exista en la colección.

## 6 · Riesgos y pendientes

1. **Referencia provisional a `tema-fixture-demo`.** El modelo exige `temas` ≥ 1 y el único tema
   existente en esta rama es el fixture heredado de la tarjeta de plantillas. Al importar el
   contenido del grupo A hay que repuntar a `tema-ahorro` en el mismo commit; si no, la ficha
   queda enlazada a un dato de prueba.
2. **Frecuencia diaria no soportada** (decisión documentada): anual, semestral, trimestral y
   mensual.
3. **Comparación de escenarios fuera de V1** (decisión documentada): exigiría segunda simulación
   validada y tabla accesible propia.
4. **Sin auditoría perceptiva propia**: las capturas existen, pero la revisión visual (contraste,
   escala, estados) la asume `t_455d6972`.
5. **`B-DRAFT-EN-DIST` del validador canónico sigue siendo un check muerto** (heredado de
   `t_e10fce1f`, reportado en la tarjeta de plantillas). No lo he tocado porque su dueño es
   `staff-engineer`; aquí el aislamiento lo cubre `verificar:plantillas`.
