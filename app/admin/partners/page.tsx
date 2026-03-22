"use client";
import { useState } from "react";

const MOCK_PARTNERS = [
  { id: "c001", name: "美佳皮膚科診所", city: "臺北市", status: "active", plan: "Pro", since: "2026-01-15" },
  { id: "c002", name: "書妍診所", city: "臺北市", status: "active", plan: "Enterprise", since: "2026-02-01" },
  { id: "c003", name: "南京安濱診所", city: "臺北市", status: "pending", plan: "Basic", since: "2026-03-10" },
  { id: "c004", name: "華漾皮膚專科診所", city: "臺北市", status: "inactive", plan: "Basic", since: "2025-12-01" },
];

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  active:   { label: "開通中", bg: "#F0FDF4", color: "#16A34A" },
  pending:  { label: "審核中", bg: "#FAEEDA", color: "#854F0B" },
  inactive: { label: "已停用", bg: "#F1F5F9", color: "#5F5E5A" },
};

export default function PartnersPage() {
  const [filter, setFilter] = useState<"all"|"active"|"pending"|"inactive">("all");
  const filtered = MOCK_PARTNERS.filter(p => filter === "all" || p.status === filter);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>合作診所管理</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 20 }}>管理合作診所的開通、停用與前台曝光設定（Phase 2 串接 AIMS 方案狀態）</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["all","active","pending","inactive"] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #E2E8F0", background: filter === s ? "#0F172A" : "#fff", color: filter === s ? "#fff" : "#475569", fontSize: 13, cursor: "pointer", fontWeight: filter === s ? 600 : 400 }}>
            {s === "all" ? "全部" : STATUS_MAP[s].label}
          </button>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: "#F8FAFC" }}>
            <tr>
              {["診所名稱","縣市","方案","狀態","合作起始","操作"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748B", fontWeight: 600, borderBottom: "1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const s = STATUS_MAP[p.status];
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0F172A" }}>{p.name}</td>
                  <td style={{ padding: "12px 16px", color: "#475569" }}>{p.city}</td>
                  <td style={{ padding: "12px 16px", color: "#475569" }}>{p.plan}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s.label}</span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#475569" }}>{p.since}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ padding: "4px 12px", background: "#F0FDF4", color: "#16A34A", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 500 }}>編輯</button>
                      <button style={{ padding: "4px 12px", background: p.status === "active" ? "#FEF2F2" : "#F0FDF4", color: p.status === "active" ? "#DC2626" : "#16A34A", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                        {p.status === "active" ? "停用" : "開通"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
