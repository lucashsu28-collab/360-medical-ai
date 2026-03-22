# -*- coding: utf-8 -*-
"""
Import 整形外科 + 皮膚科 clinics from MOHW ODS
Regardless of name keywords (pure specialty filter)
"""
import io, sys, codecs, time
import requests, psycopg2, pandas as pd, urllib3
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)
urllib3.disable_warnings()

DB = dict(host='34.81.74.228', port=5432, dbname='medical_ai',
          user='postgres', password='Medical360@2026', connect_timeout=15)
MOHW_URL = "https://www.mohw.gov.tw/dl-96581-66dbb751-f83a-416a-a998-893222e20fef.html"
HEADERS  = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0"}

SPECIALTY_KW = ['整形外科', '皮膚科']
EXCLUDE_NAME = ['醫院', '衛生所', '聯合醫院']

def normalize(s):
    return str(s or '').strip().replace(' ', '').replace('\u3000', '').lower()

def is_hospital(name):
    return any(k in str(name or '') for k in EXCLUDE_NAME)

def main():
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM clinics"); before = cur.fetchone()[0]
    cur.execute("SELECT id FROM clinics"); existing_ids = {r[0] for r in cur.fetchall()}
    cur.execute("SELECT name, LEFT(address,15) FROM clinics")
    existing_keys = {(normalize(r[0]), normalize(r[1] or '')) for r in cur.fetchall()}
    cur.close()
    print(f"Current DB: {before} clinics\n")

    # Download ODS
    print("Downloading MOHW ODS...")
    r = requests.get(MOHW_URL, headers=HEADERS, allow_redirects=True, timeout=90, verify=False)
    print(f"Downloaded {len(r.content):,} bytes")
    buf = io.BytesIO(r.content)
    sheets = pd.read_excel(buf, engine='odf', sheet_name=None, dtype=str)
    df = pd.concat(sheets.values(), ignore_index=True)
    print(f"ODS total rows: {len(df):,}\n")

    # Filter by specialty
    mask_spec = df['科別'].fillna('').apply(
        lambda x: any(kw in x for kw in SPECIALTY_KW)
    )
    df_spec = df[mask_spec].copy()
    print(f"Specialty match (整形外科/皮膚科): {len(df_spec):,}")

    # Exclude hospitals
    df_spec = df_spec[~df_spec['機構名稱'].fillna('').apply(is_hospital)]
    print(f"After excluding 醫院: {len(df_spec):,}")

    # Deduplicate
    new_rows = []
    dup_rows = []
    for _, row in df_spec.iterrows():
        code = str(row.get('機構代碼', '') or '').strip()
        mid  = f"MOHW_{code}" if code else None
        name = str(row.get('機構名稱', '') or '').strip()
        addr = str(row.get('地址', '') or '').strip()
        key  = (normalize(name), normalize(addr[:15]))

        if mid and mid in existing_ids:
            dup_rows.append(row); continue
        if key in existing_keys:
            dup_rows.append(row); continue
        new_rows.append(row)

    print(f"Already in DB: {len(dup_rows)}")
    print(f"NET NEW to add: {len(new_rows)}")

    # Specialty breakdown
    from collections import Counter
    if new_rows:
        df_new = pd.DataFrame(new_rows)
        spec_cnt = Counter(df_new['科別'].fillna('').tolist())
        print(f"\nSpecialty breakdown (new):")
        for spec, cnt in spec_cnt.most_common(10):
            print(f"  {str(spec):<35} {cnt:>4}")
        print(f"\nSample (first 10):")
        for row in new_rows[:10]:
            print(f"  {str(row.get('機構名稱','')):<30} {str(row.get('科別',''))[:14]:<16} {str(row.get('縣市區名',''))[:8]}")

    print(f"\n{'='*55}")
    print(f"PREVIEW: will insert {len(new_rows)} new clinics")
    print(f"DB after: {before + len(new_rows)}")
    print(f"{'='*55}")

    if len(new_rows) == 0:
        print("Nothing to insert."); conn.close(); return

    print("\nExecuting in 5 seconds...")
    time.sleep(5)

    # Insert
    cur = conn.cursor()
    inserted = 0
    for row in new_rows:
        code  = str(row.get('機構代碼', '') or '').strip()
        mid   = f"MOHW_{code}" if code else f"MOHW_X{inserted}"
        name  = str(row.get('機構名稱', '') or '').strip()
        addr  = str(row.get('地址', '') or '').strip()
        phone = str(row.get('電話', '') or '').strip() or None
        spec  = str(row.get('科別', '') or '').strip()

        # Primary specialty label
        label = next((kw for kw in SPECIALTY_KW if kw in spec), spec[:20])

        try:
            cur.execute("""
                INSERT INTO clinics
                    (id, name, address, phone, specialty, is_partner,
                     legal_score, judicial_score, score,
                     google_rating, google_review_count, google_place_id,
                     created_at, updated_at)
                VALUES (%s,%s,%s,%s,%s,false, 10,10,20, null,null,null, NOW(),NOW())
                ON CONFLICT (id) DO NOTHING
            """, (mid, name, addr, phone, label))
            if cur.rowcount == 1:
                inserted += 1
        except Exception as e:
            conn.rollback()
            print(f"  ERROR: {name} - {e}")
    conn.commit()

    cur.execute("SELECT COUNT(*) FROM clinics"); after = cur.fetchone()[0]
    cur.close()
    conn.close()

    print(f"\n{'='*55}")
    print(f"DONE")
    print(f"  Inserted:      {inserted}")
    print(f"  DB before:     {before}")
    print(f"  DB after:      {after}")
    print(f"{'='*55}")

if __name__ == "__main__":
    main()
