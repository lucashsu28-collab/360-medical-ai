# -*- coding: utf-8 -*-
import sys, codecs, psycopg2
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

DB = dict(host='34.81.74.228',port=5432,dbname='medical_ai',
          user='postgres',password='Medical360@2026',connect_timeout=15)

conn = psycopg2.connect(**DB)
cur = conn.cursor()

cur.execute("""
    SELECT specialty, COUNT(*) as count
    FROM clinics
    GROUP BY specialty
    ORDER BY count DESC
""")
rows = cur.fetchall()

print("=== 科別分布 ===")
print(f"{'科別':<30} {'筆數':>6}")
print("-" * 40)
total = 0
for r in rows:
    spec = str(r[0]) if r[0] else '(NULL)'
    cnt = r[1]
    total += cnt
    print(f"{spec:<30} {cnt:>6}")
print("-" * 40)
print(f"{'合計':<30} {total:>6}")

cur.close(); conn.close()
