"""
P2-6: 醫療廣告合規關鍵字過濾
依據衛福部醫療廣告法規，禁止使用誇大療效、保證字眼。
"""
import re

BANNED_WORDS = [
    # 療效保證類
    "保證", "絕對", "一定有效", "必定", "百分之百", "100%",
    # 最高級類
    "最好", "最佳", "第一名", "唯一", "No.1", "no.1", "NO.1",
    # 誇大字眼
    "神奇", "奇蹟", "完全根治", "永久根治", "永遠有效",
    # 特定療效承諾
    "完全消除", "完全去除", "永不復發",
]

BANNED_PATTERNS = [
    r"瘦\d+公斤",
    r"年輕\d+歲",
    r"消除\d+%",
    r"去除\d+%",
    r"縮小\d+%",
    r"效果\d+倍",
    r"快\d+倍",
]


def check_compliance(text: str) -> list[str]:
    """
    回傳違規原因列表，空列表代表通過合規檢查。
    """
    reasons = []
    text_lower = text.lower()
    for word in BANNED_WORDS:
        if word.lower() in text_lower:
            reasons.append(f"包含禁用詞：{word}")
    for pattern in BANNED_PATTERNS:
        if re.search(pattern, text):
            reasons.append(f"包含禁用表達：{pattern}")
    return reasons
