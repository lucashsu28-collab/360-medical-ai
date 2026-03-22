# -*- coding: utf-8 -*-
import sys, codecs, psycopg2, re, requests
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

DB = dict(host='34.81.74.228', port=5432, dbname='medical_ai',
          user='postgres', password='Medical360@2026', connect_timeout=15)
conn = psycopg2.connect(**DB)
cur = conn.cursor()

# 1. Confirm data exists
print("=== 1. DB 直接查詢 ===")
cur.execute("SELECT id, name FROM clinics WHERE name LIKE %s", ('%芭比%',))
rows = cur.fetchall()
print(f"'%芭比%' results: {len(rows)}")
for r in rows:
    print(f"  id={r[0]!r}, name={r[1]!r}")

# 2. Simulate the exact Python clean logic
print("\n=== 2. Python clean_kw 模擬 ===")
def clean_search(s):
    return re.sub(r'[.\s·・\u00b7\u30fb\-_]', '', s)

search_terms = ['名媛芭比時尚醫美診所', '名媛芭比', '芭比']
for term in search_terms:
    clean = clean_search(term)
    print(f"  search={term!r} -> clean_kw={clean!r}")

# 3. Test the exact SQL that main.py would generate
print("\n=== 3. 模擬 main.py 實際 SQL ===")
for term in search_terms:
    clean_kw = clean_search(term)
    print(f"\n  search_term={term!r}, clean_kw={clean_kw!r}")

    # The raw SQL text clause used in main.py
    cur.execute("""
        SELECT id, name FROM clinics WHERE
        regexp_replace(name, '[.\\s·・\\-_]', '', 'g') ILIKE %s
        OR name ILIKE %s
        LIMIT 5
    """, (f'%{clean_kw}%', f'%{term}%'))
    rows = cur.fetchall()
    print(f"  Results: {len(rows)}")
    for r in rows:
        print(f"    {r[1]!r}")

cur.close()
conn.close()

# 4. Test live API
print("\n=== 4. Live API 測試 ===")
BASE = "https://medical-backend-492121133498.asia-east1.run.app"
for term in ['名媛芭比', '名媛芭比時尚醫美診所']:
    try:
        r = requests.get(f"{BASE}/api/clinics",
                        params={"search": term, "limit": 5},
                        timeout=15)
        data = r.json()
        total = data.get('total', '?')
        clinics = data.get('clinics', [])
        print(f"  search={term!r}: total={total}, returned={len(clinics)}")
        for c in clinics[:3]:
            print(f"    -> {c.get('name')!r}")
    except Exception as e:
        print(f"  search={term!r}: ERROR {e}")

# 5. Check the API param name (q vs search)
print("\n=== 5. API 參數名稱確認（q vs search）===")
try:
    r = requests.get(f"{BASE}/api/clinics",
                    params={"q": "名媛芭比", "limit": 5}, timeout=15)
    data = r.json()
    print(f"  param 'q': total={data.get('total')}")
    r2 = requests.get(f"{BASE}/api/clinics",
                     params={"search": "名媛芭比", "limit": 5}, timeout=15)
    data2 = r2.json()
    print(f"  param 'search': total={data2.get('total')}")
    # Show first result for 'search'
    for c in data2.get('clinics', [])[:3]:
        print(f"    -> {c.get('name')!r}")
except Exception as e:
    print(f"  ERROR: {e}")
