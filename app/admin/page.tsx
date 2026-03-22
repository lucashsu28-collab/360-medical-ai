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
  id: string;
  time: string;
  user_id: string;
  target_name: string;
  unlock_type: string;
}

interface ClinicItem {
  id: string;
  name: string;
  google_rating?: number | null;
  score_breakdown?: { judicial?: number; legal?: number; punishment?: number; news?: number; social?: number };
}

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", flex: 1, minWidth: 160, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#0F172A" }}>{value}</div>
      <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>{label}</div>
    </div>
  );
}

const CRAWLER_LABELS: Record<string, string> = {
  places: "Google Places 評分",
  judicial: "司法院裁判書",
  mohw: "衛福部行政處分",
};

const STATUS_COLOR: Record<string, string> = {
  success: "#22C55E",
  running: "#F59E0B",
  failed: "#EF4444",
  unknown: "#94A3B8",
};

const STATUS_LABEL: Record<string, string> = {
  success: "正常",
  running: "執行中",
  failed: "失敗",
  unknown: "未執行",
};

function DataCompleteness({ total, clinics }: { total: number; clinics: ClinicItem[] }) {
  const items = [
    { label: "Google 評分", icon: "⭐", count: clinics.filter(c => c.google_rating != null).length },
    { label: "司法案件", icon: "⚖️", count: clinics.filter(c => c.score_breakdown?.judicial != null).length },
    { label: "合法登記", icon: "🏛️", count: clinics.filter(c => c.score_breakdown?.legal != null).length },
    { label: "行政處分", icon: "🚨", count: clinics.filter(c => c.score_breakdown?.punishment != null).length },
    { label: "新聞媒體", icon: "📰", count: clinics.filter(c => c.score_breakdown?.news != null).length },
    { label: "社群討論", icon: "💬", count: clinics.filter(c => c.score_breakdown?.social != null).length },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map(item => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        const barColor = pct === 100 ? "#22C55E" : pct > 0 ? "#F59E0B" : "#E2E8F0";
        const textColor = pct === 100 ? "#16A34A" : pct > 0 ? "#D97706" : "#94A3B8";
        return (
          <div key={item.label}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569", marginBottom: 6 }}>
              <span>{item.icon} {item.label}</span>
              <span style={{ fontWeight: 600, color: textColor }}>{item.count} / {total} ({pct}%)</span>
            </div>
            <div style={{ background: "#F1F5F9", borderRadius: 4, height: 8, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 4, transition: "width 0.5s" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboard() {
  const [totalClinics, setTotalClinics] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [unlocks, setUnlocks] = useState<UnlockRecord[]>([]);
  const [allClinics, setAllClinics] = useState<ClinicItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [clinicsRes, statsRes, unlocksRes, allClinicsRes] = await Promise.allSettled([
          fetch(`${API_URL}/api/clinics?limit=1`),
          fetch(`${API_URL}/api/admin/stats`),
          fetch(`${API_URL}/api/admin/unlocks?limit=8`),
          fetch(`${API_URL}/api/clinics?limit=9999`),
        ]);
        if (clinicsRes.status === "fulfilled" && clinicsRes.value.ok) {
          const data = await clinicsRes.value.json();
          setTotalClinics(data.total ?? null);
        }
        if (statsRes.status === "fulfilled" && statsRes.value.ok) {
          setStats(await statsRes.value.json());
        }
        if (unlocksRes.status === "fulfilled" && unlocksRes.value.ok) {
          const data = await unlocksRes.value.json();
          setUnlocks(data.unlocks ?? []);
        }
        if (allClinicsRes.status === "fulfilled" && allClinicsRes.value.ok) {
          const data = await allClinicsRes.value.json();
          setAllClinics(data.clinics ?? []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const formatTime = (t: string | null) => {
    if (!t) return "—";
    try {
      return new Date(t).toLocaleString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch { return t; }
  };

  const unlockTypeLabel = (t: string) => t === "clinic" ? "診所" : t === "doctor" ? "醫師" : t;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>數據看板</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>360醫美平台即時數據總覽</p>

      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <StatCard icon="🏥" label="診所總數" value={loading ? "..." : (totalClinics ?? "—")} color="#3B82F6" />
        <StatCard icon="🔓" label="今日解鎖數" value={loading ? "..." : (stats?.today_unlocks ?? 0)} color="#8B5CF6" />
        <StatCard icon="💬" label="LINE今日推播" value={loading ? "..." : (stats?.line_sent_today ?? 0)} color="#06B6D4" />
        <StatCard icon="📊" label="解鎖總次數" value={loading ? "..." : (stats?.total_unlocks ?? 0)} color="#10B981" />
      </div>

      <div style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 420px", background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 16 }}>最近解鎖記錄</h2>
          {loading ? (
            <p style={{ color: "#94A3B8", fontSize: 13 }}>載入中...</p>
          ) : unlocks.length === 0 ? (
            <p style={{ color: "#94A3B8", fontSize: 13 }}>尚無解鎖記錄</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                  {["時間", "User ID", "診所/醫師", "類型"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: "#64748B", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unlocks.map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #F8FAFC" }}>
                    <td style={{ padding: "8px", color: "#475569", whiteSpace: "nowrap" }}>{formatTime(r.time)}</td>
                    <td style={{ padding: "8px", color: "#475569", fontFamily: "monospace", fontSize: 11 }}>{r.user_id.slice(0, 8)}****</td>
                    <td style={{ padding: "8px", color: "#0F172A", fontWeight: 500 }}>{r.target_name}</td>
                    <td style={{ padding: "8px" }}>
                      <span style={{ background: r.unlock_type === "clinic" ? "#EFF6FF" : "#F0FDF4", color: r.unlock_type === "clinic" ? "#3B82F6" : "#16A34A", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                        {unlockTypeLabel(r.unlock_type)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ flex: "1 1 280px", background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 16 }}>爬蟲狀態</h2>
          {loading ? (
            <p style={{ color: "#94A3B8", fontSize: 13 }}>載入中...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(["places", "judicial", "mohw"] as const).map(key => {
                const s = stats?.crawler_status?.[key];
                const statusKey = s?.status ?? "unknown";
                return (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#F8FAFC", borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{CRAWLER_LABELS[key]}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>上次執行：{formatTime(s?.last_run ?? null)}</div>
                    </div>
                    <span style={{ background: STATUS_COLOR[statusKey] + "20", color: STATUS_COLOR[statusKey], padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {STATUS_LABEL[statusKey] ?? statusKey}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>資料完整度</h2>
        <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 16 }}>六維度資料填補狀況（共 {totalClinics ?? "..."} 家診所）</p>
        {loading ? (
          <p style={{ color: "#94A3B8", fontSize: 13 }}>載入中...</p>
        ) : (
          <DataCompleteness total={totalClinics ?? 0} clinics={allClinics} />
        )}
      </div>
    </div>
  );
}
