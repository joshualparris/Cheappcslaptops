#!/usr/bin/env python3
"""Search public web results for potentially profitable easy-fix computer listings."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "config" / "deal-hunter.json"
OUT = ROOT / "deal-hunter"
LATEST = OUT / "latest.json"
SEEN = OUT / "seen.json"
ALERTS = OUT / "new-alerts.md"

PRICE_RE = re.compile(r"(?:AU\s*\$|A\$|\$)\s*([0-9]{1,4}(?:\.[0-9]{1,2})?)", re.I)
BUSINESS = ('thinkpad', 'latitude', 'elitebook', 'probook', 'thinkcentre', 'optiplex', 'elitedesk', 'prodesk')

CPU_PATTERNS = [
    (13, re.compile(r'i[3579]-13\d{3,4}[A-Z]*', re.I)),
    (12, re.compile(r'i[3579]-12\d{3,4}[A-Z]*', re.I)),
    (11, re.compile(r'i[3579]-11\d{3,4}[A-Z]*', re.I)),
    (10, re.compile(r'i[3579]-10\d{3,4}[A-Z]*', re.I)),
    (9, re.compile(r'i[3579]-9\d{3,4}[A-Z]*', re.I)),
    (8, re.compile(r'i[3579]-8\d{3,4}[A-Z]*', re.I)),
]

def load(path: Path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding='utf-8'))

def save(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

def brave_search(query: str, key: str):
    params = urllib.parse.urlencode({
        'q': query, 'count': 20, 'country': 'AU', 'search_lang': 'en',
        'freshness': 'pw', 'safesearch': 'moderate'
    })
    req = urllib.request.Request(
        'https://api.search.brave.com/res/v1/web/search?' + params,
        headers={'Accept': 'application/json', 'X-Subscription-Token': key, 'User-Agent': 'CHEAP-PC-Deal-Hunter/1.0'}
    )
    with urllib.request.urlopen(req, timeout=25) as response:
        return json.load(response).get('web', {}).get('results', [])

def parse_price(text: str):
    prices = []
    for match in PRICE_RE.finditer(text):
        try:
            value = float(match.group(1))
        except ValueError:
            continue
        if 5 <= value <= 5000:
            prices.append(value)
    return min(prices) if prices else None

def cpu_generation(text: str):
    for gen, pattern in CPU_PATTERNS:
        if pattern.search(text):
            return gen
    low = text.lower()
    for gen in range(13, 7, -1):
        if f'{gen}th gen' in low:
            return gen
    return None

def fix_cost(text: str):
    low = text.lower()
    total = 0
    checks = [
        (('no ssd', 'missing ssd', 'no hard drive', 'no hdd'), 30),
        (('no ram', 'missing ram'), 25),
        (('no charger', 'missing charger'), 20),
        (('worn battery', 'battery dead'), 55),
        (('no wifi card', 'faulty wifi'), 20),
        (('keyboard issue',), 45),
        (('missing key',), 15),
        (('screen broken', 'cracked screen'), 120),
    ]
    for terms, cost in checks:
        if any(term in low for term in terms):
            total += cost
    return total

def resale_estimate(text: str, gen):
    if gen is None:
        return None
    base = {8: 200, 9: 230, 10: 280, 11: 330, 12: 420, 13: 500}.get(gen)
    if base is None:
        return None
    low = text.lower()
    if any(name in low for name in BUSINESS):
        base += 20
    if '16gb' in low or '16 gb' in low:
        base += 25
    if '512gb' in low or '512 gb' in low:
        base += 25
    return base

def score(result, cfg):
    title = result.get('title') or ''
    description = result.get('description') or ''
    url = result.get('url') or ''
    text = f'{title} {description}'
    low = text.lower()
    points = 0
    reasons = []

    for term, weight in cfg['positiveSignals'].items():
        if term in low:
            points += weight
            reasons.append(f'{weight:+d} {term}')
    for term, weight in cfg['negativeSignals'].items():
        if term in low:
            points += weight
            reasons.append(f'{weight:+d} {term}')

    if any(name in low for name in BUSINESS):
        points += 15
        reasons.append('+15 business-class line')

    gen = cpu_generation(text)
    if gen is not None:
        bonus = 40 if gen >= 11 else 30 if gen >= 10 else 22 if gen >= 8 else 0
        points += bonus
        if bonus:
            reasons.append(f'+{bonus} Intel {gen}th-gen')

    price = parse_price(text)
    if price is not None:
        if price <= 50:
            points += 30; reasons.append('+30 price <= $50')
        elif price <= 80:
            points += 25; reasons.append('+25 price <= $80')
        elif price <= 120:
            points += 15; reasons.append('+15 price <= $120')
        elif price > cfg['maxPurchaseAud']:
            points -= 30; reasons.append('-30 above max purchase target')

    parts = fix_cost(text)
    resale = resale_estimate(text, gen)
    gross = None
    if price is not None and resale is not None:
        gross = round(resale - price - parts, 2)
        if gross >= 150:
            points += 30; reasons.append('+30 estimated gross >= $150')
        elif gross >= 100:
            points += 20; reasons.append('+20 estimated gross >= $100')
        elif gross >= 80:
            points += 12; reasons.append('+12 estimated gross >= $80')
        elif gross < 40:
            points -= 25; reasons.append('-25 estimated gross < $40')

    verdict = 'REVIEW'
    if points < 30:
        verdict = 'PASS'
    elif points >= cfg['minimumScore'] and (gross is None or gross >= cfg['minimumEstimatedGrossAud']):
        verdict = 'STRONG LEAD'

    return {
        'id': hashlib.sha256(url.encode('utf-8')).hexdigest()[:16],
        'title': title, 'url': url, 'description': description,
        'score': points, 'verdict': verdict, 'priceAudParsed': price,
        'intelGeneration': gen, 'estimatedFixPartsAud': parts,
        'estimatedResaleAud': resale, 'estimatedGrossAud': gross,
        'reasons': reasons
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--allow-no-key', action='store_true')
    args = parser.parse_args()
    cfg = load(CONFIG, None)
    if not cfg:
        print('Missing config/deal-hunter.json', file=sys.stderr)
        return 2

    key = os.getenv('BRAVE_SEARCH_API_KEY', '').strip()
    OUT.mkdir(parents=True, exist_ok=True)
    ALERTS.write_text('', encoding='utf-8')
    if not key:
        print('BRAVE_SEARCH_API_KEY is not configured; search skipped safely.')
        return 0 if args.allow_no_key else 3

    raw = []
    for query in cfg['queries']:
        try:
            raw.extend(brave_search(query, key))
        except Exception as exc:
            print(f'Search failed for {query!r}: {exc}', file=sys.stderr)

    unique = {}
    for result in raw:
        url = result.get('url') or ''
        if url:
            unique[url] = result

    ranked = [score(item, cfg) for item in unique.values()]
    ranked.sort(key=lambda x: (x['score'], x['estimatedGrossAud'] or -999), reverse=True)
    now = datetime.now(timezone.utc).isoformat()
    save(LATEST, {'generatedAt': now, 'destination': cfg['destination'], 'candidates': ranked})

    seen = set(load(SEEN, []))
    new_strong = [x for x in ranked if x['verdict'] == 'STRONG LEAD' and x['id'] not in seen]
    for item in new_strong:
        seen.add(item['id'])
    save(SEEN, sorted(seen))

    if new_strong:
        lines = [
            '# New repair-flip leads', '',
            f'Generated {now}', '',
            'Automated screening only. Verify the live listing, exact model, shipping to Dubbo, lock status and fault before buying.', ''
        ]
        for item in new_strong[:10]:
            lines.extend([
                f"## {item['title']}",
                f"- Score: **{item['score']}**",
                f"- Parsed price: {item['priceAudParsed']}",
                f"- Estimated parts: AUD {item['estimatedFixPartsAud']}",
                f"- Estimated resale: {item['estimatedResaleAud']}",
                f"- Estimated gross: {item['estimatedGrossAud']}",
                f"- Why: {', '.join(item['reasons'])}",
                f"- URL: {item['url']}",
                ''
            ])
        ALERTS.write_text('\n'.join(lines), encoding='utf-8')

    print(f'Scored {len(ranked)} candidates; {len(new_strong)} new strong leads')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
