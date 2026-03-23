# -*- coding: utf-8 -*-
import sys, codecs, psycopg2
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

conn = psycopg2.connect(host='34.81.74.228', dbname='medical_ai',
                        user='postgres', password='Medical360@2026')
cur = conn.cursor()

cur.execute("SELECT COUNT(*) FROM clinic_reviews")
total_rows = cur.fetchone()[0]

cur.execute("SELECT COUNT(DISTINCT clinic_id) FROM clinic_reviews")
distinct_clinics = cur.fetchone()[0]

cur.execute("SELECT COUNT(*) FROM clinics WHERE google_place_id IS NOT NULL AND google_place_id != ''")
total_clinics = cur.fetchone()[0]

cur.execute("""
    SELECT clinic_id, COUNT(*) as cnt
    FROM clinic_reviews
    GROUP BY clinic_id
    ORDER BY cnt DESC LIMIT 5
""")
top = cur.fetchall()

cur.execute("""
    SELECT cr.clinic_id, c.name, cr.author_name, cr.rating, LEFT(cr.text,60)
    FROM clinic_reviews cr
    JOIN clinics c ON c.id = cr.clinic_id
    ORDER BY cr.id DESC LIMIT 5
""")
recent = cur.fetchall()

cur.close()
conn.close()

print(f"clinic_reviews 狀態")
print(f"  總評論數:   {total_rows:,}")
print(f"  已完成診所: {distinct_clinics:,} / {total_clinics:,}")
print(f"  完成率:     {distinct_clinics/total_clinics*100:.1f}%")
print(f"\nTop 5 評論多的診所:")
for r in top:
    print(f"  {r[0]}: {r[1]} 則")
print(f"\n最新5筆評論:")
for r in recent:
    print(f"  [{r[0]}] {r[1]} | {r[2]} ★{r[3]} {str(r[4] or '')[:40]}")
