"""Test with first 5 clinics only"""
import sys, codecs
import psycopg2, requests, time
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

PLACES_API_KEY = "AIzaSyCarq1kOV9dxLD6yJURAuLZHQLi-CpiE6c"
DB_CONFIG = {"host": "34.81.74.228", "dbname": "medical_ai",
             "user": "postgres", "password": "Medical360@2026"}

def fetch_reviews(place_id):
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {"place_id": place_id, "fields": "reviews",
              "language": "zh-TW", "key": PLACES_API_KEY}
    res = requests.get(url, params=params, timeout=10)
    data = res.json()
    status = data.get("status")
    reviews = data.get("result", {}).get("reviews", [])
    return status, reviews[:5]

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()
cur.execute("SELECT id, google_place_id FROM clinics WHERE google_place_id IS NOT NULL LIMIT 5")
clinics = cur.fetchall()

print(f"Testing {len(clinics)} clinics...\n")
for clinic_id, place_id in clinics:
    status, reviews = fetch_reviews(place_id)
    print(f"  [{clinic_id}] status={status} reviews={len(reviews)}")
    if reviews:
        r = reviews[0]
        print(f"    Sample: {r.get('author_name','')} ★{r.get('rating')} {r.get('text','')[:40]}")
    time.sleep(0.2)

cur.close(); conn.close()
print("\nTest done.")
