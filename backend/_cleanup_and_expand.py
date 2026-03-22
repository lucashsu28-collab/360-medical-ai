# -*- coding: utf-8 -*-
"""
Task 1: Delete non-aesthetic clinics (specialty = dental/eye/etc AND name has no aesthetic keywords)
Task 2: Find new clinics from MOHW ODS by NAME keywords (not just specialty)
"""
import io, sys, codecs, csv, re, requests, psycopg2, pandas as pd, urllib3
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)
urllib3.disable_warnings()

DB = dict(host='34.81.74.228', port=5432, dbname='medical_ai',
          user='postgres', password='Medical360@2026', connect_timeout=15)

MOHW_URL = "https://www.mohw.gov.tw/dl-96581-66dbb751-f83a-416a-a998-893222e20fef.html"
HEADERS  = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0"}

# 刪除條件：specialty 屬於這些
DELETE_SPECIALTIES = [
    '牙科', '家庭牙醫科', '贋復補綴牙科', '口腔顎面外科',
    '齒顎矯正科', '齒顎矯正科,口腔顎面外科',
    '牙科,家庭牙醫科', '眼科', '婦產科', '兒科', '精神科',
]

# 保留關鍵字（名稱含任何一個就保留）
KEEP_NAME_KW = [
    '醫美', '美容', '整形', '微整', '雷射', '皮膚', '抗老', '拉皮',
    '美學', '玻尿酸', '肉毒', '瘦臉', '電波', '音波', '淨膚',
    '美白', '豐胸', '隆鼻', '雙眼皮',
]

# 新增來源：名稱含這些關鍵字
ADD_NAME_KW = [
    '醫美', '美容', '整形', '微整', '雷射', '皮膚', '抗老', '拉皮', '美學',
]

def has_keep_kw(name):
    n = str(name or '')
    return any(kw in n for kw in KEEP_NAME_KW)

def has_add_kw(name):
    n = str(name or '')
    return any(kw in n for kw in ADD_NAME_KW)

def normalize(s):
    return str(s or '').strip().replace(' ', '').replace('\u3000', '').lower()

# ── Task 1 Preview ────────────────────────────────────
def task1_preview(conn):
    cur = conn.cursor()
    print("=" * 65)
    print("TASK 1: 清除非醫美診所 預覽")
    print("=" * 65)

    placeholders = ','.join(['%s'] * len(DELETE_SPECIALTIES))
    cur.execute(
        f"SELECT id, name, specialty FROM clinics WHERE specialty IN ({placeholders})",
        DELETE_SPECIALTIES
    )
    rows = cur.fetchall()

    to_delete = [(r[0], r[1], r[2]) for r in rows if not has_keep_kw(r[1])]
    to_keep   = [(r[0], r[1], r[2]) for r in rows if has_keep_kw(r[1])]

    print(f"\n  符合科別條件: {len(rows)} 筆")
    print(f"  -> 名稱含保留關鍵字（不刪）: {len(to_keep)} 筆")
    for r in to_keep[:5]:
        print(f"       [保留] {r[1]} ({r[2]})")
    print(f"  -> 預計刪除: {len(to_delete)} 筆")
    print()

    # Breakdown by specialty
    from collections import Counter
    spec_cnt = Counter(r[2] for r in to_delete)
    print(f"  {'科別':<30} {'筆數':>5}")
    print(f"  {'-'*38}")
    for spec, cnt in spec_cnt.most_common():
        print(f"  {str(spec):<30} {cnt:>5}")

    cur.close()
    return [r[0] for r in to_delete]  # IDs to delete

# ── Task 2 Preview ────────────────────────────────────
def task2_preview(conn):
    print("\n" + "=" * 65)
    print("TASK 2: 衛福部ODS名稱關鍵字擴充 預覽")
    print("=" * 65)

    print("\n  Downloading MOHW ODS...")
    r = requests.get(MOHW_URL, headers=HEADERS, allow_redirects=True, timeout=90, verify=False)
    print(f"  Downloaded: {len(r.content):,} bytes")
    buf = io.BytesIO(r.content)
    sheets = pd.read_excel(buf, engine='odf', sheet_name=None, dtype=str)
    df = pd.concat(sheets.values(), ignore_index=True)
    print(f"  ODS total rows: {len(df):,}")

    # Filter by name keyword
    mask_name = df['機構名稱'].fillna('').apply(has_add_kw)
    df_name = df[mask_name].copy()
    print(f"  Name keyword match: {len(df_name):,}")

    # Exclude hospitals
    df_name = df_name[~df_name['機構名稱'].fillna('').str.contains('醫院', regex=False)]
    print(f"  After excluding 醫院: {len(df_name):,}")

    # Must contain 診所
    df_name = df_name[df_name['機構名稱'].fillna('').str.contains('診所', regex=False)]
    print(f"  Only 診所: {len(df_name):,}")

    # Get existing DB records for dedup
    cur = conn.cursor()
    cur.execute("SELECT name, LEFT(address, 15) FROM clinics")
    existing = {(normalize(r[0]), normalize(r[1] or '')) for r in cur.fetchall()}
    cur.execute("SELECT id FROM clinics")
    existing_ids = {r[0] for r in cur.fetchall()}
    cur.close()

    # Dedup
    new_rows = []
    dup_rows = []
    for _, row in df_name.iterrows():
        code = str(row.get('機構代碼', '') or '').strip()
        mohw_id = f"MOHW_{code}" if code else None

        # Skip if already in DB by ID
        if mohw_id and mohw_id in existing_ids:
            dup_rows.append(row)
            continue

        # Skip if already in DB by name+address
        name = str(row.get('機構名稱', '') or '').strip()
        addr = str(row.get('地址', '') or '').strip()
        key = (normalize(name), normalize(addr[:15]))
        if key in existing:
            dup_rows.append(row)
            continue

        new_rows.append(row)

    print(f"\n  Already in DB (duplicates): {len(dup_rows)}")
    print(f"  NET NEW to add: {len(new_rows)}")

    # Specialty breakdown of new rows
    if new_rows:
        from collections import Counter
        new_df = pd.DataFrame(new_rows)
        spec_cnt = Counter(new_df['科別'].fillna('NULL').tolist())
        print(f"\n  科別分布（新增）:")
        for spec, cnt in spec_cnt.most_common(10):
            print(f"    {str(spec):<30} {cnt:>4}")

        print(f"\n  前15筆範例:")
        print(f"  {'名稱':<30} {'科別':<15} {'縣市':<10}")
        print(f"  {'-'*60}")
        for row in new_rows[:15]:
            print(f"  {str(row.get('機構名稱','')):<30} {str(row.get('科別',''))[:13]:<15} {str(row.get('縣市區名',''))[:8]:<10}")

    return new_rows

# ── Main ──────────────────────────────────────────────
def main():
    conn = psycopg2.connect(**DB)
    print("DB connected\n")

    ids_to_delete = task1_preview(conn)
    new_rows = task2_preview(conn)

    print("\n" + "=" * 65)
    print("SUMMARY")
    print("=" * 65)
    print(f"  Task 1 預計刪除: {len(ids_to_delete)} 筆")
    print(f"  Task 2 預計新增: {len(new_rows)} 筆")

    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM clinics")
    current = cur.fetchone()[0]
    cur.close()
    print(f"  目前DB筆數:       {current}")
    print(f"  執行後預計剩餘:   {current - len(ids_to_delete) + len(new_rows)}")
    print("=" * 65)
    print("\n  等待確認後再執行...")

    conn.close()

if __name__ == "__main__":
    main()
