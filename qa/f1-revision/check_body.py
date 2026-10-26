import glob, json, os, re

CACHE = "qa/f1-revision/cache"
NUM = re.compile(r"\d[\d.,]*\d|\d")

def digits(s):
    return re.sub(r"\D", "", s)

def text(sid):
    p = f"{CACHE}/{sid}.txt"
    return open(p, errors="ignore").read() if os.path.exists(p) else ""

def index(t):
    i = set()
    for m in NUM.finditer(t):
        d = digits(m.group())
        if len(d) >= 3:
            i.add(d)
    return i

def frontmatter(t):
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", t, re.S)
    return (m.group(1), m.group(2)) if m else ("", t)

rows = []
for f in sorted(glob.glob("src/content/temas/*.md") + glob.glob("src/content/articulos/*.md")):
    raw = open(f, errors="ignore").read()
    fm, body = frontmatter(raw)
    sids = re.findall(r"-\s*fuente:\s*(\S+)", fm)
    idx = set()
    for s in sids:
        idx |= index(text(s))
    body_nums = []
    for m in NUM.finditer(body):
        tok = m.group()
        d = digits(tok)
        if len(d) < 3:
            continue
        body_nums.append(tok)
    unique = sorted(set(body_nums), key=lambda x: -len(digits(x)))
    missing = [t for t in unique if digits(t) not in idx]
    rows.append({"file": f, "fuentes": sids, "cifras_body": len(unique), "no_en_fuentes": missing})

json.dump(rows, open("qa/f1-revision/body-claims.json", "w"), indent=1, ensure_ascii=False)
for r in rows:
    print(f"\n{r['file']}  cifras={r['cifras_body']} sin_localizar={len(r['no_en_fuentes'])}")
    print("   " + ", ".join(r["no_en_fuentes"][:40]))
