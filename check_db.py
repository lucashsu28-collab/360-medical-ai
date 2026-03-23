import psycopg2
conn=psycopg2.connect(host='34.81.74.228',dbname='medical_ai',user='postgres',password='Medical360@2026')
cur=conn.cursor()
cur.execute("SELECT COUNT(*) FROM clinics WHERE google_place_id IS NOT NULL AND google_place_id != ''"
)
print('with_place_id:', cur.fetchone()[0])
cur.execute("SELECT COUNT(*) FROM clinics")
print('total:', cur.fetchone()[0])
