#!/usr/bin/env python3
"""Aviso IndexNow de las URLs del sitemap. Uso: python3 scripts/indexnow.py [--prod]"""
import json
import sys
import urllib.request
import xml.etree.ElementTree as ET

KEY = 'ba9fbe7bc808e6e4d9106d11decacb6c'
HOST = 'https://4sotas.com'
SITEMAP = 'dist/sitemap-0.xml'
NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'


def main() -> int:
    urls = [loc.text for loc in ET.parse(SITEMAP).iter(NS + 'loc') if loc.text]
    cuerpo = {
        'host': '4sotas.com',
        'key': KEY,
        'keyLocation': f'{HOST}/{KEY}.txt',
        'urlList': urls[:1000],
    }
    peticion = urllib.request.Request(
        'https://api.indexnow.org/indexnow',
        data=json.dumps(cuerpo).encode(),
        headers={'Content-Type': 'application/json; charset=utf-8'},
    )
    try:
        with urllib.request.urlopen(peticion, timeout=30) as r:
            print(f'indexnow: {r.status} · {len(urls)} URLs enviadas')
            return 0
    except Exception as e:  # noqa: BLE001 — se informa y no se rompe el despliegue
        print(f'indexnow: sin respuesta util ({e})')
        return 1


if __name__ == '__main__':
    sys.exit(main())
