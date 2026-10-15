import json, collections
stats = json.load(open('stats.json'))
rows = [json.loads(l) for l in open('results.jsonl')]
sample = {json.loads(l)['word']: json.loads(l) for l in open('sample.jsonl')}
P = {'std': (0.10, 0.01, 0.50), 'batch': (0.05, 0.005, 0.25)}
bands = ['5-9','4-5','3-4','2-3','1.5-2','1-1.5']
tot = collections.Counter(); kinds = collections.Counter()
for b in bands:
    rs = [r for r in rows if r['band'] == b]; n = len(rs); W = stats[f'words {b}']
    for r in rs:
        for c in r['calls']:
            for k in ('input','cached','output'):
                tot[k] += c[k] * W / n
                kinds[(c['kind'], k)] += c[k] * W / n
            kinds[(c['kind'],'calls')] += W / n
def cost(t, tier, cache=True):
    i, ci, o = P[tier]
    uncached = t['input'] - (t['cached'] if cache else 0)
    return (uncached * i + (t['cached'] * ci if cache else 0) + t['output'] * o) / 1e6
print(f"projected tokens for 216K words: input {tot['input']/1e6:.0f}M (cached {tot['cached']/1e6:.0f}M), output {tot['output']/1e6:.0f}M")
for k in ['origin','senses','group']:
    print(f"  {k:7} calls {kinds[(k,'calls')]/1e3:.0f}K  input {kinds[(k,'input')]/1e6:.0f}M  output {kinds[(k,'output')]/1e6:.1f}M")
for tier in P: print(f"cost {tier}: ${cost(tot,tier,False):.0f} without cache, ${cost(tot,tier):.0f} with what got cached")
# checks: ids
bad = collections.Counter()
for r in rows:
    s = sample[r['word']]
    lex = {l['pos']: l for l in s['lexemes']}
    for c in r['calls']:
        out = json.loads(c['text'])
        if c['kind']=='senses' and any(not i['definition'].strip() for i in out['items']): bad['empty def']+=1
        if c['kind']=='group':
            ids=[x['id'] for x in out['cores']]+[y for x in out['cores'] for y in x['subsenses']]
            if len(ids)!=len(set(ids)): bad['group dup']+=1
    want = sum(len(l['senses']) for l in s['lexemes'])
    got = sum(len(json.loads(c['text'])['items']) for c in r['calls'] if c['kind']=='senses')
    if want!=got: bad['senses count mismatch']+=1
print('checks:', dict(bad) or 'all ids returned')
lat = sorted(c['ms'] for r in rows for c in r['calls']); print('call ms p50', lat[len(lat)//2], 'p95', lat[int(len(lat)*.95)])
