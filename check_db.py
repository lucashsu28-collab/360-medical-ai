import psycopg2
conn=psycopg2.connect(host='34.81.74.228',dbname='medical_ai',user='postgres',password='Medical360@2026')
cur=conn.cursor()
cur.execute('DELETE FROM clinic_reviews WHERE id NOT IN (SELECT MIN(id) FROM clinic_reviews GROUP BY clinic_id, author_name, text)')
print('deleted:', cur.rowcount)
conn.commit()
