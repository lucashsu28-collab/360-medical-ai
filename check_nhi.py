# -*- coding: utf-8 -*-
import json
with open('backend/data/nhi_all.json', encoding='utf-8') as f:
    data = json.load(f)

keywords = ['醫美', '美學', '皮膚科', '整形', '整型', '美容', '雷射', '醫學美容']
results = []
for r in data:
    name = r.get('HOSP_NAME', '')
    func = r.get('FUNCTYPE_CNAME', '')
    for kw in keywords:
        if kw in name or kw in func:
            results.append(r)
            break

lines = [f'找到 {len(results)} 家']
for r in results[:20]:
    lines.append(f"{r.get('HOSP_NAME')} | {r.get('ADDRESS')} | {r.get('FUNCTYPE_CNAME')}")
with open('nhi_check_out.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(lines))
print('\n'.join(lines))
