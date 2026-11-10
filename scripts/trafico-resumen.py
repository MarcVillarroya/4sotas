#!/usr/bin/env python3
"""Resumen de tráfico de la zona 4sotas.com desde Cloudflare GraphQL (solo lectura)."""
import datetime
import json
import os
import re
import urllib.request
from collections import Counter

TOKEN = os.environ['CLOUDFLARE_API_TOKEN']
ZONE = 'd3765747215191e9edc888e392621414'


def gql(query, variables):
    req = urllib.request.Request(
        'https://api.cloudflare.com/client/v4/graphql',
        data=json.dumps({'query': query, 'variables': variables}).encode(),
        headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.load(r)


def serie(dias):
    fin = datetime.date.today()
    ini = fin - datetime.timedelta(days=dias)
    q = '''query($z:String!,$s:Date!,$e:Date!){
      viewer{zones(filter:{zoneTag:$z}){
        httpRequests1dGroups(limit:400,filter:{date_geq:$s,date_leq:$e},orderBy:[date_ASC]){
          sum{requests pageViews bytes threats}
          uniq{uniques}
          dimensions{date}
        }}}}'''
    r = gql(q, {'z': ZONE, 's': str(ini), 'e': str(fin)})
    return r['data']['viewer']['zones'][0]['httpRequests1dGroups']


def rutas(dias, estado=None):
    fin = datetime.datetime.now(datetime.UTC)
    ini = fin - datetime.timedelta(days=dias)
    filtro = f',edgeResponseStatus:{estado}' if estado else ''
    q = '''query($z:String!,$s:Time!,$e:Time!,$l:Int!){
      viewer{zones(filter:{zoneTag:$z}){
        httpRequestsAdaptiveGroups(limit:$l,filter:{datetime_geq:$s,datetime_leq:$e%s},orderBy:[count_DESC]){
          count dimensions{clientRequestPath userAgent}
        }}}}''' % filtro
    r = gql(q, {'z': ZONE, 's': ini.strftime('%Y-%m-%dT%H:%M:%SZ'), 'e': fin.strftime('%Y-%m-%dT%H:%M:%SZ'), 'l': 400})
    return r['data']['viewer']['zones'][0]['httpRequestsAdaptiveGroups']


def main():
    d30 = serie(30)
    total = {k: sum(x['sum'][k] for x in d30) for k in ('requests', 'pageViews', 'bytes', 'threats')}
    unicos = sum(x['uniq']['uniques'] for x in d30)
    print('30 días:', total, 'uniques(sum diario)', unicos)
    print('últimos 7 días:', {k: sum(x['sum'][k] for x in d30[-7:]) for k in ('requests', 'pageViews', 'bytes')})

    ia = re.compile(r'GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-User|Claude-SearchBot|PerplexityBot|Perplexity-User|Google-Extended|CCBot|Bytespider|Applebot', re.I)
    bot = re.compile(r'bot|crawl|spider|slurp|curl|python|wget|scan|headless|monitor|preview|facebookexternalhit|whatsapp|telegram|^http', re.I)
    filas = rutas(7)
    html = re.compile(r'^/[^.]*$')
    c = Counter()
    ia_hits = Counter()
    top = Counter()
    for x in filas:
        ua = x['dimensions']['userAgent'] or ''
        p = x['dimensions']['clientRequestPath'] or ''
        n = x['count']
        m = ia.search(ua)
        if m:
            ia_hits[m.group(0)] += n
        if html.match(p):
            if bot.search(ua):
                c['bot'] += n
            else:
                c['humano_aprox'] += n
                top[p] += n
    print('7 días, peticiones HTML:', dict(c))
    print('bots de IA vistos:', dict(ia_hits))
    print('top páginas HTML no-bot:')
    for p, n in top.most_common(12):
        print(' ', n, p)

    for estado in (404, 504):
        rr = rutas(7, estado)
        print(f'{estado}:', sum(x['count'] for x in rr), 'peticiones;', len(rr), 'rutas distintas')


if __name__ == '__main__':
    main()
