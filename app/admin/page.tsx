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

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "20px 24px",
        flex: 1,
        minWidth: 160,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        borderLeft: `4px solid ${color}`,
      }}
    >
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
  success: "成功",
  running: "執行中",
  failed: "失敗",
  unknown: "未執行",
};

export default function AdminDashboard() {
  const [totalClinics, setTotalClinics] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [unlocks, setUnlocks] = useState<UnlockRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [clinicsRes, statsRes, unlocksRes] = await Promise.allSettled([
          fetch(`${API_URL}/api/clinics?limit=1`),
          fetch(`${API_URL}/api/admin/stats`),
          fetch(`${API_URL}/api/admin/unlocks?limit=5`),
        ]);

        if (clinicsRes.status === "fulfilled" && clinicsRes.value.ok) {
          const data = await clinicsRes.value.json();
          setTotalClinics(data.total ?? data.clinics?.length ?? null);
        }
        if (statsRes.status === "fulfilled" && statsRes.value.ok) {
          setStats(await statsRes.value.json());
        }
        if (unlocksRes.status === "fulfilled" && unlocksRes.value.ok) {
          const data = await unlocksRes.value.json();
          setUnlocks(data.unlocks ?? []);
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
      return new Date(t).toLocaleString("zh-TW", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return t;
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>
        數據看板
      </h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>
        360醫美平台即時數據總覽
      </p>

      {/* 統計卡片 */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <StatCard
          icon="🏥"
          label="診所總數"
          value={loading ? "…" : (totalClinics ?? "—")}
          color="#3B82F6"
        />
        <StatCard
          icon="🔓"
          label="今日解鎖數"
          value={loading ? "…" : (stats?.today_unlocks ?? 0)}
          color="#8B5CF6"
        />
        <StatCard
          icon="💬"
          label="LINE今日推播"
          value={loading ? "…" : (stats?.line_sent_today ?? 0)}
          color="#06B6D4"
        />
        <StatCard
          icon="📊"
          label="解鎖總次數"
          value={loading ? "…" : (stats?.total_unlocks ?? 0)}
          color="#10B981"
        />
      </div>

      {/* 下方兩欄 */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {/* 最近解鎖記錄 */}
        <div
          style={{
            flex: "1 1 420px",
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 16 }}>
            最近解鎖記錄
          </h2>
          {loading ? (
            <p style={{ color: "#94A3B8", fontSize: 13 }}>載入中…</p>
          ) : unlocks.length === 0 ? (
            <p style={{ color: "#94A3B8", fontSize: 13 }}>尚無解鎖記錄</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                  {["時間", "User ID", "診所/醫師", "類型"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "6px 8px",
                        color: "#64748B",
                        fontWeight: 500,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unlocks.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #F8FAFC" }}>
                    <td style={{ padding: "8px", color: "#475569" }}>{formatTime(r.time)}</td>
                    <td style={{ padding: "8px", color: "#475569", fontFamily: "monospace" }}>
                      {r.user_id.slice(0, 8)}****
                    </td>
                    <td style={{ padding: "8px", color: "#0F172A", fontWeight: 500 }}>
                      {r.target_name}
                    </td>
                    <td style={{ padding: "8px", color: "#64748B" }}>{r.unlock_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 爬蟲狀態 */}
        <div
          style={{
            flex: "1 1 280px",
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 16 }}>
            爬蟲狀態
          </h2>
          {loading ? (
            <p style={{ color: "#94A3B8", fontSize: 13 }}>載入中…</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(["places", "judicial", "mohw"] as const).map((key) => {
                const s = stats?.crawler_status?.[key];
                const statusKey = s?.status ?? "unknown";
                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px",
                      background: "#F8FAFC",
                      borderRadius: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                        {CRAWLER_LABELS[key]}
                      </div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                        最後執行：{formatTime(s?.last_run ?? null)}
                      </div>
                    </div>
                    <span
                      style={{
                        background: STATUS_COLOR[statusKey] + "20",
                        color: STATUS_COLOR[statusKey],
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {STATUS_LABEL[statusKey] ?? statusKey}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
