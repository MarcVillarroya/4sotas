#!/usr/bin/env bash
# Comprobación HTTP real de las URLs de research/sources.json (carril A del dossier F0).
set -u
OUT=qa/f1-integral/05-sources-http.tsv
: > "$OUT"
node -e '
const s = require("/home/mvf/4sotas/research/sources.json");
const arr = Array.isArray(s) ? s : (s.sources ?? s.fuentes ?? []);
const urls = new Set();
for (const x of arr) {
  for (const k of ["url","url_final","enlace","href"]) if (typeof x[k] === "string" && x[k].startsWith("http")) urls.add(x[k]);
  for (const u of x.urls ?? []) if (typeof u === "string" && u.startsWith("http")) urls.add(u);
}
console.log([...urls].join("\n"));
' > /tmp/qa-urls.txt
TOTAL=$(wc -l < /tmp/qa-urls.txt)
echo "urls=$TOTAL" | tee -a "$OUT"
while IFS= read -r u; do
  code=$(curl -sL -o /tmp/qa-body.bin -w "%{http_code}" --max-time 25 -A "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131 Safari/537.36" "$u")
  ctype=$(file -b --mime-type /tmp/qa-body.bin)
  size=$(wc -c < /tmp/qa-body.bin)
  printf "%s\t%s\t%s\t%s\n" "$code" "$ctype" "$size" "$u" >> "$OUT"
done < /tmp/qa-urls.txt
echo "--- resumen por código" | tee -a "$OUT"
cut -f1 "$OUT" | grep -E '^[0-9]{3}$' | sort | uniq -c | tee -a "$OUT"
echo "--- no 2xx/3xx" | tee -a "$OUT"
awk -F'\t' '$1 !~ /^[23][0-9][0-9]$/ && $1 ~ /^[0-9]{3}$/ {print}' "$OUT" | tee -a "$OUT"
