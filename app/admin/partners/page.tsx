"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Partner {
  id: string; name: string; address: string | null; phone: string | null;
  specialty: string | null; is_partner: boolean; google_rating: number | null;
  score: number | null; created_at: string | null;
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
  const [loading, setLoading] = useState(true);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token") || "";
      const res = await fetch(`${API_URL}/api/admin/partners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPartners(Array.isArray(data.partners) ? data.partners : Array.isArray(data) ? data : []);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  return (
    <div>
      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "合作診所數", value: partners.length || "—", icon: "🤝", color: "#2B6CB0" },
          { label: "本月新增", value: 2, icon: "✨", color: "#38A169" },
          { label: "上架優惠方案", value: "—", icon: "🎁", color: "#ED8936" },
          { label: "本月總預約數", value: 87, icon: "📅", color: "#805AD5" },
        ].map((k) => (
          <div key={k.label} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: k.color, marginBottom: 2 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: "#718096" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 32, textAlign: "center", color: "#A0AEC0" }}>載入中...</div>
      ) : partners.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 32, textAlign: "center", color: "#A0AEC0" }}>尚無合作診所</div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: "#F7FAFC" }}>
              <tr>
                {["診所名稱", "縣市", "合作起始日期", "上架優惠", "本月預約", "頁面瀏覽", "狀態", "操作"].map((h) => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: "#718096", fontWeight: 600, borderBottom: "1px solid #E2E8F0", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #F7FAFC" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1A202C" }}>{p.name}</div>
                    {p.phone && <div style={{ fontSize: 11, color: "#A0AEC0" }}>{p.phone}</div>}
                  </td>
                  <td style={{ padding: "12px 14px", color: "#4A5568" }}>{cityFromAddress(p.address)}</td>
                  <td style={{ padding: "12px 14px", color: "#718096" }}>{formatDate(p.created_at)}</td>
                  <td style={{ padding: "12px 14px", color: "#4A5568" }}>—</td>
                  <td style={{ padding: "12px 14px", fontWeight: 700, color: "#2B6CB0" }}>—</td>
                  <td style={{ padding: "12px 14px", color: "#4A5568" }}>—</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, background: "#F0FFF4", color: "#38A169", borderRadius: 99, padding: "3px 10px" }}>
                      合作中
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <Link
                      href={`/portal/${p.id}`}
                      target="_blank"
                      style={{ padding: "5px 14px", background: "#2B6CB0", color: "#fff", borderRadius: 7, fontSize: 12, fontWeight: 600, textDecoration: "none" }}
                    >
                      管理
                    </Link>
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
