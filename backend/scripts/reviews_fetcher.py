import psycopg2
import requests
import time

PLACES_API_KEY = "AIzaSyCarq1kOV9dxLD6yJURAuLZHQLi-CpiE6c"
DB_CONFIG = {
    "host": "34.81.74.228",
    "dbname": "medical_ai",
    "user": "postgres",
    "password": "Medical360@2026"
}

def fetch_reviews(place_id):
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "fields": "reviews",
        "language": "zh-TW",
        "key": PLACES_API_KEY
    }
    res = requests.get(url, params=params)
    data = res.json()
    reviews = data.get("result", {}).get("reviews", [])
    return reviews[:5]

def run():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("SELECT id, google_place_id FROM clinics WHERE google_place_id IS NOT NULL AND google_place_id != ''")
    clinics = cur.fetchall()
    print(f"Total clinics: {len(clinics)}")
    cur.execute("DELETE FROM clinic_reviews")
    conn.commit()
    success = 0
    failed = 0
    for i, (clinic_id, place_id) in enumerate(clinics):
        try:
            reviews = fetch_reviews(place_id)
            for r in reviews:
                cur.execute(
                    "INSERT INTO clinic_reviews (clinic_id, author_name, rating, text, time, relative_time) VALUES (%s, %s, %s, %s, %s, %s)",
                    (clinic_id, r.get("author_name",""), r.get("rating"), r.get("text",""), r.get("time"), r.get("relative_time_description",""))
                )
            conn.commit()
            success += 1
            if i % 50 == 0:
                print(f"Progress: {i}/{len(clinics)} success={success} failed={failed}")
            time.sleep(0.1)
        except Exception as e:
            failed += 1
            print(f"Failed {clinic_id}: {e}")
            continue
    cur.close()
    conn.close()
    print(f"Done. success={success} failed={failed}")

if __name__ == "__main__":
    run()