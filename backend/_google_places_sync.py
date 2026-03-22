# -*- coding: utf-8 -*-
"""
Google Places Sync Script
Phase 1: Sync existing places_results.json -> DB (FREE, no API)
Phase 2: Call Google Places API for MOHW new clinics (784 calls)
"""
import asyncio
import codecs
import json
import pathlib
import sys
import time

import httpx
import psycopg2

sys.stdout = codecs.getwriter("utf-8")(sys.stdout.buffer, "strict")

# ── Config ────────────────────────────────────────────
DB = dict(host="34.81.74.228", port=5432, dbname="medical_ai",
          user="postgres", password="Medical360@2026", connect_timeout=15)

PLACES_API_KEY    = "AIzaSyCarq1kOV9dxLD6yJURAuLZHQLi-CpiE6c"
FIND_PLACE_URL    = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
PLACE_DETAIL_URL  = "https://maps.googleapis.com/maps/api/place/details/json"

DATA_DIR          = pathlib.Path(__file__).parent / "data"
PLACES_JSON       = DATA_DIR / "places_results.json"
MOHW_CACHE_JSON   = DATA_DIR / "mohw_places_cache.json"

DELAY_SEC         = 0.5
REPORT_EVERY      = 50


def log(msg):
    print(msg, flush=True)


# ── Phase 1: Sync JSON → DB (no API) ─────────────────
def phase1_sync_json(conn):
    log("\n=== Phase 1: Sync places_results.json -> DB (no API cost) ===")

    if not PLACES_JSON.exists():
        log("  places_results.json not found, skipping phase 1")
        return

    with open(PLACES_JSON, encoding="utf-8") as f:
        cache = json.load(f)

    found_records = {k: v for k, v in cache.items() if v.get("found")}
    log(f"  Cache has {len(cache)} records, {len(found_records)} with data")

    cur = conn.cursor()
    updated = 0
    skipped = 0

    for clinic_id, info in found_records.items():
        place_id     = info.get("place_id")
        rating       = info.get("rating")
        review_count = info.get("review_count")

        if not place_id:
            skipped += 1
            continue

        cur.execute("""
            UPDATE clinics
            SET google_place_id      = %s,
                google_rating        = %s,
                google_review_count  = %s,
                updated_at           = NOW()
            WHERE id = %s AND google_place_id IS NULL
        """, (place_id, rating, review_count, clinic_id))

        if cur.rowcount > 0:
            updated += 1
        else:
            skipped += 1

    conn.commit()
    cur.close()

    log(f"  Updated: {updated}  |  Skipped (already has data or not in DB): {skipped}")
    return updated


# ── Phase 2: API for MOHW clinics ────────────────────
async def fetch_places_info(client: httpx.AsyncClient, name: str, address: str) -> dict:
    query = f"{name} {address[:20]}"

    # Step 1: Find place_id + basic info
    r = await client.get(FIND_PLACE_URL, params={
        "input": query,
        "inputtype": "textquery",
        "fields": "place_id,name,rating,user_ratings_total",
        "language": "zh-TW",
        "key": PLACES_API_KEY,
    })
    data = r.json()

    if data.get("status") != "OK":
        return {"found": False, "status": data.get("status")}

    candidates = data.get("candidates", [])
    if not candidates:
        return {"found": False}

    place = candidates[0]
    place_id     = place.get("place_id")
    rating       = place.get("rating")
    review_count = place.get("user_ratings_total")

    # If rating already in findplacefromtext result, skip detail call
    if rating is not None and review_count is not None:
        return {
            "found": True,
            "place_id": place_id,
            "rating": rating,
            "review_count": review_count,
        }

    # Step 2: Details (only if needed)
    r2 = await client.get(PLACE_DETAIL_URL, params={
        "place_id": place_id,
        "fields": "rating,user_ratings_total",
        "language": "zh-TW",
        "key": PLACES_API_KEY,
    })
    detail = r2.json().get("result", {})
    return {
        "found": True,
        "place_id": place_id,
        "rating": detail.get("rating"),
        "review_count": detail.get("user_ratings_total"),
    }


async def phase2_mohw_api(conn):
    log("\n=== Phase 2: Google Places API for MOHW clinics ===")

    # Load existing cache (for resume capability)
    cache = {}
    if MOHW_CACHE_JSON.exists():
        with open(MOHW_CACHE_JSON, encoding="utf-8") as f:
            cache = json.load(f)
        log(f"  Loaded existing cache: {len(cache)} records")

    # Get MOHW clinics missing Google data
    cur = conn.cursor()
    cur.execute("""
        SELECT id, name, address
        FROM clinics
        WHERE id LIKE 'MOHW_%%' AND google_place_id IS NULL
        ORDER BY id
    """)
    clinics = [{"id": r[0], "name": r[1], "address": r[2] or ""} for r in cur.fetchall()]
    cur.close()

    # Skip already cached
    to_run = [c for c in clinics if c["id"] not in cache or not cache[c["id"]].get("found") is not None]
    # More precise: skip only if already attempted (found or explicit not found)
    to_run = [c for c in clinics if c["id"] not in cache]

    log(f"  MOHW clinics missing Google: {len(clinics)}")
    log(f"  Already cached (from previous run): {len(clinics) - len(to_run)}")
    log(f"  To fetch via API: {len(to_run)}")
    log(f"  Estimated time: ~{len(to_run) * 1.5 / 60:.1f} minutes")

    if len(to_run) == 0:
        log("  Nothing to fetch, all cached. Syncing cache to DB...")
    else:
        log(f"\n  Starting API calls (delay={DELAY_SEC}s between each)...")
        log(f"  Progress reported every {REPORT_EVERY} clinics\n")

    found_count = 0
    not_found   = 0
    errors      = 0

    async with httpx.AsyncClient(timeout=15) as client:
        for i, clinic in enumerate(to_run, 1):
            try:
                info = await fetch_places_info(client, clinic["name"], clinic["address"])
                cache[clinic["id"]] = info

                if info.get("found"):
                    found_count += 1
                else:
                    not_found += 1

                if i % REPORT_EVERY == 0 or i == len(to_run):
                    log(f"  [{i}/{len(to_run)}] Found so far: {found_count} | Not found: {not_found} | Errors: {errors}")
                    # Save cache checkpoint
                    with open(MOHW_CACHE_JSON, "w", encoding="utf-8") as f:
                        json.dump(cache, f, ensure_ascii=False, indent=2)

            except Exception as e:
                cache[clinic["id"]] = {"found": False, "error": str(e)}
                errors += 1
                log(f"  [!!] Error on {clinic['name']}: {e}")

            await asyncio.sleep(DELAY_SEC)

    # Final cache save
    with open(MOHW_CACHE_JSON, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)

    log(f"\n  API phase done. Found: {found_count}, Not found: {not_found}, Errors: {errors}")

    # Sync cache -> DB
    log("\n  Syncing results to DB...")
    cur = conn.cursor()
    db_updated = 0

    for clinic_id, info in cache.items():
        if not info.get("found"):
            continue
        place_id     = info.get("place_id")
        rating       = info.get("rating")
        review_count = info.get("review_count")

        if not place_id:
            continue

        cur.execute("""
            UPDATE clinics
            SET google_place_id     = %s,
                google_rating       = %s,
                google_review_count = %s,
                updated_at          = NOW()
            WHERE id = %s AND google_place_id IS NULL
        """, (place_id, rating, review_count, clinic_id))

        if cur.rowcount > 0:
            db_updated += 1

    conn.commit()
    cur.close()
    log(f"  DB updated: {db_updated} MOHW clinics")
    return found_count, db_updated


async def main():
    log("Google Places Sync\n")

    conn = psycopg2.connect(**DB)
    log("DB connected")

    # Phase 1: Free sync from JSON cache
    p1_updated = phase1_sync_json(conn)

    # Check how many MOHW still need API
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM clinics WHERE id LIKE 'MOHW_%' AND google_place_id IS NULL")
    mohw_remaining = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM clinics WHERE google_place_id IS NOT NULL")
    has_data = cur.fetchone()[0]
    cur.close()

    log(f"\n  After Phase 1: {has_data} clinics have Google data")
    log(f"  MOHW clinics still missing: {mohw_remaining}")

    # Phase 2: API for MOHW
    found_api, db_api = await phase2_mohw_api(conn)

    # Final summary
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM clinics WHERE google_place_id IS NOT NULL")
    final_with_data = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM clinics")
    total = cur.fetchone()[0]
    cur.close()
    conn.close()

    log("\n" + "=" * 60)
    log("  FINAL SUMMARY")
    log("=" * 60)
    log(f"  Phase 1 (JSON sync, free):  {p1_updated} clinics updated")
    log(f"  Phase 2 (API calls):        {db_api} clinics updated")
    log(f"  Total with Google data now: {final_with_data} / {total}")
    log(f"  API calls made (approx):    {found_api + (mohw_remaining - found_api)} calls")
    log("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
