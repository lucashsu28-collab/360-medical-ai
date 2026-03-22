# -*- coding: utf-8 -*-
import sys, codecs, psycopg2
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

DB = dict(host='34.81.74.228',port=5432,dbname='medical_ai',
          user='postgres',password='Medical360@2026',connect_timeout=15)

conn = psycopg2.connect(**DB)
cur = conn.cursor()

# 以截圖資料為準（衛福部官網即時資料，地址比 ODS 更新）
cur.execute("""
    INSERT INTO clinics
        (id, name, address, phone, specialty, is_partner,
         legal_score, judicial_score, score,
         google_rating, google_review_count, google_place_id,
         created_at, updated_at)
    VALUES
        ('MOHW_350102C192',
         '名媛芭比.時尚醫美診所',
         '臺北市人安區信義路4段380號',
         '02-77137886',
         '西醫一般科',
         false,
         10.0, 10.0, 20.0,
         null, null, null,
         NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        name      = EXCLUDED.name,
        address   = EXCLUDED.address,
        phone     = EXCLUDED.phone,
        updated_at = NOW()
""")
conn.commit()
print(f"插入/更新: {cur.rowcount} 筆")

cur.execute("SELECT id, name, address, phone FROM clinics WHERE id = 'MOHW_350102C192'")
row = cur.fetchone()
print(f"確認: id={row[0]}, name={row[1]}, addr={row[2]}, phone={row[3]}")
cur.execute("SELECT COUNT(*) FROM clinics")
print(f"DB 總筆數: {cur.fetchone()[0]}")
cur.close(); conn.close()
