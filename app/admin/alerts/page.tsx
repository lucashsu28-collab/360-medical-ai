"use client";
import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type AlertType = "crawler_failed" | "data_anomaly";
type AlertStatus = "active" | "resolved";

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  detail: string;
  created_at: string | null;
  status: AlertStatus;
}

type Tab = "crawler" | "anomaly";

function formatDate(s: string | null) {
  if (!s) return "—";
  return s.replace("T", " ").slice(0, 16);
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [tab, setTab] = useState<Tab>("crawler");
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API_URL}/api/admin/alerts`, {
      headers: { "x-admin-token": localStorage.getItem("admin_token") ?? "" },
    })
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleResolve(id: string) {
    setResolving(id);
    try {
      const res = await fetch(`${API_URL}/api/admin/alerts/resolve/${id}`, {
        method: "PATCH",
        headers: { "x-admin-token": localStorage.getItem("admin_token") ?? "" },
      });
      const data = await res.json();
      if (data.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "resolved" } : a))
        );
      }
    } catch {
      // silent
    } finally {
      setResolving(null);
    }
  }

  const crawlerAlerts = alerts.filter((a) => a.type === "crawler_failed");
  const anomalyAlerts = alerts.filter((a) => a.type === "data_anomaly");

  const TAB_ITEMS: { key: Tab; label: string; count: number }[] = [
    { key: "crawler", label: "爬蟲失敗", count: crawlerAlerts.filter((a) => a.status === "active").length },
    { key: "anomaly", label: "資料異常", count: anomalyAlerts.length },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
        告警系統
      </h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>
        Phase 2 範圍：爬蟲失敗 + 資料異常。Email/LINE 推播通知於 Phase 4 開放。
      </p>

      {/* Tab 列 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {TAB_ITEMS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "7px 18px",
              borderRadius: 8,
              border: "none",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              background: tab === key ? "#0F172A" : "#F1F5F9",
              color: tab === key ? "#fff" : "#64748B",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {label}
            {count > 0 && (
              <span
                style={{
                  background: tab === key ? "#EF4444" : "#DC2626",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: "1px 6px",
                  lineHeight: "16px",
                }}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "#94A3B8", fontSize: 14, padding: "40px 0", textAlign: "center" }}>
          載入中...
        </div>
      ) : (
        <>
          {/* ── Tab: 爬蟲失敗 ── */}
          {tab === "crawler" && (
            <div>
              {crawlerAlerts.length === 0 ? (
                <div
                  style={{
                    background: "#F0FDF4",
                    border: "1px solid #BBF7D0",
                    borderRadius: 10,
                    padding: "20px 24px",
                    color: "#15803D",
                    fontSize: 14,
                  }}
                >
                  ✅ 目前無爬蟲失敗告警
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {crawlerAlerts.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        background: "#fff",
                        borderRadius: 12,
                        padding: "16px 20px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        borderLeft: `4px solid ${a.status === "resolved" ? "#94A3B8" : "#DC2626"}`,
                        opacity: a.status === "resolved" ? 0.65 : 1,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 12,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span
                              style={{
                                background: a.status === "resolved" ? "#F1F5F9" : "#FEF2F2",
                                color: a.status === "resolved" ? "#64748B" : "#DC2626",
                                padding: "2px 8px",
                                borderRadius: 10,
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            >
                              {a.status === "resolved" ? "已處理" : "未處理"}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                              {a.title}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 4px 0" }}>
                            {a.detail}
                          </p>
                          <span style={{ fontSize: 12, color: "#94A3B8" }}>
                            {formatDate(a.created_at)}
                          </span>
                        </div>
                        {a.status === "active" && (
                          <button
                            disabled={resolving === a.id}
                            onClick={() => handleResolve(a.id)}
                            style={{
                              padding: "5px 14px",
                              background: "#F0FDF4",
                              color: "#16A34A",
                              border: "none",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: resolving === a.id ? "not-allowed" : "pointer",
                              opacity: resolving === a.id ? 0.6 : 1,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {resolving === a.id ? "處理中…" : "標記已處理"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: 資料異常 ── */}
          {tab === "anomaly" && (
            <div>
              {anomalyAlerts.length === 0 ? (
                <div
                  style={{
                    background: "#F0FDF4",
                    border: "1px solid #BBF7D0",
                    borderRadius: 10,
                    padding: "20px 24px",
                    color: "#15803D",
                    fontSize: 14,
                  }}
                >
                  ✅ 目前無資料異常
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {anomalyAlerts.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        background: "#fff",
                        borderRadius: 12,
                        padding: "16px 20px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        borderLeft: "4px solid #F59E0B",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span
                          style={{
                            background: "#FAEEDA",
                            color: "#854F0B",
                            padding: "2px 8px",
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          資料異常
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                          {a.title}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 4px 0" }}>
                        {a.detail}
                      </p>
                      <span style={{ fontSize: 12, color: "#94A3B8" }}>
                        {formatDate(a.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 其他告警類型：P4 建置中 */}
      <div
        style={{
          marginTop: 32,
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: "16px 20px",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: "#64748B", marginBottom: 8 }}>
          其他告警類型（Phase 4 建置中）
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {["Cloud Run 異常監控", "API 回應時間監控", "Email/LINE 推播通知"].map((label) => (
            <span
              key={label}
              style={{
                background: "#E2E8F0",
                color: "#94A3B8",
                fontSize: 12,
                padding: "4px 12px",
                borderRadius: 20,
                fontWeight: 500,
              }}
            >
              {label}｜P4 建置中
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
