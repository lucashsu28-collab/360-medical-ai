"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface Stats {
  today_unlocks: number;
  line_sent_today: number;
  total_unlocks: number;
  crawler_status: {
    places: { last_run: string | null; status: string };
    judicial: { last_run: string | null; status: string };
    mohw: { last_run: string | null; status: string };
  };
}

interface UnlockRecord {
  id: string; time: string; user_id: string; target_name: string; unlock_type: string;
}

interface ClinicItem {
  id: string; name: string; google_rating?: number | null;
  score_breakdown?: { judicial?: number; legal?: number; punishment?: number; news?: number; social?: number };
}

// Mock inquiry data
const MOCK_INQUIRIES = [
  { id: 1, clinic_name: "台北美妍診所", contact: "0912-345-678", created_at: "2026-03-28", status: "未處理" },
  { id: 2, clinic_name: "新竹微整外科", contact: "info@clinic.tw", created_at: "2026-03-27", status: "未處理" },
  { id: 3, clinic_name: "高雄星光美容", contact: "0988-765-432", created_at: "2026-03-26", status: "已聯繫" },
];

// Mock 7-day bar chart data
const MOCK_BAR = [
  { date: "3/24", count: 8 }, { date: "3/25", count: 12 }, { date: "3/26", count: 7 },
  { date: "3/27", count: 15 }, { date: "3/28", count: 11 }, { date: "3/29", count: 18 }, { date: "3/30", count: 16 },
];
const maxBar = Math.max(...MOCK_BAR.map((d) => d.count));

function KpiCard({ label, value, sub, subColor, icon }: { label: string; value: string | number; sub?: string; subColor?: string; icon: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#1A202C", marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#718096", marginBottom: sub ? 4 : 0 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, fontWeight: 600, color: subColor || "#38A169" }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [totalClinics, setTotalClinics] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [clinicsRes, statsRes] = await Promise.allSettled([
          fetch(`${API_URL}/api/clinics?limit=1`),
          fetch(`${API_URL}/api/admin/stats`),
        ]);
        if (clinicsRes.status === "fulfilled" && clinicsRes.value.ok) {
          const data = await clinicsRes.value.json();
          setTotalClinics(data.total ?? null);
        }
        if (statsRes.status === "fulfilled" && statsRes.value.ok) {
          setStats(await statsRes.value.json());
        }
      } finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const _ = loading;

  return (
    <div>
      {/* Row 1 KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
        <KpiCard icon="🏥" label="全台22縣市" value={totalClinics ?? 904} sub="收錄診所總數" subColor="#718096" />
        <KpiCard icon="🤝" label="合作診所數" value={13} sub="↑ 2 本月新增" subColor="#38A169" />
        <KpiCard icon="📅" label="本月預約數" value={87} sub="↑ 23% vs 上月" subColor="#38A169" />
        <KpiCard icon="💬" label="LINE AI 對話數" value={1243} sub="↑ 15% vs 上月" subColor="#38A169" />
      </div>

      {/* Row 2 KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <KpiCard icon="📊" label="本月頁面瀏覽" value="28,491" sub="↑ 8% vs 上月" subColor="#38A169" />
        <KpiCard icon="📝" label="等待人工審核" value={5} sub="待審核內容" subColor="#ED8936" />
        <KpiCard icon="⭐" label="904 家診所" value="13,647" sub="Google 評論總數" subColor="#718096" />
        <KpiCard icon="🤝" label="本週未處理" value={3} sub="合作洽詢申請" subColor="#2B6CB0" />
      </div>

      {/* Two-col */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Bar chart */}
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", marginBottom: 16 }}>近7天預約趨勢</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
            {MOCK_BAR.map((d) => (
              <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 10, color: "#718096" }}>{d.count}</div>
                <div style={{ width: "100%", background: "#2B6CB0", borderRadius: "4px 4px 0 0", height: `${(d.count / maxBar) * 90}px`, minHeight: 4 }} />
                <div style={{ fontSize: 10, color: "#A0AEC0" }}>{d.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Inquiries */}
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", marginBottom: 14 }}>最新合作洽詢</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 8, padding: "6px 0", borderBottom: "1px solid #E2E8F0", fontSize: 11, fontWeight: 600, color: "#718096" }}>
              <span>診所名稱</span><span>聯絡方式</span><span>申請時間</span><span>狀態</span>
            </div>
            {MOCK_INQUIRIES.map((inq) => (
              <div key={inq.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 8, padding: "10px 0", borderBottom: "1px solid #F7FAFC", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1A202C" }}>{inq.clinic_name}</span>
                <span style={{ fontSize: 12, color: "#718096" }}>{inq.contact}</span>
                <span style={{ fontSize: 11, color: "#A0AEC0" }}>{inq.created_at}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, borderRadius: 99, padding: "2px 8px", whiteSpace: "nowrap",
                  background: inq.status === "未處理" ? "#FFF5F5" : "#F0FFF4",
                  color: inq.status === "未處理" ? "#E53E3E" : "#38A169",
                }}>
                  {inq.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
