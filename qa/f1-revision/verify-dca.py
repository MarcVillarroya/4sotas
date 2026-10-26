i = 1.05 ** (1 / 12) - 1
print(f"tipo mensual equivalente 5% EA = {i*100:.6f}% (texto 0,407412 %)")

def fv_anual(A, years, i=i):
    n = years * 12
    return A * ((1 + i) ** n - 1) / i

print(f"a) 200/mes 20a: aportado {200*240} final {fv_anual(200,20):.2f} (texto 81.160,90) ganancia {fv_anual(200,20)-48000:.2f} (texto 33.160,90) pct {(fv_anual(200,20)/48000-1)*100:.0f}% (texto 69%)")
print(f"b) 300/mes 30a: aportado {300*360} final {fv_anual(300,30):.2f} (texto 244.612,77) ganancia {fv_anual(300,30)-108000:.2f}")
print(f"   incremental vs 20a: final {fv_anual(300,30)-fv_anual(200,20):.2f} (texto 'mas de 160.000')")
print(f"c) 1.000/mes 12m: final {fv_anual(1000,1):.2f} (texto 12.272,58); de golpe 12.000*1.05={12000*1.05:.2f} (texto 12.600)")

for rate in (0.0, 0.03, 0.05):
    if rate == 0:
        print(f"   tasa 0%: {200*240:.2f}")
    else:
        im = (1 + rate) ** (1 / 12) - 1
        v = fv_anual(200, 20, im)
        print(f"   tasa {rate*100:.0f}%: final {v:.2f} ganancia {v-48000:.2f}   (texto 65.370,89 / 17.370,89)")

print(f"regla 72: 5% {72/5} (14,4) · 3% {72/3} · 8% {72/8}")
print(f"1.000 al 5% 10a: {1000*1.05**10:.2f} (texto 1.628,89); 20a: {1000*1.05**20:.2f} (texto 2.653,30)")
print(f"retencion 19% sobre 33.160,90 = {33160.90*0.19:.2f} (texto 'aproximadamente 6.300')")
print(f"poder de compra 81.160,90 a 20a con 4,9%: {81160.90/1.049**20:.2f} (texto ~31.177)")
print(f"poder de compra 1.628,89 a 10a con 4,9%: {1628.89/1.049**10:.2f} (texto ~1.009)")
