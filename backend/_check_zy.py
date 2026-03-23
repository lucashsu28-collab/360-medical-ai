# -*- coding: utf-8 -*-
import sys, codecs, psycopg2
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

conn = psycopg2.connect(host='34.81.74.228', port=5432, dbname='medical_ai',
                        user='postgres', password='Medical360@2026')
cur = conn.cursor()
cur.execute("SELECT id, name, address FROM clinics WHERE name LIKE '%真原美%'")
rows = cur.fetchall()
print(f"共 {len(rows)} 筆:")
for r in rows:
    print(f"  id={r[0]}")
    print(f"  name={r[1]}")
    print(f"  addr={r[2]}")
cur.close()
conn.close()
