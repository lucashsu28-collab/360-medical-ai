# -*- coding: utf-8 -*-
import sys, codecs, psycopg2
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

conn = psycopg2.connect(host='34.81.74.228',port=5432,dbname='medical_ai',
                        user='postgres',password='Medical360@2026',connect_timeout=15)
cur = conn.cursor()

# 查名媛芭比
cur.execute("SELECT id, name, address FROM clinics WHERE name LIKE %s", ('%名媛芭比%',))
rows = cur.fetchall()
print(f"=== 查詢：名媛芭比 ===")
print(f"結果筆數: {len(rows)}")
for r in rows:
    print(f"  id={r[0]}, name={r[1]}, address={r[2]}")

if len(rows) == 0:
    print("  -> 未在 DB 中找到")
    # 嘗試模糊搜尋看是否有相近名稱
    cur.execute("SELECT id, name, address FROM clinics WHERE name LIKE %s LIMIT 5", ('%芭比%',))
    rows2 = cur.fetchall()
    print(f"\n模糊搜尋「芭比」: {len(rows2)} 筆")
    for r in rows2:
        print(f"  id={r[0]}, name={r[1]}, address={r[2]}")

    cur.execute("SELECT id, name, address FROM clinics WHERE name LIKE %s LIMIT 5", ('%名媛%',))
    rows3 = cur.fetchall()
    print(f"\n模糊搜尋「名媛」: {len(rows3)} 筆")
    for r in rows3:
        print(f"  id={r[0]}, name={r[1]}, address={r[2]}")

cur.close()
conn.close()
