# -*- coding: utf-8 -*-
"""
Recalculate all clinic scores to 100-point system:
  合法登記  20 pts  (all DB clinics = legally registered = 20)
  Google評分 20 pts  (stars 0-15 + review count 0-5)
  司法糾紛  20 pts  (from dispute_count, or 20 if unknown)
  新聞媒體  20 pts  (placeholder – 建置中)
  社群討論  20 pts  (placeholder – 建置中)
  Total:   100 pts
"""
import sys, codecs, json, psycopg2
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

DB = dict(host='34.81.74.228', port=5432, dbname='medical_ai',
          user='postgres', password='Medical360@2026', connect_timeout=15)


# ---------- Scoring Rules ----------

def calc_legal(legal_score_raw):
    """全部在DB的診所皆已合法登記 → 20分"""
    return 20.0


def calc_google(rating, review_count):
    """Google評分 = 星等分(0-15) + 則數分(0-5)"""
    if rating is None:
        star_pts = 0
    elif rating >= 4.5:
        star_pts = 15
    elif rating >= 4.0:
        star_pts = 12
    elif rating >= 3.5:
        star_pts = 9
    elif rating >= 3.0:
        star_pts = 6
    else:
        star_pts = 3

    if review_count is None:
        rev_pts = 0
    elif review_count >= 1000:
        rev_pts = 5
    elif review_count >= 500:
        rev_pts = 4
    elif review_count >= 100:
        rev_pts = 3
    elif review_count >= 1:
        rev_pts = 2
    else:
        rev_pts = 0

    return float(star_pts + rev_pts)


def calc_judicial(dispute_count):
    """司法糾紛分數"""
    if dispute_count is None:
        return 20.0    # 未知 → 預設無糾紛 → 滿分
    elif dispute_count == 0:
        return 20.0
    elif dispute_count == 1:
        return 15.0
    elif dispute_count == 2:
        return 10.0
    elif dispute_count == 3:
        return 5.0
    else:
        return 0.0


# -----------------------------------

def main():
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM clinics")
    total = cur.fetchone()[0]
    print(f"Total clinics: {total}")

    cur.execute("""
        SELECT id, legal_score, judicial_score, dispute_count,
               google_rating, google_review_count, score_breakdown
        FROM clinics
        ORDER BY id
    """)
    rows = cur.fetchall()

    updated = 0
    score_dist = {}

    for (cid, legal_score_raw, judicial_score_raw, dispute_count,
         google_rating, google_review_count, breakdown_raw) in rows:

        breakdown = breakdown_raw if isinstance(breakdown_raw, dict) else {}

        legal   = calc_legal(legal_score_raw)
        google  = calc_google(google_rating, google_review_count)
        judicial = calc_judicial(dispute_count)
        media   = 20.0
        social  = 20.0

        total_score = legal + google + judicial + media + social

        new_breakdown = {
            **breakdown,          # keep any existing keys
            "legal":    legal,
            "google":   google,
            "judicial": judicial,
            "media":    media,
            "social":   social,
        }

        cur.execute("""
            UPDATE clinics
            SET score          = %s,
                legal_score    = %s,
                judicial_score = %s,
                score_breakdown = %s,
                updated_at     = NOW()
            WHERE id = %s
        """, (
            total_score,
            legal,
            judicial,
            json.dumps(new_breakdown, ensure_ascii=False),
            cid,
        ))
        updated += 1

        bucket = int(total_score // 10) * 10
        score_dist[bucket] = score_dist.get(bucket, 0) + 1

    conn.commit()
    cur.close()
    conn.close()

    print(f"\nUpdated: {updated} clinics")
    print(f"\nScore distribution (10-pt buckets):")
    for bucket in sorted(score_dist.keys(), reverse=True):
        bar = '#' * (score_dist[bucket] // 10)
        print(f"  {bucket:>3}-{bucket+9:<3}: {score_dist[bucket]:>4}  {bar}")

    print(f"\nSample breakdown logic:")
    print(f"  合法登記: 20 (all registered)")
    print(f"  Google:   0-20 (stars 0-15 + reviews 0-5)")
    print(f"  司法:     20 (dispute_count=null → assume 0)")
    print(f"  媒體:     20 (placeholder)")
    print(f"  社群:     20 (placeholder)")
    print(f"  Max score: 100")
    print(f"\nDone.")


if __name__ == "__main__":
    main()
