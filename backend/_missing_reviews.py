# -*- coding: utf-8 -*-
import sys, codecs, psycopg2
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

conn = psycopg2.connect(host='34.81.74.228', dbname='medical_ai',
                        user='postgres', password='Medical360@2026')
cur = conn.cursor()

cur.execute("""
    SELECT c.id, c.name, c.google_rating, c.google_review_count
    FROM clinics c
    WHERE c.google_place_id IS NOT NULL
      AND c.google_place_id != ''
      AND c.id NOT IN (SELECT DISTINCT clinic_id FROM clinic_reviews)
    ORDER BY c.id
""")
rows = cur.fetchall()
print(f"未收錄評論的診所: {len(rows)} 筆")
for r in rows:
    print(f"  id={r[0]}  name={r[1]}  rating={r[2]}  reviews={r[3]}")

cur.execute("SELECT COUNT(*) FROM clinic_reviews"); total = cur.fetchone()[0]
cur.execute("SELECT COUNT(DISTINCT clinic_id) FROM clinic_reviews"); done = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM clinics WHERE google_place_id IS NOT NULL AND google_place_id != ''"); all_c = cur.fetchone()[0]
print(f"\n總評論數:   {total:,}")
print(f"覆蓋診所:   {done} / {all_c}  ({done/all_c*100:.1f}%)")
cur.close(); conn.close()
