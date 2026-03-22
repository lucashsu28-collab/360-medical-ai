"use client";
import { useState } from "react";

const DEFAULT_WEIGHTS = {
  google:     { label: "Google 評分", icon: "⭐", max: 10, desc: "Google Maps 評分換算（5星=10分）" },
  judicial:   { label: "司法案件",   icon: "⚖️", max: 10, desc: "司法院裁判書數量扣分（0件=10分，每件-2分）" },
  legal:      { label: "合法登記",   icon: "🏛️", max: 10, desc: "衛福部健保署登記狀態（登記=10分）" },
  punishment: { label: "行政處分",   icon: "🚨", max: 10, desc: "衛福部行政裁處（0件=10分，每件-3分）" },
  news:       { label: "新聞媒體",   icon: "📰", max: 10, desc: "新聞NLP情緒分析（正面加分/負面扣分）" },
  social:     { label: "社群討論",   icon: "💬", max: 10, desc: "PTT/Dcard 社群口碑分析" },
};

type WeightKey = keyof typeof DEFAULT_WEIGHTS;
type WeightItem = { label: string; icon: string; max: number; desc: string };

export default function ScoringPage() {
  const [weights, setWeights] = useState<Record<WeightKey, WeightItem>>(DEFAULT_WEIGHTS);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>評分規則管理</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>調整各維度權重與扣分規則，免改程式碼（Phase 2 串接後台 DB 後生效）</p>

      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 20 }}>六維度權重設定</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {(Object.entries(weights) as [WeightKey, WeightItem][]).map(([key, item]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", background: "#F8FAFC", borderRadius: 10 }}>
              <div style={{ fontSize: 24, width: 32, textAlign: "center" }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>{item.desc}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: "#94A3B8" }}>滿分</span>
                <input type="number" min={0} max={20} value={item.max}
                  onChange={e => setWeights(w => ({ ...w, [key]: { ...w[key], max: Number(e.target.value) } }))}
                  style={{ width: 60, padding: "6px 10px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, textAlign: "center" }} />
                <span style={{ fontSize: 12, color: "#94A3B8" }}>分</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={handleSave}
            style={{ padding: "10px 24px", background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {saved ? "已儲存 ✓" : "儲存設定"}
          </button>
        </div>
      </div>

      <div style={{ background: "#FAEEDA", borderRadius: 12, padding: 16, fontSize: 13, color: "#854F0B" }}>
        ⚠️ 目前為 mock 介面，設定不會實際影響評分。Phase 2 串接後台 DB 後正式生效。
      </div>
    </div>
  );
}
