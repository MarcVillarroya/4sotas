import glob, json, os, re

CACHE = "qa/f1-revision/cache"
NUM = re.compile(r"\d[\d.,]*\d|\d")

def digits(seq):
    return re.sub(r"\D", "", seq)

def load_text(sid):
    p = f"{CACHE}/{sid}.txt"
    return open(p, errors="ignore").read() if os.path.exists(p) else ""

def source_digit_index(sid):
    t = load_text(sid)
    idx = set()
    for m in NUM.finditer(t):
        d = digits(m.group(0))
        if len(d) >= 2:
            idx.add(d)
            # also comma-decimal variants: 4,9 -> 49 ; keep both
    return idx, t

def parse_fuentes(path):
    txt = open(path, errors="ignore").read()
    m = re.match(r"^---\n(.*?)\n---\n", txt, re.S)
    if not m:
        return []
    fm = m.group(1)
    out = []
    cur = None
    for line in fm.split("\n"):
        mm = re.match(r"\s*-\s*fuente:\s*(\S+)", line)
        if mm:
            cur = {"fuente": mm.group(1), "dato": ""}
            out.append(cur)
            continue
        md = re.match(r"\s+dato:\s*(.*)$", line)
        if md and cur is not None:
            cur["dato"] = md.group(1).strip()
    return out

files = sorted(glob.glob("src/content/temas/*.md") + glob.glob("src/content/articulos/*.md") +
               glob.glob("src/content/glosario/*.md") + glob.glob("src/content/herramientas/*.yaml") +
               glob.glob("src/content/videos/*.yaml") + glob.glob("src/content/series/*.yaml"))

idx_cache = {}
report = []
for f in files:
    for ref in parse_fuentes(f):
        sid = ref["fuente"]
        if sid not in idx_cache:
            idx_cache[sid] = source_digit_index(sid)[0]
        idx = idx_cache[sid]
        nums = [m.group(0) for m in NUM.finditer(ref["dato"]) if len(digits(m.group(0))) >= 2]
        missing = []
        for n in nums:
            d = digits(n)
            if d in idx:
                continue
            # allow decimal-comma variant collapsed (4,9 vs 49) and thousands variants
            if d in (lambda s: s)(d):
                pass
            missing.append(n)
        report.append({"file": f, "fuente": sid, "dato": ref["dato"], "numeros": nums, "no_encontrados": missing})

json.dump(report, open("qa/f1-revision/claims.json", "w"), indent=1, ensure_ascii=False)
tot = len(report)
bad = [r for r in report if r["no_encontrados"]]
print(f"claims: {tot} | con alguna cifra no localizada en la fuente: {len(bad)}")
for r in bad:
    print(f"\n{r['file']}\n  fuente={r['fuente']}\n  dato={r['dato']}\n  faltan={r['no_encontrados']}")
