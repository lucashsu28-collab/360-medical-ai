# -*- coding: utf-8 -*-
import sys, codecs, psycopg2
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

DB = dict(host='34.81.74.228', port=5432, dbname='medical_ai',
          user='postgres', password='Medical360@2026', connect_timeout=15)
conn = psycopg2.connect(**DB)
cur = conn.cursor()

print("=== Test 1: regexp_replace + ILIKE (全名) ===")
cur.execute("""
    SELECT name, regexp_replace(name, '[.\\s·・\\-_]', '', 'g') as cleaned
    FROM clinics
    WHERE regexp_replace(name, '[.\\s·・\\-_]', '', 'g')
    ILIKE %s
""", ('%名媛芭比時尚醫美診所%',))
rows = cur.fetchall()
print(f"Results: {len(rows)}")
for r in rows:
    print(f"  name={r[0]!r}, cleaned={r[1]!r}")

print("\n=== Test 2: 只搜名媛芭比 ===")
cur.execute("""
    SELECT name FROM clinics WHERE name ILIKE %s
""", ('%名媛芭比%',))
rows = cur.fetchall()
print(f"Results: {len(rows)}")
for r in rows:
    print(f"  {r[0]!r}")

print("\n=== Test 3: 確認 DB 內實際名稱與 cleaned 值 ===")
cur.execute("""
    SELECT name, regexp_replace(name, '[.\\s·・\\-_]', '', 'g') as cleaned
    FROM clinics WHERE name LIKE '%名媛%'
""")
rows = cur.fetchall()
for r in rows:
    print(f"  DB name : {r[0]!r}")
    print(f"  Cleaned : {r[1]!r}")
    print(f"  Target  : '名媛芭比時尚醫美診所'")
    print(f"  Contains: {'名媛芭比時尚醫美診所' in (r[1] or '')}")

print("\n=== Test 4: Python 端 clean 結果 ===")
import re
def clean(s): return re.sub(r'[.\s\u00b7\u30fb\-_·・]', '', s)
search = '名媛芭比時尚醫美診所'
print(f"  clean(search) = {clean(search)!r}")

print("\n=== Test 5: 精確 ILIKE 含 cleaned search ===")
clean_kw = clean(search)
cur.execute("""
    SELECT name FROM clinics
    WHERE regexp_replace(name, '[.\\s·・\\-_]', '', 'g') ILIKE %s
""", (f'%{clean_kw}%',))
rows = cur.fetchall()
print(f"  Results with clean_kw={clean_kw!r}: {len(rows)}")
for r in rows:
    print(f"  -> {r[0]!r}")

cur.close()
conn.close()
