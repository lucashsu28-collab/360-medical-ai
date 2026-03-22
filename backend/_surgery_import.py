# -*- coding: utf-8 -*-
"""
1. Check DB for 真原美診所
2. Check ODS for 真原美診所
3. Count 外科 specialties in DB
4. Import 外科/一般外科 with aesthetic keywords from ODS
5. Manually insert 真原美診所
"""
import io, sys, codecs, time, json
import requests, psycopg2, pandas as pd, urllib3
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)
urllib3.disable_warnings()

DB = dict(host='34.81.74.228', port=5432, dbname='medical_ai',
          user='postgres', password='Medical360@2026', connect_timeout=15)
MOHW_URL = "https://www.mohw.gov.tw/dl-96581-66dbb751-f83a-416a-a998-893222e20fef.html"
HEADERS  = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0"}

SURGERY_SPEC = ['外科', '一般外科']
EXCLUDE_NAME = ['醫院', '衛生所', '聯合醫院']
AESTHETIC_KW = ['醫美', '美容', '整形', '微整', '雷射', '皮膚', '美診所']

ZHENGYUAN = {
    'name':  '真原美診所',
    'addr':  '花蓮縣花蓮市國聯里國聯五路5之5號3樓',
    'phone': '03-8355353',
    'spec':  '外科',
    'id':    'MOHW_ZY_001',
}

def normalize(s):
    return str(s or '').strip().replace(' ', '').replace('\u3000', '').lower()

def is_hospital(name):
    return any(k in str(name or '') for k in EXCLUDE_NAME)

def has_aesthetic(name):
    return any(k in str(name or '') for k in AESTHETIC_KW)

def is_surgery_spec(spec):
    s = str(spec or '')
    return any(kw in s for kw in SURGERY_SPEC)

# ------ STEP 0: DB queries ------
conn = psycopg2.connect(**DB)
cur = conn.cursor()

print("="*60)
print("STEP 0: 查詢 DB")
print("="*60)

cur.execute("SELECT id, name, specialty, address FROM clinics WHERE name LIKE '%真原%'")
rows = cur.fetchall()
print(f"\n[DB] 名稱含「真原」:")
if rows:
    for r in rows:
        print(f"  id={r[0]}  name={r[1]}  spec={r[2]}  addr={r[3]}")
else:
    print("  (無結果)")

cur.execute("""
    SELECT specialty, COUNT(*) as cnt FROM clinics
    WHERE specialty LIKE '%外科%'
    GROUP BY specialty ORDER BY cnt DESC
""")
rows = cur.fetchall()
print(f"\n[DB] 外科相關科別現況:")
for r in rows:
    print(f"  {str(r[0]):<30} {r[1]:>4} 筆")

cur.execute("SELECT COUNT(*) FROM clinics"); before = cur.fetchone()[0]
cur.execute("SELECT id FROM clinics"); existing_ids = {r[0] for r in cur.fetchall()}
cur.execute("SELECT name, LEFT(address,15) FROM clinics")
existing_keys = {(normalize(r[0]), normalize(r[1] or '')) for r in cur.fetchall()}
cur.close()
print(f"\n[DB] 目前總筆數: {before}")

# ------ STEP 1: Download ODS ------
print("\n" + "="*60)
print("STEP 1: 下載 MOHW ODS")
print("="*60)
r = requests.get(MOHW_URL, headers=HEADERS, allow_redirects=True, timeout=90, verify=False)
print(f"Downloaded {len(r.content):,} bytes")
buf = io.BytesIO(r.content)
sheets = pd.read_excel(buf, engine='odf', sheet_name=None, dtype=str)
df = pd.concat(sheets.values(), ignore_index=True)
print(f"ODS total rows: {len(df):,}")

# Check 真原美診所 in ODS
zy_rows = df[df['機構名稱'].fillna('').str.contains('真原')]
print(f"\n[ODS] 名稱含「真原」:")
if len(zy_rows):
    for _, row in zy_rows.iterrows():
        print(f"  {row.get('機構名稱','')}  科別={row.get('科別','')}  地址={row.get('地址','')[:30]}")
else:
    print("  (ODS無記錄)")

# ------ STEP 2: Filter 外科 + aesthetic keywords ------
print("\n" + "="*60)
print("STEP 2: 篩選外科+醫美關鍵字")
print("="*60)

mask = df['科別'].fillna('').apply(is_surgery_spec) & \
       df['機構名稱'].fillna('').apply(has_aesthetic) & \
       ~df['機構名稱'].fillna('').apply(is_hospital)

df_target = df[mask].copy()
print(f"ODS 符合條件 (外科+醫美關鍵字): {len(df_target)} 筆")

# Deduplicate
new_rows = []
dup_rows = []
for _, row in df_target.iterrows():
    code = str(row.get('機構代碼', '') or '').strip()
    mid  = f"MOHW_{code}" if code else None
    name = str(row.get('機構名稱', '') or '').strip()
    addr = str(row.get('地址', '') or '').strip()
    key  = (normalize(name), normalize(addr[:15]))

    if mid and mid in existing_ids:
        dup_rows.append(name); continue
    if key in existing_keys:
        dup_rows.append(name); continue
    new_rows.append(row)

print(f"已在DB (跳過): {len(dup_rows)}")
print(f"淨新增 (ODS):  {len(new_rows)}")
if new_rows:
    import pandas as _pd
    df_new = _pd.DataFrame(new_rows)
    print(f"\n將新增診所列表 (ODS):")
    for row in new_rows:
        print(f"  {str(row.get('機構名稱','')):<30}  {str(row.get('科別',''))[:12]:<14}  {str(row.get('縣市區名',''))[:8]}")

# Check 真原美診所 for manual insert
zy_key = (normalize(ZHENGYUAN['name']), normalize(ZHENGYUAN['addr'][:15]))
zy_in_db = ZHENGYUAN['id'] in existing_ids or zy_key in existing_keys
print(f"\n真原美診所 已在DB: {zy_in_db}")

total_new = len(new_rows) + (0 if zy_in_db else 1)
print(f"\n{'='*60}")
print(f"PREVIEW: 預計新增 {total_new} 筆")
print(f"  ODS 外科+醫美:  {len(new_rows)} 筆")
print(f"  手動補入(真原): {0 if zy_in_db else 1} 筆")
print(f"  DB after:       {before + total_new}")
print(f"{'='*60}")

if total_new == 0:
    print("\n無需新增，結束。")
    conn.close()
    sys.exit(0)

print(f"\n開始匯入（5秒後）...")
time.sleep(5)

# ------ STEP 3: Insert ------
conn2 = psycopg2.connect(**DB)
cur2 = conn2.cursor()
inserted = 0

# Insert ODS rows
for row in new_rows:
    code  = str(row.get('機構代碼', '') or '').strip()
    mid   = f"MOHW_{code}" if code else f"MOHW_SX{inserted}"
    name  = str(row.get('機構名稱', '') or '').strip()
    addr  = str(row.get('地址', '') or '').strip()
    phone = str(row.get('電話', '') or '').strip() or None
    spec  = str(row.get('科別', '') or '').strip()
    label = next((kw for kw in ['外科', '一般外科'] if kw in spec), spec[:20])

    try:
        cur2.execute("""
            INSERT INTO clinics
                (id, name, address, phone, specialty, is_partner,
                 legal_score, judicial_score, score,
                 google_rating, google_review_count, google_place_id,
                 score_breakdown, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,false, 20,20,80, null,null,null, %s, NOW(),NOW())
            ON CONFLICT (id) DO NOTHING
        """, (mid, name, addr, phone, label,
              json.dumps({"legal":20,"google":0,"judicial":20,"media":20,"social":20})))
        if cur2.rowcount == 1:
            inserted += 1
            print(f"  INSERT: {name}")
    except Exception as e:
        conn2.rollback()
        print(f"  ERROR: {name} - {e}")

# Insert 真原美診所
if not zy_in_db:
    try:
        cur2.execute("""
            INSERT INTO clinics
                (id, name, address, phone, specialty, is_partner,
                 legal_score, judicial_score, score,
                 google_rating, google_review_count, google_place_id,
                 score_breakdown, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,false, 20,20,80, null,null,null, %s, NOW(),NOW())
            ON CONFLICT (id) DO NOTHING
        """, (ZHENGYUAN['id'], ZHENGYUAN['name'], ZHENGYUAN['addr'],
              ZHENGYUAN['phone'], ZHENGYUAN['spec'],
              json.dumps({"legal":20,"google":0,"judicial":20,"media":20,"social":20})))
        if cur2.rowcount == 1:
            inserted += 1
            print(f"  INSERT: {ZHENGYUAN['name']} (手動)")
    except Exception as e:
        conn2.rollback()
        print(f"  ERROR: 真原美診所 - {e}")

conn2.commit()
cur2.execute("SELECT COUNT(*) FROM clinics"); after = cur2.fetchone()[0]
cur2.close()
conn2.close()

print(f"\n{'='*60}")
print(f"DONE")
print(f"  Inserted:  {inserted}")
print(f"  DB before: {before}")
print(f"  DB after:  {after}")
print(f"{'='*60}")
