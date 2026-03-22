"use client";
import { useState } from "react";

export default function ExportPage() {
  const [exporting, setExporting] = useState<string|null>(null);

  const handleExport = (type: string) => {
    setExporting(type);
    setTimeout(() => setExporting(null), 2000);
  };

  const items = [
    { key: "clinics_csv", icon: "🏥", title: "診所清單 CSV", desc: "匯出全部 904 家診所資料，含六維度分數、地址、電話", badge: "904 筆" },
    { key: "doctors_csv", icon: "👨‍⚕️", title: "醫師清單 CSV", desc: "匯出衛福部查詢過的醫師資料", badge: "依查詢" },
    { key: "unlocks_csv", icon: "🔓", title: "解鎖記錄 CSV", desc: "匯出所有報告解鎖記錄，含 LINE User ID、診所名稱、時間", badge: "全部" },
    { key: "clinic_pdf", icon: "📄", title: "單一診所完整報告 PDF", desc: "選擇診所後匯出含六維度分析的完整評鑑報告", badge: "Phase 2" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>資料匯出</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>匯出診所、醫師、解鎖記錄等資料（PDF 匯出於 Phase 2 開放）</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {items.map(item => (
          <div key={item.key} style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ fontSize: 32 }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>{item.title}</h3>
                <span style={{ background: "#F1F5F9", color: "#64748B", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{item.badge}</span>
              </div>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>{item.desc}</p>
            </div>
            <button
              onClick={() => handleExport(item.key)}
              disabled={item.badge === "Phase 2" || exporting === item.key}
              style={{ padding: "9px 20px", background: item.badge === "Phase 2" ? "#F1F5F9" : "#3B82F6", color: item.badge === "Phase 2" ? "#94A3B8" : "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: item.badge === "Phase 2" ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
              {exporting === item.key ? "匯出中..." : item.badge === "Phase 2" ? "即將開放" : "匯出"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
