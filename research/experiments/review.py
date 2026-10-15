import json, re
words = 'line keep low finger career breathe pill cant clique narcissism peremptory gammon beamish confidante freesia asbestosis incertitude cerclage'.split()
sample = [json.loads(l) for l in open('sample.jsonl')]
idx = {w['word']: i for i, w in enumerate(sample)}
v1 = {json.loads(l)['word']: json.loads(l) for l in open('results.jsonl')}
batch = {}
for l in open('batch-output.jsonl'):
    r = json.loads(l); body = r['response']['body']
    text = next(c['text'] for o in body['output'] if o['type']=='message' for c in o['content'] if c['type']=='output_text')
    try: out = json.loads(text)
    except Exception: out, _ = json.JSONDecoder().raw_decode(text)
    batch[r['custom_id']] = out
b_items = {}; b_groups = {}
for cid, out in batch.items():
    if cid.startswith('group'): b_groups[cid] = out
    else:
        for it in out['items']: b_items[(cid.split('-')[0], it['id'])] = it
oxford = open('oxford.txt').read().split('=== ')
ox = {chunk.split('\n')[0].strip(): chunk for chunk in oxford if chunk.strip()}
f = open('review.md', 'w')
for w in words:
    s = sample[idx[w]]; i = idx[w]
    f.write(f'\n\n######## {w}  (band {s["band"]})\n')
    for e in s['etymologies']:
        f.write(f'\n[SOURCE ORIGIN {e["id"]}] {e["text"]}\n')
        bo = b_items.get(('origin', f'w{i}:{e["id"]}'))
        f.write('[LUNA ORIGIN batch] ' + (' '.join(x['text'] for x in bo['sentences']) if bo else '-') + '\n')
        bn = b_items.get(('originNoQuotes', f'w{i}:{e["id"]}'))
        f.write('[LUNA ORIGIN no-quotes] ' + (' '.join(x['text'] for x in bn['sentences']) if bn else '-') + '\n')
    v1calls = v1[w]['calls']
    v1senses = {it['id']: it['definition'] for c in v1calls if c['kind']=='senses' for it in json.loads(c['text'])['items']}
    for li, l in enumerate(s['lexemes']):
        f.write(f'\n--- {l["pos"]}\n')
        g = b_groups.get(f'group-w{i}-{li}')
        if g: f.write('[LUNA GROUPING batch] ' + ' | '.join(f"{c['id']}<{','.join(c['subsenses'])}>" for c in g['cores']) + '\n')
        for sn in l['senses']:
            f.write(f'{sn["id"]} SRC: {"("+", ".join(sn["labels"])+") " if sn["labels"] else ""}{sn["definition"]}\n')
            f.write(f'   v1: {v1senses.get(sn["id"], "-")}\n')
            bb = b_items.get(('senses', f'w{i}:{sn["id"]}'))
            f.write(f'   batch: {bb["definition"] if bb else "-"}\n')
    f.write('\n[OXFORD]\n' + ox.get(w, '-')[:6000] + '\n')
