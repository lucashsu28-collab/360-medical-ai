"use client";
import { useState, useEffect, useCallback } from "react";

interface Partner {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  specialty: string | null;
  is_partner: boolean;
  google_rating: number | null;
  score: number | null;
  created_at: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function cityFromAddress(address: string | null): string {
  if (!address) return "—";
  const m = address.match(/^(.*?[市縣])/);
  return m ? m[1] : address.slice(0, 3);
}

function formatDate(s: string | null): string {
  if (!s) return "—";
  return s.slice(0, 10);
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API_URL}/api/admin/partners`, {
      headers: { "x-admin-token": localStorage.getItem("admin_token") || "" },
    })
      .then(r => r.json())
      .then(d => setPartners(d.partners ?? []))
      .catch(() => setPartners([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = partners.filter(p =>
    filter === "all" ? true : filter === "active" ? p.is_partner : !p.is_partner
  );

  async function handleToggle(id: string) {
    setToggling(id);
    try {
      const res = await fetch(`${API_URL}/api/admin/partners/${id}/toggle`, {
        method: "PATCH",
        headers: { "x-admin-token": localStorage.getItem("admin_token") || "" },
      });
      const data = await res.json();
      if (data.ok) {
        setPartners(prev => prev.map(p => p.id === id ? { ...p, is_partner: data.is_partner } : p));
      }
    } catch {
      // silent
    } finally {
      setToggling(null);
    }
  }

  const th = (label: string) => (
    <th key={label} style={{ padding: "12px 16px", textAlign: "left", color: "#64748B", fontWeight: 600, borderBottom: "1px solid #E2E8F0", fontSize: 13, whiteSpace: "nowrap" }}>
      {label}
    </th>
  );
  const td = (children: React.ReactNode, extra?: React.CSSProperties) => (
    <td style={{ padding: "12px 16px", color: "#475569", fontSize: 13, ...extra }}>{children}</td>
  );

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>合作診所</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 12 }}>合作診所唯讀儀表板，唯一操作為開通/停用。</p>

      {/* 提示 */}
      <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#1E40AF" }}>
        📋 診所資料編輯請至 <strong>AIMS 客戶管理</strong>，本頁面僅供狀態查閱與開通/停用操作。
      </div>

      {/* 篩選 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {([["all","全部"],["active","開通中"],["inactive","已停用"]] as const).map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #E2E8F0", background: filter === val ? "#0F172A" : "#fff", color: filter === val ? "#fff" : "#475569", fontSize: 13, cursor: "pointer", fontWeight: filter === val ? 600 : 400 }}>
            {label}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#94A3B8", alignSelf: "center" }}>
          共 {filtered.length} 家
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#94A3B8", padding: 40 }}>載入中…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", color: "#94A3B8", padding: 40 }}>目前無合作診所</div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#F8FAFC" }}>
              <tr>
                {["診所名稱","地區/專科","Google評分","綜合評分","AIMS方案","平台費用","繳費狀態","加入日期","狀態","操作"].map(h => th(h))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  {td(<span style={{ fontWeight: 600, color: "#0F172A" }}>{p.name}</span>)}
                  {td(`${cityFromAddress(p.address)}${p.specialty ? ` · ${p.specialty}` : ""}`)}
                  {td(p.google_rating != null ? `⭐ ${p.google_rating.toFixed(1)}` : "—")}
                  {td(p.score != null ? p.score.toFixed(1) : "—")}
                  {td("—", { color: "#CBD5E1" })}
                  {td("—", { color: "#CBD5E1" })}
                  {td("—", { color: "#CBD5E1" })}
                  {td(formatDate(p.created_at))}
                  {td(
                    <span style={{
                      background: p.is_partner ? "#F0FDF4" : "#F1F5F9",
                      color: p.is_partner ? "#16A34A" : "#5F5E5A",
                      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    }}>
                      {p.is_partner ? "開通中" : "已停用"}
                    </span>
                  )}
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      disabled={toggling === p.id}
                      onClick={() => handleToggle(p.id)}
                      style={{
                        padding: "4px 14px",
                        background: p.is_partner ? "#FEF2F2" : "#F0FDF4",
                        color: p.is_partner ? "#DC2626" : "#16A34A",
                        border: "none", borderRadius: 6, fontSize: 12,
                        cursor: toggling === p.id ? "not-allowed" : "pointer",
                        fontWeight: 500, opacity: toggling === p.id ? 0.6 : 1,
                      }}
                    >
                      {toggling === p.id ? "…" : p.is_partner ? "停用" : "開通"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
