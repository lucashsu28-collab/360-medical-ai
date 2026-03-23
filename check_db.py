import psycopg2
conn=psycopg2.connect(host='34.81.74.228',dbname='medical_ai',user='postgres',password='Medical360@2026')
cur=conn.cursor()
cur.execute("SELECT id, author_name, time FROM clinic_reviews WHERE clinic_id='MOHW_350102C192' ORDER BY time DESC")
for r in cur.fetchall(): print(r)
