# -*- coding: utf-8 -*-
import sys, codecs, psycopg2
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

conn = psycopg2.connect(host='34.81.74.228', port=5432, dbname='medical_ai',
                        user='postgres', password='Medical360@2026')
cur = conn.cursor()

cur.execute("""
    CREATE TABLE IF NOT EXISTS clinic_reviews (
        id           SERIAL PRIMARY KEY,
        clinic_id    VARCHAR NOT NULL,
        author_name  VARCHAR,
        rating       INTEGER,
        text         TEXT,
        time         BIGINT,
        relative_time VARCHAR,
        created_at   TIMESTAMP DEFAULT NOW()
    );
""")
cur.execute("""
    CREATE INDEX IF NOT EXISTS ix_clinic_reviews_clinic_id
    ON clinic_reviews (clinic_id);
""")
conn.commit()

# Verify
cur.execute("""
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'clinic_reviews'
    ORDER BY ordinal_position;
""")
cols = cur.fetchall()
print("clinic_reviews table columns:")
for c in cols:
    print(f"  {c[0]:<20} {c[1]}")

cur.execute("SELECT indexname FROM pg_indexes WHERE tablename='clinic_reviews'")
idxs = cur.fetchall()
print(f"\nIndexes: {[i[0] for i in idxs]}")

cur.close()
conn.close()
print("\nDone.")
