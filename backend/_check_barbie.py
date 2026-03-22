# -*- coding: utf-8 -*-
import sys, codecs, io, requests, psycopg2, pandas as pd
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

DB = dict(host='34.81.74.228',port=5432,dbname='medical_ai',
          user='postgres',password='Medical360@2026',connect_timeout=15)

# 1. Check DB
conn = psycopg2.connect(**DB)
cur = conn.cursor()
cur.execute("SELECT id, name, specialty, address FROM clinics WHERE id = %s OR name LIKE %s",
            ('MOHW_350102C192', '%名媛%'))
rows = cur.fetchall()
print(f"=== DB 查詢結果 ===")
print(f"筆數: {len(rows)}")
for r in rows:
    print(f"  id={r[0]}, name={r[1]}, specialty={r[2]}, addr={r[3]}")
cur.close(); conn.close()

# 2. Check ODS raw data for this clinic
print("\n=== ODS 原始資料查詢 ===")
import urllib3; urllib3.disable_warnings()
r = requests.get('https://www.mohw.gov.tw/dl-96581-66dbb751-f83a-416a-a998-893222e20fef.html',
                 headers={"User-Agent":"Mozilla/5.0"}, timeout=90, verify=False)
buf = io.BytesIO(r.content)
all_sheets = pd.read_excel(buf, engine='odf', sheet_name=None, dtype=str)
df = pd.concat(all_sheets.values(), ignore_index=True)

# Find by code
target_code = '350102C192'
row = df[df['機構代碼'] == target_code]
print(f"機構代碼 {target_code} 在 ODS 中:")
if len(row) > 0:
    for col in ['機構代碼','機構名稱','科別','縣市區名','地址']:
        print(f"  {col}: {row.iloc[0][col]}")
else:
    print("  -> 未找到！")
    # Try fuzzy
    fuzzy = df[df['機構名稱'].fillna('').str.contains('名媛', regex=False)]
    print(f"\n名稱含「名媛」: {len(fuzzy)} 筆")
    for _, frow in fuzzy.iterrows():
        print(f"  代碼={frow['機構代碼']}, 名稱={frow['機構名稱']}, 科別={frow['科別']}")
