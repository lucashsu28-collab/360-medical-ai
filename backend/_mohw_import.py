# -*- coding: utf-8 -*-
"""
MOHW Clinic Import Script - Option B
- Filters: only clinics with '診所' in name
- Excludes: 醫院/醫療財團法人/醫療社團法人/診所附設
- Sets: legal_score=10, judicial_score=10, score=20
- Dry-run first, then INSERT on confirmation
"""
import io
import re
import sys
import uuid
import codecs
import requests
import pandas as pd
import psycopg2

sys.stdout = codecs.getwriter("utf-8")(sys.stdout.buffer, "strict")

# ── Config ────────────────────────────────────────────
DB = dict(host="34.81.74.228", port=5432, dbname="medical_ai",
          user="postgres", password="Medical360@2026", connect_timeout=15)

MOHW_URL = "https://www.mohw.gov.tw/dl-96581-66dbb751-f83a-416a-a998-893222e20fef.html"
HEADERS  = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0"}

AESTHETIC_KW  = ["\u6574\u5f62\u5916\u79d1", "\u76ae\u819a\u79d1"]
# 整形外科, 皮膚科

EXCLUDE_WORDS = ["\u91ab\u9662", "\u91ab\u7642\u8ca1\u5718\u6cd5\u4eba",
                 "\u91ab\u7642\u793e\u5718\u6cd5\u4eba", "\u8a3a\u6240\u9644\u8a2d"]
# 醫院, 醫療財團法人, 醫療社團法人, 診所附設

REQUIRE_WORD  = "\u8a3a\u6240"   # 診所

import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def log(msg):
    print(msg, flush=True)


def download_ods():
    log("[1] Downloading MOHW ODS...")
    r = requests.get(MOHW_URL, headers=HEADERS, allow_redirects=True,
                     timeout=90, verify=False)
    log(f"    Status {r.status_code}, {len(r.content):,} bytes")
    assert r.content[:2] == b"PK", "Not a ZIP/ODS file"
    return r.content


def parse_and_filter(content: bytes) -> pd.DataFrame:
    log("[2] Parsing ODS...")
    buf = io.BytesIO(content)
    all_sheets = pd.read_excel(buf, engine="odf", sheet_name=None, dtype=str)
    df = pd.concat(all_sheets.values(), ignore_index=True)
    log(f"    Total rows: {len(df):,}")

    log("[3] Filtering...")
    sc = "\u79d1\u5225"   # 科別
    nc = "\u6a5f\u69cb\u540d\u7a31"   # 機構名稱
    ac = "\u5730\u5740"               # 地址
    ph = "\u96fb\u8a71"               # 電話
    cd = "\u6a5f\u69cb\u4ee3\u78bc"   # 機構代碼

    # Step A: aesthetic specialty
    mask_spec = df[sc].fillna("").apply(
        lambda x: any(kw in x for kw in AESTHETIC_KW)
    )
    df = df[mask_spec].copy()
    log(f"    After specialty filter: {len(df):,}")

    # Step B: must contain 診所
    mask_clinic = df[nc].fillna("").str.contains(REQUIRE_WORD, regex=False)
    df = df[mask_clinic].copy()
    log(f"    After '診所' filter: {len(df):,}")

    # Step C: exclude bad keywords
    for word in EXCLUDE_WORDS:
        df = df[~df[nc].fillna("").str.contains(word, regex=False)]
    log(f"    After exclusion filter: {len(df):,}")

    df = df[[cd, nc, ph, "\u7e23\u5e02\u5340\u540d", ac, sc]].copy()
    df.columns = ["code", "name", "phone", "city", "address", "specialty"]
    df = df.fillna("")

    # Derive primary specialty label
    def primary_spec(s):
        for kw in AESTHETIC_KW:
            if kw in s:
                return kw
        return s[:20]

    df["specialty_label"] = df["specialty"].apply(primary_spec)
    return df


def get_existing(conn) -> set:
    cur = conn.cursor()
    cur.execute("SELECT name, LEFT(address,15) FROM clinics")
    rows = cur.fetchall()
    cur.close()
    return {(normalize(r[0]), normalize(r[1])) for r in rows}


def normalize(s: str) -> str:
    return str(s).strip().replace(" ", "").replace("\u3000", "").lower()


def deduplicate(df: pd.DataFrame, existing: set) -> pd.DataFrame:
    log("[4] Deduplicating against existing DB records...")

    def is_dup(row):
        nn = normalize(row["name"])
        ak = normalize(row["address"][:15])
        return (nn, ak) in existing

    mask_dup = df.apply(is_dup, axis=1)
    new_df = df[~mask_dup].copy()
    log(f"    Duplicates removed: {mask_dup.sum()}")
    log(f"    Net new clinics to import: {len(new_df)}")
    return new_df


def preview(df: pd.DataFrame):
    log("\n" + "=" * 65)
    log("  IMPORT PREVIEW")
    log("=" * 65)
    log(f"  Will import: {len(df)} clinics")
    log(f"  specialty breakdown:")
    for kw in AESTHETIC_KW:
        cnt = df["specialty"].str.contains(kw, regex=False).sum()
        log(f"    {kw}: {cnt}")
    log("")
    log(f"  {'#':<4} {'Name':<32} {'City':<12} {'Specialty':<10}")
    log("  " + "-" * 65)
    for i, (_, row) in enumerate(df.head(15).iterrows(), 1):
        log(f"  {i:<4} {row['name']:<32} {row['city'][:10]:<12} {row['specialty_label']:<10}")
    if len(df) > 15:
        log(f"  ... and {len(df)-15} more")
    log("=" * 65)


def do_import(df: pd.DataFrame, conn):
    log(f"\n[5] Importing {len(df)} clinics...")
    cur = conn.cursor()

    # Get current max numeric id suffix (existing IDs are like 'NHI_XXXXXXXX')
    cur.execute("SELECT COUNT(*) FROM clinics")
    before_count = cur.fetchone()[0]

    inserted = 0
    skipped  = 0

    for _, row in df.iterrows():
        clinic_id = f"MOHW_{row['code']}" if row['code'] else f"MOHW_{uuid.uuid4().hex[:10]}"
        name      = row["name"].strip()
        address   = row["address"].strip()
        phone     = row["phone"].strip() or None
        specialty = row["specialty_label"].strip()
        city      = row["city"].strip()

        legal_score    = 10.0
        judicial_score = 10.0
        score          = legal_score + judicial_score   # = 20.0

        try:
            cur.execute("""
                INSERT INTO clinics
                    (id, name, address, phone, specialty, is_partner,
                     legal_score, judicial_score, score,
                     google_rating, google_review_count, google_place_id,
                     created_at, updated_at)
                VALUES
                    (%s, %s, %s, %s, %s, false,
                     %s, %s, %s,
                     null, null, null,
                     NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            """, (clinic_id, name, address, phone, specialty,
                  legal_score, judicial_score, score))
            if cur.rowcount == 1:
                inserted += 1
            else:
                skipped += 1
        except Exception as e:
            log(f"    ERROR inserting {name}: {e}")
            conn.rollback()
            skipped += 1
            continue

    conn.commit()

    cur.execute("SELECT COUNT(*) FROM clinics")
    after_count = cur.fetchone()[0]
    cur.close()

    log(f"    Inserted:  {inserted}")
    log(f"    Skipped (conflict): {skipped}")
    log(f"    DB before: {before_count}  ->  after: {after_count}")
    return inserted, after_count


def main():
    log("MOHW Clinic Import (Option B)\n")

    content = download_ods()
    df      = parse_and_filter(content)

    conn = psycopg2.connect(**DB)
    existing = get_existing(conn)
    log(f"    Existing DB records: {len(existing)}")

    df = deduplicate(df, existing)
    preview(df)

    if len(df) == 0:
        log("Nothing to import.")
        conn.close()
        return

    log("\n>> Proceeding with import in 3 seconds...")
    import time; time.sleep(3)

    inserted, total = do_import(df, conn)
    conn.close()

    log("\n" + "=" * 65)
    log("  IMPORT COMPLETE")
    log("=" * 65)
    log(f"  Clinics imported:      {inserted}")
    log(f"  Total clinics in DB:   {total}")
    log("=" * 65)


if __name__ == "__main__":
    main()
