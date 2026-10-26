import json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
urls = json.load(open("qa/f1-revision/urls.json"))

def check(item):
    sid, url = item
    cmd = ["curl", "-sS", "-o", "/dev/null", "-L", "--max-time", "25",
           "-A", UA, "-w", "%{http_code}\t%{url_effective}\t%{size_download}", url]
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=40)
        out = p.stdout.strip() or ("ERR:" + p.stderr.strip().replace("\n", " ")[:120])
    except Exception as e:
        out = "ERR:" + str(e)[:120]
    return (sid, url, out)

with ThreadPoolExecutor(max_workers=8) as ex:
    results = list(ex.map(check, sorted(urls.items())))

with open("qa/f1-revision/http-check.tsv", "w") as f:
    for sid, url, out in results:
        f.write(f"{sid}\t{url}\t{out}\n")

ok = 0
for sid, url, out in results:
    code = out.split("\t")[0]
    if code.startswith("2"):
        ok += 1
    print(f"{code}\t{sid}\t{url[:110]}")
print(f"\nTOTAL {len(results)} | 2xx {ok} | non-2xx {len(results)-ok}")
