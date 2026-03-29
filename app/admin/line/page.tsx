"use client";
import { useEffect, useState } from "react";

interface LineStats {
  total_users: number;
  total_messages_30d: number;
  clinic_conversions_30d: number;
  bookings_30d: number;
  daily_trend: { date: string; messages: number; users: number }[];
}
interface PopularQuestion { question: string; count: number; }
interface ClinicConversion { clinic_id: string; clinic_name: string; conversions: number; }

const API = process.env.NEXT_PUBLIC_API_URL || "";

const MOCK_QUESTIONS: PopularQuestion[] = [
  { question: "玻尿酸費用多少？", count: 234 },
  { question: "如何選擇可信診所？", count: 198 },
  { question: "肉毒桿菌安全嗎？", count: 176 },
  { question: "皮秒雷射推薦診所", count: 154 },
  { question: "雙眼皮手術費用", count: 132 },
  { question: "術後恢復要多久？", count: 118 },
  { question: "診所司法記錄查詢", count: 97 },
  { question: "醫師執照如何查詢？", count: 89 },
  { question: "音波拉皮效果", count: 76 },
  { question: "醫美前後比較照", count: 64 },
];

const MOCK_CONVERSIONS: ClinicConversion[] = [
  { clinic_id: "1", clinic_name: "台北信義美醫診所", conversions: 48 },
  { clinic_id: "2", clinic_name: "新竹微整美學中心", conversions: 35 },
  { clinic_id: "3", clinic_name: "台中芙蓉美容外科", conversions: 29 },
  { clinic_id: "4", clinic_name: "高雄美麗人生診所", conversions: 22 },
  { clinic_id: "5", clinic_name: "台南玻尿酸專科", conversions: 18 },
];

export default function AdminLinePage() {
  const [stats, setStats] = useState<LineStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || "" : "";
    Promise.allSettled([
      fetch(`${API}/api/admin/line/stats`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ]).then(([statsRes]) => {
      if (statsRes.status === "fulfilled") setStats(statsRes.value);
    }).finally(() => setLoading(false));
  }, []);

  const maxConv = Math.max(...MOCK_CONVERSIONS.map((c) => c.conversions));
  const _ = loading;

  return (
    <div>
      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "近30天用戶數", value: stats?.total_users ?? 1243, icon: "👥", color: "#2B6CB0" },
          { label: "近30天訊息數", value: stats?.total_messages_30d ?? 8721, icon: "💬", color: "#38A169" },
          { label: "近30天導流數", value: stats?.clinic_conversions_30d ?? 203, icon: "🏥", color: "#ED8936" },
          { label: "導流轉換率", value: `${((stats?.bookings_30d ?? 87) / (stats?.clinic_conversions_30d ?? 203) * 100).toFixed(1)}%`, icon: "📈", color: "#805AD5" },
        ].map((k) => (
          <div key={k.label} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: k.color, marginBottom: 2 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: "#718096" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Two-col */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Popular questions */}
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", marginBottom: 14 }}>熱門問題 Top 10</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                {["排名", "問題", "次數"].map((h) => (
                  <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: "#718096", fontWeight: 600, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_QUESTIONS.map((q, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #F7FAFC" }}>
                  <td style={{ padding: "8px", color: i < 3 ? "#2B6CB0" : "#A0AEC0", fontWeight: 700, fontSize: 12 }}>#{i + 1}</td>
                  <td style={{ padding: "8px", color: "#4A5568" }}>{q.question}</td>
                  <td style={{ padding: "8px", color: "#1A202C", fontWeight: 600 }}>{q.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Clinic conversion bar */}
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", marginBottom: 14 }}>各診所導流數排行</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {MOCK_CONVERSIONS.map((c) => (
              <div key={c.clinic_id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: "#4A5568" }}>{c.clinic_name}</span>
                  <span style={{ fontWeight: 700, color: "#2B6CB0" }}>{c.conversions}</span>
                </div>
                <div style={{ background: "#EBF8FF", borderRadius: 4, height: 8, overflow: "hidden" }}>
                  <div style={{ width: `${(c.conversions / maxConv) * 100}%`, height: "100%", background: "#2B6CB0", borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
