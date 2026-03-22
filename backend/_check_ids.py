# -*- coding: utf-8 -*-
import json, pathlib, psycopg2

conn = psycopg2.connect(host='34.81.74.228',port=5432,dbname='medical_ai',
                        user='postgres',password='Medical360@2026',connect_timeout=15)
cur = conn.cursor()
cur.execute("SELECT id, name FROM clinics WHERE id NOT LIKE 'MOHW_%' ORDER BY id LIMIT 10")
rows = cur.fetchall()
print("Sample non-MOHW clinic IDs in DB:")
for r in rows:
    print(f"  id={r[0]!r}  name={r[1]!r}")

cur.execute("SELECT COUNT(*) FROM clinics WHERE id NOT LIKE 'MOHW_%'")
print(f"\nNon-MOHW (original) clinics: {cur.fetchone()[0]}")
cur.execute("SELECT COUNT(*) FROM clinics WHERE id LIKE 'MOHW_%'")
print(f"MOHW clinics: {cur.fetchone()[0]}")
cur.close(); conn.close()

# Check JSON
p = pathlib.Path('data/clinics_real.json')
d = json.load(open(p, encoding='utf-8'))
print(f"\nclinics_real.json sample IDs: {[x['id'] for x in d[:5]]}")
