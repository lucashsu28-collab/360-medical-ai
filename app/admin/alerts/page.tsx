"use client";
import { useState } from "react";

const MOCK_ALERTS = [
  { id: 1, type: "crawler", level: "error", title: "爬蟲執行失敗", desc: "Google Places 爬蟲於 03/20 02:15 執行失敗，錯誤：API quota exceeded", time: "2026-03-20 02:15" },
  { id: 2, type: "data", level: "warning", title: "資料異常警示", desc: "美佳皮膚科診所評分異常變動（8.2 → 3.1），請確認", time: "2026-03-19 14:30" },
  { id: 3, type: "system", level: "info", title: "系統正常", desc: "Cloud Run 服務運行正常，所有 API 回應時間 < 500ms", time: "2026-03-22 09:00" },
];

const LEVEL_MAP: Record<string, { bg: string; color: string; label: string }> = {
  error:   { bg: "#FEF2F2", color: "#DC2626", label: "錯誤" },
  warning: { bg: "#FAEEDA", color: "#854F0B", label: "警告" },
  info:    { bg: "#E1F5EE", color: "#0F6E56", label: "正常" },
};

export default function AlertsPage() {
  const [threshold, setThreshold] = useState({ crawler: true, data: true, system: false });

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>告警系統</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>爬蟲失敗、資料異常、Cloud Run 異常通知（Email/LINE 推播於 Phase 2 開放）</p>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 500px" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 16 }}>告警記錄</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {MOCK_ALERTS.map(alert => {
              const s = LEVEL_MAP[alert.level];
              return (
                <div key={alert.id} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", borderLeft: `4px solid ${s.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{s.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{alert.title}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#94A3B8" }}>{alert.time}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>{alert.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ flex: "1 1 240px" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 16 }}>告警閾值設定</h2>
          <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            {([["crawler","爬蟲失敗通知"],["data","資料異常警示"],["system","系統狀態通知"]] as const).map(([key, label]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F1F5F9" }}>
                <span style={{ fontSize: 14, color: "#0F172A" }}>{label}</span>
                <button onClick={() => setThreshold(t => ({ ...t, [key]: !t[key] }))}
                  style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: threshold[key] ? "#3B82F6" : "#E2E8F0", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                  <span style={{ position: "absolute", top: 2, left: threshold[key] ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </button>
              </div>
            ))}
            <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 12 }}>Email/LINE 推播通知於 Phase 2 開放</p>
          </div>
        </div>
      </div>
    </div>
  );
}
