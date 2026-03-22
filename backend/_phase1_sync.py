# -*- coding: utf-8 -*-
import sys, codecs, json, pathlib, psycopg2
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

DB = dict(host='34.81.74.228', port=5432, dbname='medical_ai',
          user='postgres', password='Medical360@2026', connect_timeout=15)
PLACES_JSON = pathlib.Path('data/places_results.json')

conn = psycopg2.connect(**DB)
cache = json.load(open(PLACES_JSON, encoding='utf-8'))
found_records = {k: v for k, v in cache.items() if v.get('found')}
print(f'Cache: {len(cache)} total, {len(found_records)} with Google data')

cur = conn.cursor()
updated = 0
for clinic_id, info in found_records.items():
    place_id     = info.get('place_id')
    rating       = info.get('rating')
    review_count = info.get('review_count')
    if not place_id:
        continue
    cur.execute(
        'UPDATE clinics SET google_place_id=%s, google_rating=%s, google_review_count=%s, updated_at=NOW() WHERE id=%s AND google_place_id IS NULL',
        (place_id, rating, review_count, clinic_id)
    )
    if cur.rowcount > 0:
        updated += 1

conn.commit()

cur.execute('SELECT COUNT(*) FROM clinics WHERE google_place_id IS NOT NULL')
has_data = cur.fetchone()[0]

mohw_like = 'MOHW_%'
cur.execute('SELECT COUNT(*) FROM clinics WHERE google_place_id IS NULL AND id LIKE %s', (mohw_like,))
mohw_null = cur.fetchone()[0]

cur.execute('SELECT COUNT(*) FROM clinics WHERE google_place_id IS NULL')
total_null = cur.fetchone()[0]

print(f'Phase 1 done: {updated} clinics updated from JSON cache')
print(f'Now with Google data: {has_data}')
print(f'MOHW still missing Google: {mohw_null}')
print(f'All still missing Google: {total_null}')
cur.close()
conn.close()
