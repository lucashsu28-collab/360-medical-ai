# -*- coding: utf-8 -*-
"""
MOHW Medical Institution Data Analysis Script
- Downloads MOHW ODS file
- Filters aesthetic-related specialties
- Compares with existing 904 DB records
- Outputs statistical report (no DB writes)
"""
import io
import os
import sys
import re
import csv
import requests
import pandas as pd
import psycopg2

# Force UTF-8 output
import codecs
sys.stdout = codecs.getwriter("utf-8")(sys.stdout.buffer, "strict")

DATABASE_URL = "postgresql://postgres:Medical360@2026@34.81.74.228/medical_ai"

MOHW_DOWNLOAD_PAGE = "https://www.mohw.gov.tw/dl-96581-66dbb751-f83a-416a-a998-893222e20fef.html"
MOHW_INFO_PAGE = "https://dep.mohw.gov.tw/DOMA/cp-4926-54415-106.html"

AESTHETIC_KEYWORDS = ["\u6574\u5f62\u5916\u79d1", "\u76ae\u819a\u79d1", "\u91ab\u5b78\u7f8e\u5bb9", "\u7f8e\u5bb9\u5916\u79d1"]
# 整形外科, 皮膚科, 醫學美容, 美容外科

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0"}


def log(msg):
    print(msg, flush=True)


def download_ods():
    log("[1] Downloading MOHW ODS file...")

    urls_to_try = [MOHW_DOWNLOAD_PAGE]

    # Also try to find the real link from the info page (disable SSL verify for gov sites)
    try:
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        resp = requests.get(MOHW_INFO_PAGE, headers=HEADERS, timeout=30, verify=False)
        links = re.findall(r'href=["\']([^"\']*(?:\.ods|dl-\d+)[^"\']*)["\']', resp.text)
        log(f"    Found links on info page: {links}")
        for link in links:
            if not link.startswith("http"):
                link = "https://www.mohw.gov.tw" + link
            if link not in urls_to_try:
                urls_to_try.insert(0, link)
    except Exception as e:
        log(f"    Could not parse info page: {e}")

    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    for url in urls_to_try:
        try:
            log(f"    Trying: {url[:90]}...")
            r = requests.get(url, headers=HEADERS, allow_redirects=True, timeout=90, verify=False)
            ctype = r.headers.get("content-type", "")
            log(f"    Status: {r.status_code}, Content-Type: {ctype[:60]}, Size: {len(r.content):,} bytes")

            if r.status_code == 200 and len(r.content) > 20000:
                if r.content[:2] == b"PK":
                    log("    >> ZIP/ODS format confirmed")
                    return r.content
                elif any(x in ctype for x in ["spreadsheet", "ods", "excel", "octet"]):
                    log("    >> Spreadsheet content-type confirmed")
                    return r.content
                else:
                    log(f"    >> Unknown content-type, first 30 bytes: {r.content[:30]}")
        except Exception as e:
            log(f"    Error: {e}")

    # Google Drive fallback with confirmation token handling
    log("    Trying Google Drive fallback...")
    gd_url = "https://drive.google.com/uc?export=download&id=0B21MNCHGeP-gRFZ2bS04c01xdVk"
    try:
        sess = requests.Session()
        r = sess.get(gd_url, headers=HEADERS, timeout=60)
        log(f"    GDrive status: {r.status_code}, size: {len(r.content):,}")
        if r.content[:2] == b"PK":
            return r.content
        # Check for confirmation token
        token = None
        m = re.search(r'confirm=([0-9A-Za-z_\-]+)', r.text)
        if m:
            token = m.group(1)
        if not token:
            m = re.search(r'name="confirm" value="([^"]+)"', r.text)
            if m:
                token = m.group(1)
        if token:
            log(f"    GDrive confirm token: {token}")
            r2 = sess.get(f"{gd_url}&confirm={token}", headers=HEADERS, timeout=90)
            log(f"    GDrive confirmed: size {len(r2.content):,}")
            if r2.content[:2] == b"PK":
                return r2.content
    except Exception as e:
        log(f"    GDrive error: {e}")

    log("ERROR: All download attempts failed")
    return None


def parse_ods(content):
    log("\n[2] Parsing ODS file...")
    buf = io.BytesIO(content)

    # List ZIP contents for debugging
    try:
        import zipfile
        with zipfile.ZipFile(buf) as z:
            names = z.namelist()
            log(f"    ZIP contents: {names[:15]}")
        buf.seek(0)
    except Exception as e:
        log(f"    ZIP inspection failed: {e}")

    # Try reading with odf engine
    buf.seek(0)
    try:
        all_sheets = pd.read_excel(buf, engine="odf", sheet_name=None, dtype=str)
        log(f"    Sheets found: {list(all_sheets.keys())}")
        dfs = []
        for sname, sdf in all_sheets.items():
            log(f"    Sheet '{sname}': {len(sdf):,} rows, cols: {list(sdf.columns)[:8]}")
            if len(sdf) > 0:
                dfs.append(sdf)
        if dfs:
            df = pd.concat(dfs, ignore_index=True)
            log(f"    Combined: {len(df):,} rows")
            return df
    except Exception as e:
        log(f"    pandas odf parse failed: {e}")

    # Try openpyxl (xlsx)
    buf.seek(0)
    try:
        df = pd.read_excel(buf, engine="openpyxl", sheet_name=0, dtype=str)
        log(f"    openpyxl success: {len(df):,} rows")
        return df
    except Exception as e:
        log(f"    openpyxl failed: {e}")

    return None


def find_column(df, keywords):
    for col in df.columns:
        if any(kw in str(col) for kw in keywords):
            return col
    return None


def filter_aesthetic(df):
    log("\n[3] Filtering aesthetic-related specialties...")
    log(f"    Total rows: {len(df):,}")
    log(f"    Columns: {list(df.columns)}")

    # Show first 3 rows for inspection
    log("    Sample rows:")
    for _, row in df.head(3).iterrows():
        log(f"      {dict(row)}")

    specialty_col = find_column(df, ["\u79d1\u5225", "\u8a3a\u7642\u79d1", "\u79d1\u76ee", "specialty"])
    name_col = find_column(df, ["\u6a5f\u69cb\u540d\u7a31", "\u540d\u7a31", "name"])
    addr_col = find_column(df, ["\u5730\u5740", "address"])
    phone_col = find_column(df, ["\u96fb\u8a71", "phone", "tel"])
    code_col = find_column(df, ["\u6a5f\u69cb\u4ee3\u78bc", "\u4ee3\u78bc", "code", "id"])

    log(f"    specialty_col='{specialty_col}', name_col='{name_col}', addr_col='{addr_col}'")

    if specialty_col is None:
        log("    ERROR: Could not find specialty column. Showing all column samples:")
        for col in df.columns:
            samples = df[col].dropna().head(5).tolist()
            log(f"      '{col}': {samples}")
        return None, None, None, None, None

    # Filter
    mask = df[specialty_col].fillna("").apply(
        lambda x: any(kw in str(x) for kw in AESTHETIC_KEYWORDS)
    )
    filtered = df[mask].copy()
    log(f"    After filter: {len(filtered):,} rows")

    # Per-keyword counts
    log("    Breakdown by keyword:")
    for kw in AESTHETIC_KEYWORDS:
        cnt = df[specialty_col].fillna("").str.contains(kw, regex=False).sum()
        log(f"      {kw}: {cnt:,}")

    return filtered, name_col, addr_col, phone_col, specialty_col


def get_existing_clinics():
    log("\n[4] Fetching existing clinics from DB...")
    try:
        # Parse URL manually to handle @ in password
        # postgresql://postgres:Medical360@2026@34.81.74.228/medical_ai
        conn = psycopg2.connect(
            host="34.81.74.228",
            port=5432,
            dbname="medical_ai",
            user="postgres",
            password="Medical360@2026",
            connect_timeout=15
        )
        cur = conn.cursor()
        cur.execute("SELECT id, name, address, specialty FROM clinics ORDER BY id")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        log(f"    Fetched {len(rows):,} existing clinics from DB")
        return [{"id": r[0], "name": str(r[1] or ""), "address": str(r[2] or ""), "specialty": str(r[3] or "")} for r in rows]
    except Exception as e:
        log(f"    DB connection failed: {e}")
        return []


def normalize(s):
    return str(s).strip().replace(" ", "").replace("\u3000", "").lower()


def compare(filtered_df, existing, name_col, addr_col, specialty_col):
    log("\n[5] Comparing with existing DB records...")

    existing_names = {normalize(c["name"]) for c in existing}
    existing_keys = {
        (normalize(c["name"]), normalize(c["address"][:15] if c["address"] else ""))
        for c in existing
    }

    duplicates = []
    new_clinics = []

    for _, row in filtered_df.iterrows():
        name = str(row.get(name_col, "") or "").strip()
        addr = str(row.get(addr_col, "") or "").strip() if addr_col else ""
        specialty = str(row.get(specialty_col, "") or "").strip()

        nn = normalize(name)
        key = (nn, normalize(addr[:15]))

        if nn in existing_names or key in existing_keys:
            duplicates.append({"name": name, "address": addr, "specialty": specialty})
        else:
            new_clinics.append({"name": name, "address": addr, "specialty": specialty})

    return duplicates, new_clinics


def print_report(filtered_df, duplicates, new_clinics, existing, specialty_col):
    sep = "=" * 65
    log("\n" + sep)
    log("  STATISTICAL REPORT: MOHW Aesthetic Clinic Analysis")
    log(sep)
    log(f"  MOHW aesthetic-related clinics (filtered): {len(filtered_df):,}")
    log(f"  Existing DB clinics:                       {len(existing):,}")
    log(f"  Duplicates (already in DB):                {len(duplicates):,}")
    log(f"  NEW clinics (not in DB):                   {len(new_clinics):,}")
    log("")
    log("  Breakdown by specialty keyword:")
    for kw in AESTHETIC_KEYWORDS:
        cnt = filtered_df[specialty_col].fillna("").str.contains(kw, regex=False).sum()
        log(f"    {kw}: {cnt:,}")
    log("")

    log("  Top 10 NEW clinics (sample):")
    log(f"  {'#':<3} {'Name':<30} {'Address':<35} {'Specialty':<12}")
    log("  " + "-" * 85)
    for i, c in enumerate(new_clinics[:10], 1):
        name = c["name"][:28]
        addr = c["address"][:33]
        spec = c["specialty"][:10]
        log(f"  {i:<3} {name:<30} {addr:<35} {spec:<12}")
    log("")

    if duplicates:
        log("  Sample duplicates (already in DB):")
        for i, c in enumerate(duplicates[:5], 1):
            log(f"    {i}. {c['name']} | {c['address'][:40]}")

    log(sep)


def main():
    log("MOHW Aesthetic Clinic Analysis\n")

    content = download_ods()
    if not content:
        log("FATAL: Could not download ODS file")
        sys.exit(1)

    df = parse_ods(content)
    if df is None or len(df) == 0:
        log("FATAL: Could not parse ODS file")
        sys.exit(1)

    result = filter_aesthetic(df)
    filtered_df, name_col, addr_col, phone_col, specialty_col = result

    if filtered_df is None or len(filtered_df) == 0:
        log("FATAL: No rows after filtering")
        sys.exit(1)

    existing = get_existing_clinics()

    duplicates, new_clinics = compare(filtered_df, existing, name_col, addr_col, specialty_col)

    print_report(filtered_df, duplicates, new_clinics, existing, specialty_col)

    # Save preview CSV
    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_mohw_new_clinics_preview.csv")
    with open(out_path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=["name", "address", "specialty"])
        w.writeheader()
        w.writerows(new_clinics)
    log(f"\n  Preview CSV saved: {out_path}")
    log("  (Review quality before importing to DB)")


if __name__ == "__main__":
    main()
