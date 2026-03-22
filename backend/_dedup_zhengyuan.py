# -*- coding: utf-8 -*-
import sys, codecs, psycopg2
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

DB = dict(host='34.81.74.228', port=5432, dbname='medical_ai',
          user='postgres', password='Medical360@2026', connect_timeout=15)

conn = psycopg2.connect(**DB)
cur = conn.cursor()

cur.execute("""
    SELECT id, name, address, specialty, created_at
    FROM clinics
    WHERE name LIKE '%真原美%'
    ORDER BY created_at
""")
rows = cur.fetchall()
print(f"找到 {len(rows)} 筆「真原美」:")
for r in rows:
    print(f"  id={r[0]}  name={r[1]}  specialty={r[3]}  created_at={r[4]}")
    print(f"    addr={r[2]}")

if len(rows) >= 2:
    older_id = rows[0][0]
    newer_id = rows[-1][0]
    print(f"\n較舊: {older_id}  → 刪除")
    print(f"保留: {newer_id}")
    cur.execute("DELETE FROM clinics WHERE id = %s", (older_id,))
    conn.commit()
    print(f"已刪除 id={older_id}，rowcount={cur.rowcount}")
elif len(rows) == 1:
    print("\n只有1筆，無重複，不需刪除。")
else:
    print("\n查無資料。")

cur.close()
conn.close()
