import psycopg2
conn = psycopg2.connect(host='34.81.74.228',port=5432,dbname='medical_ai',user='postgres',password='Medical360@2026',connect_timeout=15)
cur = conn.cursor()
cur.execute("SELECT id, name, address FROM clinics WHERE name LIKE %s", ('%名媛芭比%',))
rows = cur.fetchall()
print(f"Results for '名媛芭比': {len(rows)} rows")
for r in rows:
    print(f"  id={r[0]}, name={r[1]}, address={r[2]}")
cur.close()
conn.close()
