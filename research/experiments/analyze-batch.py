import json, collections
stats = json.load(open('stats.json'))
sample = [json.loads(l) for l in open('sample.jsonl')]
band_of = {f'w{i}': w['band'] for i, w in enumerate(sample)}
reqs = {json.loads(l)['custom_id']: json.loads(l) for l in open('batch-input.jsonl')}
expected = json.load(open('batch-expected.json'))
P_in, P_cached, P_out = 0.05, 0.005, 0.25   # batch prices per 1M
tok = collections.defaultdict(lambda: collections.Counter())  # (kind, band) -> tokens
problems = collections.Counter(); usage_tot = collections.Counter()
for l in open('batch-output.jsonl'):
    r = json.loads(l); cid = r['custom_id']; body = r['response']['body']; u = body['usage']
    kind = cid.split('-')[0]
    usage_tot[(kind,'input')] += u['input_tokens']; usage_tot[(kind,'cached')] += u['input_tokens_details']['cached_tokens']; usage_tot[(kind,'output')] += u['output_tokens']
    text = next(c['text'] for o in body['output'] if o['type']=='message' for c in o['content'] if c['type']=='output_text')
    try:
        out = json.loads(text)
    except json.JSONDecodeError:
        problems[kind + ' malformed JSON'] += 1
        out, _ = json.JSONDecoder().raw_decode(text)
    ids = expected[cid]
    got = [x['id'] for x in out.get('items', [])] if kind != 'group' else [x['id'] for x in out['cores']] + [s for x in out['cores'] for s in x['subsenses']]
    if sorted(got) != sorted(ids): problems[kind] += 1
    # attribute this call to words by input share
    if kind == 'group':
        shares = {cid.split('-')[1]: 1.0}
    else:
        items = json.loads(reqs[cid]['body']['input'])['items']
        size = collections.Counter()
        for it in items: size[it['id'].split(':')[0]] += len(json.dumps(it))
        total = sum(size.values()); shares = {w: s/total for w, s in size.items()}
    for w, sh in shares.items():
        for k, v in (('input', u['input_tokens']), ('cached', u['input_tokens_details']['cached_tokens']), ('output', u['output_tokens'])):
            tok[(kind, band_of[w])][k] += v * sh
bands = ['5-9','4-5','3-4','2-3','1.5-2','1-1.5']
per_band_n = collections.Counter(w['band'] for w in sample)
def project(kinds):
    t = collections.Counter()
    for kind in kinds:
        for b in bands:
            for k in ('input','cached','output'):
                t[k] += tok[(kind,b)][k] * stats[f'words {b}'] / per_band_n[b]
    return t
def cost(t, cache=True):
    c = t['cached'] if cache else 0
    return ((t['input']-c)*P_in + c*P_cached + t['output']*P_out)/1e6
print('ID check failures:', dict(problems) or 'none')
for k in ['origin','originNoQuotes','senses','group']:
    i,c,o = usage_tot[(k,'input')], usage_tot[(k,'cached')], usage_tot[(k,'output')]
    print(f'{k:15} sample tokens: input {i:>8} cached {c:>8} ({c/max(i,1):.0%}) output {o:>7}')
for label, kinds in [('with quotes', ['origin','senses','group']), ('no quotes', ['originNoQuotes','senses','group'])]:
    t = project(kinds)
    print(f"{label}: input {t['input']/1e6:.0f}M (cached {t['cached']/1e6:.0f}M), output {t['output']/1e6:.1f}M -> ${cost(t):.1f} batch with measured caching, ${cost(t, False):.1f} if nothing cached")
