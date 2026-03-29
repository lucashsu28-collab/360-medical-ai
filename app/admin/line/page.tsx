"use client";
import { useEffect, useState } from "react";

interface LineStats {
  total_users: number;
  total_messages_30d: number;
  clinic_conversions_30d: number;
  bookings_30d: number;
  daily_trend: { date: string; messages: number; users: number }[];
}

interface PopularQuestion {
  question: string;
  count: number;
}

interface ClinicConversion {
  clinic_id: string;
  clinic_name: string;
  conversions: number;
}

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function AdminLinePage() {
  const [stats, setStats] = useState<LineStats | null>(null);
  const [questions, setQuestions] = useState<PopularQuestion[]>([]);
  const [conversions, setConversions] = useState<ClinicConversion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token") || "";
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/admin/line/stats`, { headers }).then((r) => r.json()),
      fetch(`${API}/api/admin/line/popular-questions`, { headers }).then((r) => r.json()),
      fetch(`${API}/api/admin/line/clinic-conversions`, { headers }).then((r) => r.json()),
    ])
      .then(([s, q, c]) => {
        setStats(s);
        setQuestions(Array.isArray(q) ? q : []);
        setConversions(Array.isArray(c) ? c : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const trend = stats?.daily_trend ?? [];
  const maxMessages = Math.max(...trend.map((d) => d.messages), 1);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "#94A3B8" }}>
        載入中...
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>LINE OA 數據儀表板</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>近 30 天 LINE OA 營運數據</p>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "累積用戶數", value: stats?.total_users ?? 0, color: "#3B82F6" },
          { label: "30天訊息數", value: stats?.total_messages_30d ?? 0, color: "#8B5CF6" },
          { label: "診所導流轉換", value: stats?.clinic_conversions_30d ?? 0, color: "#F59E0B" },
          { label: "預約次數（30天）", value: stats?.bookings_30d ?? 0, color: "#10B981" },
        ].map((c) => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 12, padding: "20px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
            <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 6 }}>{c.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Trend Chart (SVG) */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.06)", marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 16 }}>近 14 天訊息趨勢</h3>
        {trend.length === 0 ? (
          <p style={{ color: "#94A3B8", fontSize: 13 }}>尚無趨勢資料</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <svg width={Math.max(600, trend.length * 44)} height={160} style={{ display: "block" }}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                <line
                  key={ratio}
                  x1={0} y1={20 + (1 - ratio) * 100}
                  x2={Math.max(600, trend.length * 44)} y2={20 + (1 - ratio) * 100}
                  stroke="#F1F5F9" strokeWidth={1}
                />
              ))}
              {/* Bars */}
              {trend.map((d, i) => {
                const barH = Math.max(2, (d.messages / maxMessages) * 100);
                const x = i * 44 + 12;
                const y = 120 - barH;
                return (
                  <g key={d.date}>
                    <rect x={x} y={y} width={20} height={barH} rx={4} fill="#3B82F6" opacity={0.8} />
                    <text x={x + 10} y={148} textAnchor="middle" fontSize={10} fill="#94A3B8">
                      {d.date.slice(5)}
                    </text>
                    <text x={x + 10} y={y - 4} textAnchor="middle" fontSize={10} fill="#64748B">
                      {d.messages}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Popular Questions */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 16 }}>熱門問題 Top 10</h3>
          {questions.length === 0 ? (
            <p style={{ color: "#94A3B8", fontSize: 13 }}>尚無資料</p>
          ) : (
            <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {questions.map((q, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: i < 3 ? "#FEF3C7" : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: i < 3 ? "#D97706" : "#94A3B8", flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, color: "#1E293B" }}>{q.question}</span>
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>{q.count} 次</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Clinic Conversions */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 16 }}>診所導流轉換排行</h3>
          {conversions.length === 0 ? (
            <p style={{ color: "#94A3B8", fontSize: 13 }}>尚無資料</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "6px 0", color: "#94A3B8", fontWeight: 500, borderBottom: "1px solid #E2E8F0" }}>診所</th>
                  <th style={{ textAlign: "right", padding: "6px 0", color: "#94A3B8", fontWeight: 500, borderBottom: "1px solid #E2E8F0" }}>轉換數</th>
                </tr>
              </thead>
              <tbody>
                {conversions.slice(0, 10).map((c, i) => (
                  <tr key={i}>
                    <td style={{ padding: "8px 0", color: "#1E293B", borderBottom: "1px solid #F8FAFC" }}>{c.clinic_name}</td>
                    <td style={{ padding: "8px 0", textAlign: "right", color: "#3B82F6", fontWeight: 600, borderBottom: "1px solid #F8FAFC" }}>{c.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
