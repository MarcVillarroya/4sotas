import json, os, re, subprocess, glob
from concurrent.futures import ThreadPoolExecutor

CACHE = "qa/f1-revision/cache"
os.makedirs(CACHE, exist_ok=True)
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
urls = json.load(open("qa/f1-revision/urls.json"))

def norm(t):
    t = re.sub(r"<script.*?</script>", " ", t, flags=re.S | re.I)
    t = re.sub(r"<style.*?</style>", " ", t, flags=re.S | re.I)
    t = re.sub(r"<[^>]+>", " ", t)
    t = (t.replace("&nbsp;", " ").replace("&amp;", "&").replace("&euro;", "EUR")
          .replace("&aacute;", "a").replace("&oacute;", "o").replace("&eacute;", "e")
          .replace("&iacute;", "i").replace("&uacute;", "u").replace("&ntilde;", "n")
          .replace("&#39;", "'").replace("&quot;", '"').replace("&lt;", "<").replace("&gt;", ">"))
    t = re.sub(r"&[a-z]+;|&#\d+;", " ", t)
    return re.sub(r"[ \t\r\f\v]+", " ", t)

def fetch(item):
    sid, url = item
    binp = f"{CACHE}/{sid}.bin"
    txtp = f"{CACHE}/{sid}.txt"
    if os.path.exists(txtp) and os.path.getsize(txtp) > 200:
        return (sid, url, "cached", os.path.getsize(txtp))
    r = subprocess.run(["curl", "-sS", "-L", "--max-time", "40", "-A", UA, "-o", binp, "-w", "%{http_code}", url],
                       capture_output=True, text=True)
    code = r.stdout.strip()
    size = os.path.getsize(binp) if os.path.exists(binp) else 0
    text = ""
    if size and open(binp, "rb").read(4) == b"%PDF":
        p = subprocess.run(["pdftotext", "-enc", "UTF-8", "-layout", binp, txtp], capture_output=True, text=True)
        text = open(txtp, errors="ignore").read() if os.path.exists(txtp) else ""
    else:
        text = norm(open(binp, errors="ignore").read()) if size else ""
        open(txtp, "w").write(text)
    return (sid, url, code, len(text))

with ThreadPoolExecutor(max_workers=6) as ex:
    res = list(ex.map(fetch, sorted(urls.items())))

for sid, url, code, n in res:
    print(f"{code}\t{sid}\t{n} chars")
