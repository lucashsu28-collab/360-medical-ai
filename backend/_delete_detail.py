# -*- coding: utf-8 -*-
import sys, codecs, psycopg2
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

DB = dict(host='34.81.74.228',port=5432,dbname='medical_ai',
          user='postgres',password='Medical360@2026',connect_timeout=15)
conn = psycopg2.connect(**DB)
cur = conn.cursor()

AESTHETIC_NAME_KW = ['醫美', '整形', '美容', '皮膚', '雷射', '微整', '抗老', '拉皮']

def has_aesthetic_name(name):
    return any(kw in str(name) for kw in AESTHETIC_NAME_KW)

# 1. NULL specialty - 拆分「應刪」vs「應保留」
print("=== NULL specialty (77 筆) 分析 ===")
cur.execute("SELECT id, name FROM clinics WHERE specialty IS NULL ORDER BY name")
null_rows = cur.fetchall()
null_keep = [(r[0], r[1]) for r in null_rows if has_aesthetic_name(r[1])]
null_del   = [(r[0], r[1]) for r in null_rows if not has_aesthetic_name(r[1])]
print(f"  -> 名稱含醫美關鍵字（建議保留）: {len(null_keep)} 筆")
for r in null_keep[:5]: print(f"       {r[1]}")
print(f"  -> 名稱無醫美關鍵字（建議刪除）: {len(null_del)} 筆")
for r in null_del[:5]: print(f"       {r[1]}")

# 2. 不分科 - 拆分
print("\n=== 不分科 (30 筆) 分析 ===")
cur.execute("SELECT id, name FROM clinics WHERE specialty = '不分科' ORDER BY name")
rows = cur.fetchall()
keep = [(r[0], r[1]) for r in rows if has_aesthetic_name(r[1])]
dele = [(r[0], r[1]) for r in rows if not has_aesthetic_name(r[1])]
print(f"  -> 建議保留（名稱含醫美）: {len(keep)} 筆")
for r in keep[:5]: print(f"       {r[1]}")
print(f"  -> 建議刪除: {len(dele)} 筆")
for r in dele[:5]: print(f"       {r[1]}")

# 3. 外科（純）
print("\n=== 純外科 (4 筆) ===")
cur.execute("SELECT id, name FROM clinics WHERE specialty = '外科'")
for r in cur.fetchall():
    tag = '[保留]' if has_aesthetic_name(r[1]) else '[刪除]'
    print(f"  {tag} {r[1]}")

# 4. 婦產科
print("\n=== 婦產科 (2 筆) ===")
cur.execute("SELECT id, name FROM clinics WHERE specialty = '婦產科'")
for r in cur.fetchall():
    tag = '[保留]' if has_aesthetic_name(r[1]) else '[刪除]'
    print(f"  {tag} {r[1]}")

# 5. 家醫科,婦產科
print("\n=== 家醫科,婦產科 (1 筆) ===")
cur.execute("SELECT id, name FROM clinics WHERE specialty = '家醫科,婦產科'")
for r in cur.fetchall():
    tag = '[保留]' if has_aesthetic_name(r[1]) else '[刪除]'
    print(f"  {tag} {r[1]}")

# Summary: proposed final delete list
print("\n" + "=" * 60)
print("=== 建議刪除方案 ===")
print("=" * 60)

# Definite deletes: dental
cur.execute("""
    SELECT COUNT(*) FROM clinics WHERE 
    specialty LIKE '%牙%' OR specialty LIKE '%齒%' OR specialty LIKE '%口腔%'
""")
dental_cnt = cur.fetchone()[0]
print(f"牙科類（全刪）:        {dental_cnt} 筆")

# NULL with non-aesthetic name
print(f"NULL科別+非醫美名稱:   {len(null_del)} 筆")

# 不分科 with non-aesthetic name
print(f"不分科+非醫美名稱:     {len(dele)} 筆")

# Others: 精神科, 兒科, 眼科
cur.execute("SELECT COUNT(*) FROM clinics WHERE specialty IN ('精神科','兒科','眼科','婦產科')")
other_cnt = cur.fetchone()[0]
print(f"其他非醫美（精/兒/眼/婦）: {other_cnt} 筆")

total_del = dental_cnt + len(null_del) + len(dele) + other_cnt
print(f"\n合計建議刪除: {total_del} 筆")

cur.execute("SELECT COUNT(*) FROM clinics")
total = cur.fetchone()[0]
print(f"刪除後DB剩餘: {total - total_del} 筆")
print()
print("[!] 以下特別保留（不刪）:")
print(f"    名媛芭比 (西醫一般科) - 已確認為醫美診所")
print(f"    外科含醫美名稱 - 如佳飛雅醫美診所")
print(f"    家醫科,婦產科 含醫美名稱 - 樂活醫美診所")
print(f"    NULL+醫美名稱 - {len(null_keep)} 筆")
print(f"    不分科+醫美名稱 - {len(keep)} 筆")

cur.close(); conn.close()
