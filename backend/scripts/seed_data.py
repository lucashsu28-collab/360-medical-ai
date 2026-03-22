import json
import os
import sys
from pathlib import Path

# 確認 clinics_real.json 在 Cloud Run 上的路徑
path = Path(__file__).resolve().parent.parent / "data" / "clinics_real.json"
if path.exists():
    data = json.loads(path.read_text(encoding="utf-8"))
    print(f"✓ clinics_real.json 存在，共 {len(data)} 筆")
else:
    print(f"✗ 找不到 {path}")
    sys.exit(1)
