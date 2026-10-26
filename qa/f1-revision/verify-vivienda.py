def cuota(P, tin, years):
    i = tin / 12
    n = years * 12
    return P * i / (1 - (1 + i) ** -n)

def total(P, tin, years):
    return cuota(P, tin, years) * years * 12

def r(x, nd=2):
    return round(x + 1e-9, nd)

cases = [
    ("180785 @3,01% 26a", 180785, 0.0301, 26, "836,14 / 260.875,78 / 80.090,78"),
    ("200000 @3% 25a", 200000, 0.03, 25, "948,42 / 84.526,79"),
    ("200000 @3% 30a", 200000, 0.03, 30, "843,21 / 103.554,90"),
    ("200000 @4% 30a", 200000, 0.04, 30, "954,83 / 143.739,01"),
]
for name, P, tin, y, expect in cases:
    c = cuota(P, tin, y); t = total(P, tin, y)
    print(f"{name}: cuota={r(c):.2f} total={r(t):.2f} intereses={r(t-P):.2f}   (texto: {expect})")

# 180.000 @3,01% 26 años: primer recibo y primer año
P, tin, y = 180000, 0.0301, 26
c = cuota(P, tin, y)
int1 = P * tin / 12
am1 = c - int1
print(f"\n180.000 @3,01% 26a: cuota={r(c):.2f} int1={r(int1):.2f} amort1={r(am1):.2f}  (texto: cuota 832,51 · int 451,50 · amort 381,01)")
bal = P
paid = 0.0
for m in range(12):
    interest = bal * tin / 12
    bal = bal + interest - c
    paid += c
print(f"primeros 12 meses: pagado={r(paid):.2f} (texto 9.990,12) capital devuelto={r(P-bal):.2f} (texto 4.635,72) intereses={r(paid-(P-bal)):.2f} pct_interes={r((paid-(P-bal))/paid*100,1)}% (texto 54%)")

# pasar de 26 a 30 años con 180.000
c30 = cuota(180000, 0.0301, 30)
t26 = total(180000, 0.0301, 26)
t30 = total(180000, 0.0301, 30)
print(f"180.000 30a: cuota={r(c30):.2f} (texto 759,86) ahorro cuota={r(c-c30):.2f} (texto 72,65) intereses+={r((t30-180000)-(t26-180000)):.2f} (texto 13.806,01)")

# euribor +1 punto
c401 = cuota(180000, 0.0401, 26)
print(f"180.000 @4,01% 26a: cuota={r(c401):.2f} (texto 929,89) diff={r(c401-c):.2f} (texto 97,38)")

# entrada y gastos
print(f"\nentrada 20% de 200.000 = {200000*0.2:.2f}; ITP 10% = {200000*0.10:.2f}; total 40000+20000+3000 = 63000; sobre precio = {63000/200000*100:.1f}% (texto 31,5%)")
