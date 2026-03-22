"""
從 JSON 檔案將歷史資料匯入 PostgreSQL
執行方式：
  cd ~/360-medical-ai/backend
  python3 scripts/migrate_json_to_pg.py
"""
import json
import sys
from pathlib import Path

import psycopg2

DB_CONFIG = dict(
    host="34.81.74.228",
    port=5432,
    dbname="medical_ai",
    user="postgres",
    password="Medical360@2026",
)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def load(filename, default=None):
    p = DATA_DIR / filename
    if not p.exists():
        print(f"  ⚠ {filename} 不存在，略過")
        return default or []
    data = json.loads(p.read_text(encoding="utf-8"))
    print(f"  ✓ {filename} 讀取 {len(data)} 筆")
    return data


def migrate_clinics(cur):
    print("\n[1/4] clinics_real.json → clinics")
    data = load("clinics_real.json", [])
    ok = skip = 0
    for r in data:
        sb = r.get("score_breakdown") or {}
        try:
            cur.execute("""
                INSERT INTO clinics (
                    id, name, address, phone, specialty, website,
                    google_rating, google_review_count, google_place_id,
                    score, legal_score, judicial_score, google_rating_score,
                    score_breakdown, dispute_count, is_partner, custom_note,
                    created_at, updated_at
                ) VALUES (
                    %s,%s,%s,%s,%s,%s,
                    %s,%s,%s,
                    %s,%s,%s,%s,
                    %s,%s,%s,%s,
                    NOW(),NOW()
                ) ON CONFLICT (id) DO NOTHING
            """, (
                r.get("id"), r.get("name"), r.get("address"),
                r.get("phone"), r.get("specialty"), r.get("website"),
                r.get("google_rating"), r.get("google_review_count"), r.get("google_place_id"),
                r.get("score"), r.get("legal_score"), r.get("judicial_score"), r.get("google_rating_score"),
                json.dumps(sb, ensure_ascii=False) if sb else None,
                r.get("dispute_count"), r.get("isPartner", False), r.get("custom_note"),
            ))
            ok += 1
        except Exception as e:
            print(f"    skip {r.get('id')}: {e}")
            skip += 1
    print(f"  → 匯入 {ok} 筆，略過 {skip} 筆")


def migrate_unlocks(cur):
    print("\n[2/4] unlock_records.json → unlock_records")
    data = load("unlock_records.json", [])
    ok = skip = 0
    for r in data:
        try:
            cur.execute("""
                INSERT INTO unlock_records (id, time, user_id, target_name, unlock_type)
                VALUES (%s,%s,%s,%s,%s)
                ON CONFLICT (id) DO NOTHING
            """, (
                r.get("id"), r.get("time"),
                r.get("user_id"), r.get("target_name"), r.get("unlock_type"),
            ))
            ok += 1
        except Exception as e:
            print(f"    skip {r.get('id')}: {e}")
            skip += 1
    print(f"  → 匯入 {ok} 筆，略過 {skip} 筆")


def migrate_broadcasts(cur):
    print("\n[3/4] broadcast_records.json → broadcast_records")
    data = load("broadcast_records.json", [])
    ok = skip = 0
    for r in data:
        try:
            cur.execute("""
                INSERT INTO broadcast_records (id, sent_at, user_id, message_type, target_name, status)
                VALUES (%s,%s,%s,%s,%s,%s)
                ON CONFLICT (id) DO NOTHING
            """, (
                r.get("id"), r.get("sent_at"),
                r.get("user_id"), r.get("message_type"),
                r.get("target_name"), r.get("status", "success"),
            ))
            ok += 1
        except Exception as e:
            print(f"    skip {r.get('id')}: {e}")
            skip += 1
    print(f"  → 匯入 {ok} 筆，略過 {skip} 筆")


def migrate_crawler_status(cur):
    print("\n[4/4] crawler_status.json → crawler_status")
    data = load("crawler_status.json", {})
    ok = skip = 0
    if isinstance(data, dict):
        items = data.items()
    else:
        print("  ⚠ 格式不符，略過")
        return
    for key, val in items:
        try:
            cur.execute("""
                INSERT INTO crawler_status (key, last_run, status, error)
                VALUES (%s,%s,%s,%s)
                ON CONFLICT (key) DO UPDATE SET
                    last_run = EXCLUDED.last_run,
                    status = EXCLUDED.status
            """, (
                key,
                val.get("last_run"),
                val.get("status", "unknown"),
                val.get("error"),
            ))
            ok += 1
        except Exception as e:
            print(f"    skip {key}: {e}")
            skip += 1
    print(f"  → 匯入 {ok} 筆，略過 {skip} 筆")


def main():
    print("=== JSON → PostgreSQL 資料遷移 ===")
    print(f"目標 DB: {DB_CONFIG['host']}/{DB_CONFIG['dbname']}")

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False
        cur = conn.cursor()
        print("✓ 資料庫連線成功\n")
    except Exception as e:
        print(f"✗ 連線失敗: {e}")
        sys.exit(1)

    try:
        migrate_clinics(cur)
        migrate_unlocks(cur)
        migrate_broadcasts(cur)
        migrate_crawler_status(cur)
        conn.commit()
        print("\n✅ 所有資料遷移完成！")
    except Exception as e:
        conn.rollback()
        print(f"\n✗ 遷移失敗，已回滾: {e}")
        sys.exit(1)
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
