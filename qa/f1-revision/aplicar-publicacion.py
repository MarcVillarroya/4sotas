#!/usr/bin/env python3
"""Paso a publicado del bloque editorial tras la revision factual del 26-oct-2026.

Aplica, con assert por cada sustitucion:
  - correcciones factuales detectadas en la revision (30,20 -> 30,65; URL 404 -> 200)
  - notas de verificación de fuentes actualizadas con lo comprobado hoy
  - publicado / revisado_factual / seo.descripcion / autorias.revisor
  - status: publicado en las 39 entradas revisadas (las 6 fixtures quedan en borrador)
"""
import re
import sys

FECHA = "2026-10-26"
REVISOR = "aut-revision-factual-qa"

DESC = {
    "src/content/temas/tema-banca.md":
        "Tarjetas, cuentas y comisiones: cuánto cuesta de verdad el dinero del banco y cómo se compara un 1,5 % mensual con una TAE.",
    "src/content/temas/tema-burbujas.md":
        "Tres episodios históricos —tulipanes, Nasdaq y S&P 500— con cifras verificables y las lecciones que sí se pueden aplicar a tu dinero.",
    "src/content/temas/tema-inversion.md":
        "Interés compuesto, aportación periódica, fondos y ETF con las cuentas a la vista y sin promesas de rentabilidad.",
    "src/content/temas/tema-vivienda.md":
        "Del precio de salida al último recibo: entrada, impuestos, gastos y cuota de la hipoteca con la aritmética hecha.",
    "src/content/articulos/art-comprar-piso-coste.md":
        "Qué cuesta de verdad un piso de 200.000 €: entrada, ITP catalán, gastos y cuota con amortización francesa paso a paso.",
    "src/content/articulos/art-dca-interes-compuesto.md":
        "El interés compuesto con aportación mensual, tres escenarios de tasa y la corrección por inflación y por impuestos.",
    "src/content/articulos/art-fondos-vs-etf.md":
        "Traspaso sin tributar, diferimiento y costes: qué cambia entre un fondo indexado y un ETF al mover el dinero.",
    "src/content/articulos/art-tarjetas-comisiones.md":
        "Débito, crédito y revolving: cuándo sale el dinero, cuánto cuesta aplazar y por qué el 1,5 % mensual es un 18 % nominal.",
    "src/content/glosario/glo-amortizacion-francesa.md":
        "Sistema de cuota constante en el que al principio casi todo son intereses: definición, fórmula y ejemplo con 180.000 € al 3,01 %.",
    "src/content/glosario/glo-dca.md":
        "Aportación periódica (DCA): qué hace y qué no con la aritmética del interés compuesto, sin promesas de rentabilidad.",
    "src/content/glosario/glo-diversificacion.md":
        "Repartir el riesgo entre activos, sectores y geografías: qué significa y qué no puede garantizar por sí sola.",
    "src/content/glosario/glo-tae.md":
        "Tasa anual equivalente: el coste real de un préstamo o tarjeta, con comisiones y capitalización, frente al TIN del anuncio.",
    "src/content/glosario/glo-tin.md":
        "Tipo de interés nominal: el precio sin comisiones ni productos vinculados, y por qué no sirve para comparar ofertas.",
    "src/content/glosario/glo-traspaso-fondos.md":
        "Cambio de un fondo a otro sin tributar ni perder la fecha de adquisición: requisitos, plazos y qué no aplica a los ETF.",
}

# ── correcciones puntuales (fichero, viejo, nuevo, motivo) ───────────────────
FIXES = [
    ("src/content/articulos/art-bruto-a-neto.md",
     "La empresa aporta un 30,20 % adicional",
     "La empresa aporta un 30,65 % adicional",
     "suma de la propia tabla: 23,60+5,50+0,60+0,20+0,75 = 30,65"),
    ("src/content/fuentes/src-aeat-algoritmo-retenciones-2026.yaml",
     "Algoritmo+Retenciones-2026_10sept.pdf",
     "Algoritmo%20Retenciones-2026_10sept.pdf",
     "la URL con '+' devolvía HTTP 404; con %20 devuelve 200 application/pdf"),
    ("src/content/articulos/art-tramos-irpf-y-retencion.md",
     "2026/Algoritmo+Retenciones-2026_10sept.pdf",
     "2026/Algoritmo%20Retenciones-2026_10sept.pdf",
     "404 -> 200"),
    ("src/content/articulos/art-tramos-irpf-y-retencion.md",
     "  - fuente: src-aeat-rdl-4-2024-art20\n    dato: Reducción del art. 20 y límites de obligación de declarar 22.000 y 15.876 euros\n",
     "  - fuente: src-aeat-rdl-4-2024-art20\n    dato: Reducción del art. 20 y elevación a 15.876 € del límite de obligación de declarar\n"
     "  - fuente: src-boe-ley-35-2006-lirpf\n    dato: Arts. 63, 66, 96 y 101 LIRPF (escala, escala del ahorro, límites de 22.000/15.876/1.500 € y pagos a cuenta)\n",
     "la página del RDL 4/2024 no menciona 22.000 ni 1.500: están en el art. 96.3 LIRPF"),
    ("src/content/articulos/art-bruto-a-neto.md",
     "  - fuente: src-boe-la-rioja-ley-9-2025\n",
     "  - fuente: src-boe-ley-35-2006-lirpf\n    dato: Art. 96.3 LIRPF: límites de 22.000 €, 15.876 € y excepción de 1.500 € del segundo pagador\n"
     "  - fuente: src-boe-la-rioja-ley-9-2025\n",
     "los límites de declarar que cita el texto salen del art. 96.3 LIRPF y no estaban entre las fuentes del artículo"),
    ("src/content/articulos/art-comprar-piso-coste.md",
     "dato: Escala de ITP de Cataluña vigente desde el 27 de junio de 2025, pendiente de confirmar en la ATC.",
     "dato: Escala de ITP de Cataluña desde el 27 de junio de 2025; 10 % hasta 600.000 € y tipo medio por encima, verificado en la ATC.",
     "la ATC respondió 200 el 26-oct-2026 y contiene la escala y el 27.06.2025"),
    ("src/content/temas/tema-vivienda.md",
     "dato: Escala de ITP en Cataluña desde el 27 de junio de 2025, pendiente de confirmación manual en la ATC.",
     "dato: Escala de ITP en Cataluña desde el 27 de junio de 2025; 10 % hasta 600.000 € y tipo medio por encima, verificado en la ATC.",
     "verificado en la ATC el 26-oct-2026"),
    ("src/content/temas/tema-vivienda.md",
     "- El ITP citado es el catalán y está pendiente de confirmación manual en la ATC; **no** se extrapola\n  a otras comunidades.",
     "- El ITP citado es el catalán y se verificó en la ATC el 26-oct-2026; **no** se extrapola a otras\n  comunidades, que tienen sus propias escalas y reducciones.",
     "ya no hay confirmación pendiente"),
    ("src/content/articulos/art-tarjetas-comisiones.md",
     "(`src-bde-consulta-endeudamiento-40`; fuente pendiente de re-verificación literal).",
     "(`src-bde-consulta-endeudamiento-40`; frase literal comprobada el 26-oct-2026).",
     "frase literal verificada en el Portal del Cliente Bancario"),
    ("src/content/articulos/art-tarjetas-comisiones.md",
     "- La referencia del 40 % es del Banco de España y está pendiente de re-verificación literal en la\n  fuente.",
     "- La referencia del 40 % es del Banco de España y su formulación literal se comprobó en la fuente\n  el 26-oct-2026.",
     "verificado"),
    ("src/content/temas/tema-banca.md",
     "(`src-bde-consulta-endeudamiento-40`, fuente pendiente de re-verificación",
     "(`src-bde-consulta-endeudamiento-40`, frase literal comprobada el 26-oct-2026;",
     "verificado"),
]

# ── notas de verificación de fuentes, actualizadas con lo comprobado hoy ────
NOTAS = {
    "src/content/fuentes/src-s6-01.yaml":
        "CSV completo descargado el 26-oct-2026 (fredgraph.csv, HTTP 200): 751,96 (30-dic-1994), 5.048,62 (10-mar-2000) y 1.114,11 (9-oct-2002) confirmados; último dato 2026-10-23.",
    "src/content/fuentes/src-s6-02.yaml":
        "FRED solo sirve 10 años de SP500 (24-oct-2016 a 21-oct-2026), comprobado el 26-oct-2026. Los cierres 1.565,15 (9-oct-2007) y 676,53 (9-mar-2009) se verificaron con el histórico de ^GSPC en Yahoo Finance.",
    "src/content/fuentes/src-boe-ley-35-2006-lirpf.yaml":
        "Leídos en la versión consolidada (HTTP 200, 26-oct-2026) los arts. 20, 63, 66, 96 y 101 usados en las guías; la escala del ahorro 19/21/23/27/30 % rige desde el 1-ene-2025 (Ley 7/2024).",
    "src/content/fuentes/src-s4-01.yaml":
        "PDF descargado y leído el 26-oct-2026 (HTTP 200): traspaso sin tributar ni retener, conservación de valor y fecha, exclusión de ETF y retención del 19 % a cuenta.",
    "src/content/fuentes/src-bde-consulta-endeudamiento-40.yaml":
        "Frase literal comprobada el 26-oct-2026: el total de deudas «no debería sobrepasar el 40 % de los ingresos netos mensuales».",
    "src/content/fuentes/src-aeat-escala-general-irpf-2025.yaml":
        "Verificado por HTTP el 26-oct-2026: tramos 12.450/20.200/35.200/60.000/300.000 € y tipos del 9,50 % al 24,50 %.",
    "src/content/fuentes/src-bde-estadisticas-tipos-interes.yaml":
        "Página verificada por HTTP el 26-oct-2026. Es un marco de estadísticas: no se cita ninguna TAE concreta, solo el comparador.",
    "src/content/fuentes/src-aeat-algoritmo-retenciones-2026.yaml":
        "PDF descargado y leído el 26-oct-2026 (HTTP 200): RDL 23/2026, de 8-sep, amplía la reducción del tipo a residentes en La Palma; la escala general no cambia.",
    "src/content/fuentes/src-legia-art66-escala-ahorro.yaml":
        "Espejo del BOE servido por JS: el texto no se puede leer por HTTP. La escala 19/21/23/27/30 % (Ley 7/2024, desde 1-ene-2025) se verificó en el art. 66 LIRPF del BOE consolidado.",
}

# ficheros de los que se retira la referencia a legia (sustituida por el BOE)
QUITA_LEGIA = [
    "src/content/articulos/art-tramos-irpf-y-retencion.md",
    "src/content/articulos/art-primeros-1000-euros.md",
    "src/content/articulos/art-fondos-vs-etf.md",
    "src/content/temas/tema-inversion.md",
]

errores = []


def sub(path, old, new, motivo, count=1):
    t = open(path).read()
    if old not in t:
        errores.append(f"NO APLICADO {path}: {motivo}")
        return False
    if count == 1 and t.count(old) != 1:
        errores.append(f"AMBIGUO ({t.count(old)}x) {path}: {motivo}")
        return False
    open(path, "w").write(t.replace(old, new))
    return True


for path, old, new, motivo in FIXES:
    sub(path, old, new, motivo)

# notas: reemplaza la línea nota_verificacion completa
for path, nota in NOTAS.items():
    if len(nota) > 240:
        errores.append(f"NOTA DEMASIADO LARGA ({len(nota)}) {path}")
        continue
    t = open(path).read()
    m = re.search(r"^nota_verificacion:.*$", t, re.M)
    if not m:
        errores.append(f"SIN nota_verificacion {path}")
        continue
    open(path, "w").write(t[:m.start()] + f'nota_verificacion: "{nota}"' + t[m.end():])

# legia: quitar de la lista de fuentes y del cuerpo; el BOE ya está o se añade
for path in QUITA_LEGIA:
    t = open(path).read()
    t2 = re.sub(r"  - fuente: src-legia-art66-escala-ahorro\n    dato: [^\n]*\n", "", t)
    t2 = t2.replace("`src-legia-art66-escala-ahorro`, ", "").replace("(`src-legia-art66-escala-ahorro`)", "(`src-boe-ley-35-2006-lirpf`)")
    t2 = t2.replace("`src-s4-01`, `src-legia-art66-escala-ahorro`", "`src-s4-01`, `src-boe-ley-35-2006-lirpf`")
    if "src-legia-art66" in t2:
        errores.append(f"QUEDA legia en {path}")
    if "src-boe-ley-35-2006-lirpf" not in t2:
        errores.append(f"sin fuente BOE tras quitar legia en {path}")
    open(path, "w").write(t2)

# legia: marcarla como requiere navegador
p = "src/content/fuentes/src-legia-art66-escala-ahorro.yaml"
t = open(p).read()
if "acceso: requiere-navegador" not in t:
    t = re.sub(r"^acceso:.*$", "acceso: requiere-navegador", t, flags=re.M)
    open(p, "w").write(t)

# ── paso a publicado ────────────────────────────────────────────────────────
import glob

publicables = (sorted(glob.glob("src/content/temas/*.md")) + sorted(glob.glob("src/content/articulos/*.md")) +
               sorted(glob.glob("src/content/glosario/*.md")) + sorted(glob.glob("src/content/videos/*.yaml")) +
               sorted(glob.glob("src/content/herramientas/*.yaml")))

hechos = []
for path in publicables:
    t = open(path).read()
    fm_m = re.match(r"^---\n(.*?)\n---\n", t, re.S)
    if fm_m:
        fm = fm_m.group(1)
        head, tail = t[:fm_m.end()], t[fm_m.end():]
    else:
        fm = ""
        head, tail = "", t  # YAML plano (videos/herramientas): solo cambios en el bloque completo

    if re.search(r"^status:\s*borrador", fm or t, re.M):
        continue  # fixtures: no se publican

    # 1) status
    if "status: revision" not in (fm or t):
        errores.append(f"status inesperado en {path}")
        continue
    fm2 = (fm or t).replace("status: revision", "status: publicado", 1)

    # 2) publicado + revisado_factual tras creado:
    if "publicado:" not in fm2:
        fm2 = re.sub(r"^(creado:.*)$", rf"\1\npublicado: {FECHA}\nrevisado_factual: {FECHA}", fm2, count=1, flags=re.M)
    # 3) revisor
    if "revisor:" not in fm2:
        fm2 = re.sub(r"^(  redactor: \S+)$", rf"\1\n  revisor: {REVISOR}", fm2, count=1, flags=re.M)

    # 4) seo.descripcion
    if path in DESC:
        d = DESC[path]
        if not (50 <= len(d) <= 160):
            errores.append(f"DESC longitud {len(d)} en {path}")
        if "seo: {}" in fm2:
            fm2 = fm2.replace("seo: {}", f'seo:\n  descripcion: "{d}"\n  noindex: false', 1)
        elif re.search(r"^seo:\s*$", fm2, re.M) and "  descripcion:" not in fm2:
            fm2 = re.sub(r"^seo:\s*$", f'seo:\n  descripcion: "{d}"', fm2, count=1, flags=re.M)

    if fm_m:
        open(path, "w").write(t[:fm_m.start(1)] + fm2 + t[fm_m.end(1):])
    else:
        open(path, "w").write(fm2)
    hechos.append(path)

print(f"publicadas: {len(hechos)}")
for h in hechos:
    print("  ", h)
if errores:
    print("\nERRORES:")
    for e in errores:
        print("  -", e)
    sys.exit(1)
print("\nOK sin errores")
