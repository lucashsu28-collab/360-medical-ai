# -*- coding: utf-8 -*-
"""
Precise Cleanup & Expand Script
Step 1: DELETE non-aesthetic clinics (blacklist specialty + no keep keyword in name)
Step 2: INSERT from MOHW ODS (name keyword + not blacklist specialty + not in DB)
Step 3: INSERT from NHI JSON (same conditions)
"""
import io, sys, codecs, json, pathlib, time
import requests, psycopg2, pandas as pd, urllib3
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)
urllib3.disable_warnings()

DB = dict(host='34.81.74.228', port=5432, dbname='medical_ai',
          user='postgres', password='Medical360@2026', connect_timeout=15)
MOHW_URL = "https://www.mohw.gov.tw/dl-96581-66dbb751-f83a-416a-a998-893222e20fef.html"
HEADERS  = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0"}
NHI_JSON = pathlib.Path(__file__).parent / "data" / "clinics_real.json"

# ── Keywords & Blacklist ──────────────────────────────
KEEP_KW = [
    '醫美', '整形', '微整', '雷射', '皮膚', '抗老', '拉皮', '美容',
    '玻尿酸', '肉毒', '電波', '音波', '淨膚', '豐胸', '隆鼻', '雙眼皮',
]
BLACKLIST_SPEC = [
    '中醫一般科', '家庭牙醫科', '牙科', '贋復補綴牙科', '贋復補綴科',
    '口腔顎面外科', '齒顎矯正科', '齒顎矯正科,口腔顎面外科',
    '牙科,家庭牙醫科', '耳鼻喉科', '眼科', '婦產科', '兒科', '精神科',
]
EXCLUDE_NAMES = ['醫院', '衛生所', '聯合醫院']

def has_keep(name): return any(k in str(name or '') for k in KEEP_KW)
def is_blacklist(spec): return str(spec or '').split(',')[0].strip() in BLACKLIST_SPEC or str(spec or '') in BLACKLIST_SPEC
def is_hospital(name): return any(k in str(name or '') for k in EXCLUDE_NAMES)
def normalize(s): return str(s or '').strip().replace(' ','').replace('\u3000','').lower()


# ── Step 1: Preview DELETE ────────────────────────────
def step1_preview(conn):
    cur = conn.cursor()
    ph = ','.join(['%s'] * len(BLACKLIST_SPEC))
    cur.execute(f"SELECT id, name, specialty FROM clinics WHERE specialty IN ({ph})", BLACKLIST_SPEC)
    rows = cur.fetchall()

    to_del  = [r for r in rows if not has_keep(r[1])]
    to_keep = [r for r in rows if has_keep(r[1])]

    # Also check: specialty contains any blacklist keyword (partial match for combos)
    cur.execute("SELECT id, name, specialty FROM clinics WHERE specialty NOT IN (%s)" % ','.join(['%s']*len(BLACKLIST_SPEC)), BLACKLIST_SPEC)
    # For composite specialties that START with blacklist
    cur2 = conn.cursor()
    extra_del = []
    for bl in BLACKLIST_SPEC:
        cur2.execute(
            "SELECT id, name, specialty FROM clinics WHERE specialty LIKE %s AND specialty NOT IN (%s)" % ('%s', ','.join(['%s']*len(BLACKLIST_SPEC))),
            [bl + ',%'] + BLACKLIST_SPEC
        )
        for r in cur2.fetchall():
            if not has_keep(r[1]) and r not in to_del:
                extra_del.append(r)
    cur2.close()

    all_del = to_del + extra_del

    from collections import Counter
    spec_cnt = Counter(r[2] for r in all_del)

    print("=" * 65)
    print("STEP 1: DELETE 預覽")
    print("=" * 65)
    print(f"  符合黑名單科別: {len(rows)} 筆")
    print(f"  -> 名稱含保留關鍵字（不刪）: {len(to_keep)} 筆")
    for r in to_keep[:8]:
        print(f"       [保留] {r[1]} ({r[2]})")
    print(f"  -> 預計刪除: {len(all_del)} 筆")
    print()
    print(f"  {'科別':<35} {'筆數':>5}")
    print(f"  {'-'*43}")
    for spec, cnt in spec_cnt.most_common():
        print(f"  {str(spec):<35} {cnt:>5}")

    cur.close()
    return [r[0] for r in all_del]  # IDs


# ── Step 2: Preview ODS ───────────────────────────────
def download_ods():
    print("\n  Downloading MOHW ODS...", flush=True)
    r = requests.get(MOHW_URL, headers=HEADERS, allow_redirects=True, timeout=90, verify=False)
    print(f"  Downloaded {len(r.content):,} bytes")
    buf = io.BytesIO(r.content)
    sheets = pd.read_excel(buf, engine='odf', sheet_name=None, dtype=str)
    df = pd.concat(sheets.values(), ignore_index=True)
    print(f"  ODS rows: {len(df):,}")
    return df


def step2_preview(df_ods, conn, existing_ids, existing_keys):
    print("\n" + "=" * 65)
    print("STEP 2: ODS 名稱關鍵字擴充 預覽")
    print("=" * 65)

    # Filter
    mask = (
        df_ods['機構名稱'].fillna('').apply(has_keep) &
        ~df_ods['機構名稱'].fillna('').apply(is_hospital) &
        df_ods['機構名稱'].fillna('').str.contains('診所', regex=False) &
        ~df_ods['科別'].fillna('').apply(is_blacklist)
    )
    df_match = df_ods[mask].copy()
    print(f"  ODS match (name kw + not blacklist + 診所): {len(df_match):,}")

    new_rows = []
    for _, row in df_match.iterrows():
        code    = str(row.get('機構代碼','') or '').strip()
        mid     = f"MOHW_{code}" if code else None
        name    = str(row.get('機構名稱','') or '').strip()
        addr    = str(row.get('地址','') or '').strip()
        key     = (normalize(name), normalize(addr[:15]))

        if mid and mid in existing_ids: continue
        if key in existing_keys: continue
        new_rows.append(row)

    print(f"  After dedup: {len(new_rows)} net new")

    from collections import Counter
    if new_rows:
        df_new = pd.DataFrame(new_rows)
        spec_cnt = Counter(df_new['科別'].fillna('NULL').tolist())
        print(f"\n  科別分布:")
        for spec, cnt in spec_cnt.most_common(10):
            print(f"    {str(spec):<30} {cnt:>4}")
        print(f"\n  前10筆範例:")
        for row in new_rows[:10]:
            print(f"    {str(row.get('機構名稱','')):<30} {str(row.get('科別',''))[:12]:<14} {str(row.get('縣市區名',''))[:8]}")

    return new_rows


# ── Step 3: Preview NHI ───────────────────────────────
def step3_preview(conn, existing_ids, existing_keys):
    print("\n" + "=" * 65)
    print("STEP 3: NHI JSON 名稱關鍵字擴充 預覽")
    print("=" * 65)

    if not NHI_JSON.exists():
        print("  clinics_real.json not found, skipping")
        return []

    nhi = json.load(open(NHI_JSON, encoding='utf-8'))
    print(f"  NHI total: {len(nhi):,}")

    new_rows = []
    for c in nhi:
        name = str(c.get('name','') or '')
        spec = str(c.get('specialty','') or '')
        addr = str(c.get('address','') or '')
        cid  = str(c.get('id','') or '')

        if not has_keep(name): continue
        if is_blacklist(spec): continue
        if is_hospital(name): continue
        if cid in existing_ids: continue
        key = (normalize(name), normalize(addr[:15]))
        if key in existing_keys: continue
        new_rows.append(c)

    print(f"  NHI match (name kw + not blacklist + not in DB): {len(new_rows)}")
    for c in new_rows[:5]:
        print(f"    {c['name']:<30} {c.get('specialty','')[:15]}")
    return new_rows


# ── Execute DELETE ────────────────────────────────────
def do_delete(ids, conn):
    if not ids:
        print("\n  Nothing to delete.")
        return 0
    cur = conn.cursor()
    ph = ','.join(['%s'] * len(ids))
    cur.execute(f"DELETE FROM clinics WHERE id IN ({ph})", ids)
    deleted = cur.rowcount
    conn.commit()
    cur.close()
    print(f"\n  Deleted: {deleted} rows")
    return deleted


# ── Execute INSERT ────────────────────────────────────
def do_insert_ods(new_rows, conn, existing_ids):
    if not new_rows:
        print("  Nothing to insert.")
        return 0
    cur = conn.cursor()
    inserted = 0
    for row in new_rows:
        code = str(row.get('機構代碼','') or '').strip()
        mid  = f"MOHW_{code}" if code else f"MOHW_X{inserted}"
        name = str(row.get('機構名稱','') or '').strip()
        addr = str(row.get('地址','') or '').strip()
        phone = str(row.get('電話','') or '').strip() or None
        spec = str(row.get('科別','') or '').strip()

        try:
            cur.execute("""
                INSERT INTO clinics
                    (id, name, address, phone, specialty, is_partner,
                     legal_score, judicial_score, score,
                     google_rating, google_review_count, google_place_id,
                     created_at, updated_at)
                VALUES (%s,%s,%s,%s,%s,false, 10,10,20, null,null,null, NOW(),NOW())
                ON CONFLICT (id) DO NOTHING
            """, (mid, name, addr, phone, spec))
            if cur.rowcount == 1:
                inserted += 1
        except Exception as e:
            conn.rollback()
            print(f"  ERROR: {name} - {e}")
            continue
    conn.commit()
    cur.close()
    print(f"  Inserted (ODS): {inserted}")
    return inserted


def do_insert_nhi(new_rows, conn):
    if not new_rows:
        print("  Nothing to insert from NHI.")
        return 0
    cur = conn.cursor()
    inserted = 0
    for c in new_rows:
        cid  = str(c.get('id','') or '')
        name = str(c.get('name','') or '')
        addr = str(c.get('address','') or '')
        phone = str(c.get('phone','') or '') or None
        spec = str(c.get('specialty','') or '')
        try:
            cur.execute("""
                INSERT INTO clinics
                    (id, name, address, phone, specialty, is_partner,
                     legal_score, judicial_score, score,
                     google_rating, google_review_count, google_place_id,
                     created_at, updated_at)
                VALUES (%s,%s,%s,%s,%s,false, 10,10,20, null,null,null, NOW(),NOW())
                ON CONFLICT (id) DO NOTHING
            """, (cid, name, addr, phone, spec))
            if cur.rowcount == 1:
                inserted += 1
        except Exception as e:
            conn.rollback()
        inserted += (1 if cur.rowcount == 1 else 0)
    conn.commit()
    cur.close()
    print(f"  Inserted (NHI): {inserted}")
    return inserted


# ── Main ──────────────────────────────────────────────
def main():
    conn = psycopg2.connect(**DB)
    print("DB connected\n")

    # Current state
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM clinics"); total_before = cur.fetchone()[0]
    cur.execute("SELECT id FROM clinics"); existing_ids = {r[0] for r in cur.fetchall()}
    cur.execute("SELECT name, LEFT(address,15) FROM clinics")
    existing_keys = {(normalize(r[0]), normalize(r[1] or '')) for r in cur.fetchall()}
    cur.close()
    print(f"Current DB: {total_before} clinics\n")

    # Preview
    del_ids    = step1_preview(conn)
    df_ods     = download_ods()
    ods_rows   = step2_preview(df_ods, conn, existing_ids, existing_keys)
    nhi_rows   = step3_preview(conn, existing_ids, existing_keys)

    print("\n" + "=" * 65)
    print("  === SUMMARY (PREVIEW) ===")
    print(f"  Current DB:          {total_before}")
    print(f"  Step 1 DELETE:      -{len(del_ids)}")
    print(f"  Step 2 ODS INSERT:  +{len(ods_rows)}")
    print(f"  Step 3 NHI INSERT:  +{len(nhi_rows)}")
    print(f"  Estimated final:     {total_before - len(del_ids) + len(ods_rows) + len(nhi_rows)}")
    print("=" * 65)
    print("\n  Executing in 5 seconds...")
    time.sleep(5)

    # Execute
    print("\n[EXECUTING Step 1: DELETE]")
    do_delete(del_ids, conn)

    print("\n[EXECUTING Step 2: INSERT ODS]")
    do_insert_ods(ods_rows, conn, existing_ids)

    print("\n[EXECUTING Step 3: INSERT NHI]")
    do_insert_nhi(nhi_rows, conn)

    # Final count
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM clinics"); total_after = cur.fetchone()[0]
    cur.close()

    print("\n" + "=" * 65)
    print("  === DONE ===")
    print(f"  Before: {total_before}")
    print(f"  After:  {total_after}")
    print(f"  Net change: {total_after - total_before:+}")
    print("=" * 65)
    conn.close()


if __name__ == "__main__":
    main()
