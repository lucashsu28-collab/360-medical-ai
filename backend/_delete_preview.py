# -*- coding: utf-8 -*-
import sys, codecs, psycopg2
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

DB = dict(host='34.81.74.228',port=5432,dbname='medical_ai',
          user='postgres',password='Medical360@2026',connect_timeout=15)

KEEP_KEYWORDS = ['皮膚科', '整形外科', '醫學美容', '美容外科', '復健科']

conn = psycopg2.connect(**DB)
cur = conn.cursor()

# Build WHERE for "no aesthetic keyword"
where_no_aesthetic = " AND ".join(
    [f"(specialty NOT LIKE '%{kw}%' OR specialty IS NULL)" for kw in KEEP_KEYWORDS]
)

# Count to delete
cur.execute(f"SELECT COUNT(*) FROM clinics WHERE {where_no_aesthetic}")
delete_total = cur.fetchone()[0]

# Count to keep
cur.execute(f"SELECT COUNT(*) FROM clinics WHERE NOT ({where_no_aesthetic})")
keep_total = cur.fetchone()[0]

print("=== 清除預覽 ===")
print(f"保留 (含醫美科別): {keep_total} 筆")
print(f"刪除 (無醫美科別): {delete_total} 筆")
print()

# Breakdown of what will be deleted
cur.execute(f"""
    SELECT specialty, COUNT(*) as cnt, 
           array_agg(name ORDER BY name) as samples
    FROM clinics
    WHERE {where_no_aesthetic}
    GROUP BY specialty
    ORDER BY cnt DESC
""")
rows = cur.fetchall()
print(f"{'科別':<35} {'筆數':>5}  範例名稱")
print("-" * 80)
for r in rows:
    spec = str(r[0]) if r[0] else '(NULL)'
    cnt = r[1]
    samples = r[2][:2] if r[2] else []
    sample_str = ', '.join(samples)[:40]
    print(f"  {spec:<33} {cnt:>5}  {sample_str}")

print()
# Special case check: 名媛芭比
cur.execute("SELECT id, name, specialty FROM clinics WHERE id = 'MOHW_350102C192'")
barbie = cur.fetchone()
if barbie:
    print(f"[!] 注意: 名媛芭比.時尚醫美診所 (id={barbie[0]}) specialty='{barbie[2]}'")
    print(f"    -> 會被刪除！需要特別保留。")

# Source of dental clinics
print()
print("=== 牙科來源分析 ===")
cur.execute("""
    SELECT 
      CASE WHEN id LIKE 'MOHW_%' THEN 'MOHW新增' ELSE '原始NHI' END as source,
      COUNT(*) as cnt
    FROM clinics 
    WHERE specialty LIKE '%牙%' OR specialty LIKE '%齒%' OR specialty LIKE '%口腔%'
    GROUP BY source
""")
for r in cur.fetchall():
    print(f"  {r[0]}: {r[1]} 筆")

cur.close(); conn.close()
