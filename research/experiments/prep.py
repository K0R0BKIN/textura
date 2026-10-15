# Picks the words worth rewriting (Wiktionary headwords that wordfreq says are
# actually used), measures how much source text each has, and draws a sample
# stratified by frequency.
#   pdfenv/bin/python exp/prep.py kaikki-English.jsonl exp/
import json, random, re, sys, collections
from wordfreq import top_n_list, zipf_frequency

dump, out = sys.argv[1], sys.argv[2]
MIN_ZIPF = 1.0
BANDS = [(5, 9), (4, 5), (3, 4), (2, 3), (1.5, 2), (1, 1.5)]
PER_BAND = 35
MAX_EXAMPLES = 2

zipf = {w: zipf_frequency(w, 'en', wordlist='large') for w in top_n_list('en', 10**7, wordlist='large')}

def band(z):
    return next(f'{lo}-{hi}' for lo, hi in BANDS if lo <= z < hi)

def labels(sense):
    raw, gloss = (sense.get('raw_glosses') or [''])[-1], (sense.get('glosses') or [''])[-1]
    m = re.match(r'^\((.*?)\)\s', raw) if raw.endswith(gloss) else None
    return [l.strip() for l in m.group(1).split(',')] if m else []

def is_form(sense):
    return 'form_of' in sense or 'alt_of' in sense or bool({'form-of', 'alt-of'} & set(sense.get('tags', [])))

words = collections.defaultdict(lambda: {'etymologies': {}, 'lexemes': [], 'formSenses': 0})
for line in open(dump, encoding='utf8'):
    e = json.loads(line)
    w = e.get('word', '')
    if ' ' in w or zipf.get(w.lower(), 0) < MIN_ZIPF:
        continue
    entry = words[w]
    ety = (e.get('etymology_text') or '').strip()
    key = e.get('etymology_number', 0)
    if ety and key not in entry['etymologies']:
        entry['etymologies'][key] = {'text': ety, 'partsOfSpeech': []}
    if ety:
        entry['etymologies'][key]['partsOfSpeech'].append(e.get('pos'))
    senses = []
    for s in e.get('senses', []):
        if is_form(s):
            entry['formSenses'] += 1
            continue
        gloss = (s.get('glosses') or [''])[-1].strip()
        if not gloss:
            continue
        senses.append({'definition': gloss, 'labels': labels(s),
                       'examples': [x['text'] for x in s.get('examples', [])[:MAX_EXAMPLES] if x.get('text')]})
    if senses:
        entry['lexemes'].append({'pos': e.get('pos'), 'senses': senses})

stats = collections.Counter()
by_band = collections.defaultdict(list)
for w, entry in words.items():
    z = zipf[w.lower()]
    etys = [{'id': f'e{i + 1}', **v} for i, v in enumerate(entry['etymologies'].values())]
    lexemes = [{'pos': l['pos'], 'senses': [{'id': f'{li + 1}:{si + 1}', **s} for si, s in enumerate(l['senses'])]}
               for li, l in enumerate(entry['lexemes'])]
    chars = sum(len(x['text']) for x in etys) + sum(
        len(s['definition']) + sum(map(len, s['examples'])) for l in lexemes for s in l['senses'])
    b = band(z)
    stats[f'words {b}'] += 1
    stats[f'chars {b}'] += chars
    stats[f'senses {b}'] += sum(len(l['senses']) for l in lexemes)
    stats[f'formOnly {b}'] += not lexemes
    stats[f'noOrigin {b}'] += not etys
    by_band[b].append({'word': w, 'zipf': z, 'band': b, 'sourceChars': chars, 'etymologies': etys, 'lexemes': lexemes})

random.seed(1)
with open(f'{out}/sample.jsonl', 'w') as f:
    for b, entries in by_band.items():
        for entry in random.sample(entries, min(PER_BAND, len(entries))):
            f.write(json.dumps(entry) + '\n')
json.dump(dict(stats), open(f'{out}/stats.json', 'w'), indent=1)
for lo, hi in BANDS:
    b = f'{lo}-{hi}'
    print(b, {k: stats[f'{k} {b}'] for k in ['words', 'chars', 'senses', 'formOnly', 'noOrigin']})
print('total words', sum(v for k, v in stats.items() if k.startswith('words')))
