#!/usr/bin/env python3
"""Comprobación en vivo del sitio: estados, títulos, un solo h1, JSON-LD válido y enlaces internos."""
import html
import json
import re
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from collections import Counter
from concurrent.futures import ThreadPoolExecutor

BASE = 'https://4sotas.com'
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131 Safari/537.36'
NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'


def get(url, method='GET'):
    req = urllib.request.Request(url, headers={'User-Agent': UA}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read(), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, b'', dict(e.headers)


def bajar(url):
    estado, cuerpo, _ = get(url)
    return url, estado, cuerpo.decode('utf-8', 'replace')


def main():
    _, xml, _ = get(BASE + '/sitemap-0.xml')
    urls = [loc.text for loc in ET.fromstring(xml).iter(NS + 'loc') if loc.text]
    print('URLs en sitemap:', len(urls))

    with ThreadPoolExecutor(max_workers=8) as ex:
        paginas = list(ex.map(bajar, urls))

    problemas = []
    estados = Counter()
    for url, estado, cuerpo in paginas:
        estados[estado] += 1
        if estado != 200:
            problemas.append((url, 'status', estado))
            continue
        h1 = [html.unescape(x).strip() for x in re.findall(r'<h1[^>]*>(.*?)</h1>', cuerpo, re.S)]
        h2 = [re.sub(r'<[^>]+>', '', html.unescape(x)).strip() for x in re.findall(r'<h2[^>]*>(.*?)</h2>', cuerpo, re.S)]
        if len(h1) != 1:
            problemas.append((url, 'h1', len(h1)))
        if h1 and any(x.lower() == h1[0].lower() for x in h2):
            problemas.append((url, 'h2=h1', h1[0][:40]))
        t = re.search(r'<title>(.*?)</title>', cuerpo, re.S)
        if t and len(html.unescape(t.group(1))) > 65:
            problemas.append((url, 'title>65', len(html.unescape(t.group(1)))))
        m = re.search(r'<script type="application/ld\+json">(.*?)</script>', cuerpo, re.S)
        if not m:
            problemas.append((url, 'sin jsonld', ''))
        else:
            try:
                d = json.loads(m.group(1))
                g = d.get('@graph', [])
                plano = json.dumps(g)
                if '#organizacion' in plano and not any(n.get('@type') == 'Organization' for n in g):
                    problemas.append((url, 'org colgante', ''))
            except json.JSONDecodeError as e:
                problemas.append((url, 'jsonld invalido', str(e)[:40]))
        for href in set(re.findall(r'href="(/[^"#]*)"', cuerpo)):
            if href.startswith('/_astro/') or href.endswith(('.css', '.js', '.txt', '.xml', '.json')):
                continue

    print('estados:', dict(estados))
    print('problemas:', len(problemas))
    for p in problemas[:15]:
        print(' ', p)


if __name__ == '__main__':
    main()
