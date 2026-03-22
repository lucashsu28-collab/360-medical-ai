import psycopg2
conn = psycopg2.connect(host='34.81.74.228',port=5432,dbname='medical_ai',user='postgres',password='Medical360@2026',connect_timeout=15)
cur = conn.cursor()
cur.execute('SELECT COUNT(*) FROM clinics WHERE google_place_id IS NULL')
null_count = cur.fetchone()[0]
cur.execute('SELECT COUNT(*) FROM clinics WHERE google_place_id IS NOT NULL')
has_count = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM clinics WHERE google_place_id IS NULL AND id LIKE 'MOHW_%'")
mohw_null = cur.fetchone()[0]
print(f'google_place_id IS NULL (total): {null_count}')
print(f'google_place_id has data:        {has_count}')
print(f'MOHW new clinics missing Google: {mohw_null}')
cur.close()
conn.close()
