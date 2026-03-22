"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const PAGE_SIZE = 20;

type Period = "today" | "week" | "all";

interface UnlockRecord {
  id: string;
  time: string;
  user_id: string;
  target_name: string;
  unlock_type: string;
}

const PERIOD_LABELS: Record<Period, string> = {
  today: "今日",
  week: "本週",
  all: "全部",
};

export default function AdminUnlocksPage() {
  const [period, setPeriod] = useState<Period>("today");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<UnlockRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          period,
          limit: String(PAGE_SIZE),
          offset: String((page - 1) * PAGE_SIZE),
        });
        const res = await fetch(`${API_URL}/api/admin/unlocks?${params}`);
        if (res.ok) {
          const data = await res.json();
          setRecords(data.unlocks ?? []);
          setTotal(data.total ?? data.unlocks?.length ?? 0);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [period, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatTime = (t: string) => {
    try {
      return new Date(t).toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return t;
    }
  };

  const maskUserId = (uid: string) => `${uid.slice(0, 8)}****`;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>
        報告解鎖記錄
      </h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 20 }}>
        共 {total} 筆解鎖記錄
      </p>

      {/* 篩選 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["today", "week", "all"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => { setPeriod(p); setPage(1); }}
            style={{
              padding: "8px 18px",
              background: period === p ? "#3B82F6" : "#fff",
              color: period === p ? "#fff" : "#475569",
              border: `1px solid ${period === p ? "#3B82F6" : "#E2E8F0"}`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: period === p ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* 表格 */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: "#F8FAFC" }}>
            <tr>
              {["時間", "LINE User ID", "診所/醫師名稱", "解鎖類型"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#64748B",
                    fontWeight: 600,
                    borderBottom: "1px solid #E2E8F0",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>
                  載入中…
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>
                  {period === "today" ? "今日尚無解鎖記錄" : "無解鎖記錄"}
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "11px 16px", color: "#475569" }}>
                    {formatTime(r.time)}
                  </td>
                  <td style={{ padding: "11px 16px", color: "#475569", fontFamily: "monospace", fontSize: 12 }}>
                    {maskUserId(r.user_id)}
                  </td>
                  <td style={{ padding: "11px 16px", color: "#0F172A", fontWeight: 500 }}>
                    {r.target_name}
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <span
                      style={{
                        background: r.unlock_type === "clinic" ? "#EFF6FF" : "#F0FDF4",
                        color: r.unlock_type === "clinic" ? "#3B82F6" : "#16A34A",
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {r.unlock_type === "clinic" ? "診所報告" : r.unlock_type === "doctor" ? "醫師報告" : r.unlock_type}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分頁 */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            style={{
              padding: "6px 16px",
              background: page <= 1 ? "#F1F5F9" : "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              cursor: page <= 1 ? "not-allowed" : "pointer",
              color: page <= 1 ? "#94A3B8" : "#475569",
              fontSize: 13,
            }}
          >
            上一頁
          </button>
          <span style={{ display: "flex", alignItems: "center", fontSize: 13, color: "#475569" }}>
            第 {page} / {totalPages} 頁
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{
              padding: "6px 16px",
              background: page >= totalPages ? "#F1F5F9" : "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              cursor: page >= totalPages ? "not-allowed" : "pointer",
              color: page >= totalPages ? "#94A3B8" : "#475569",
              fontSize: 13,
            }}
          >
            下一頁
          </button>
        </div>
      )}
    </div>
  );
}
