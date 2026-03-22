"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

type CrawlerKey = "places" | "judicial" | "mohw";

interface CrawlerInfo {
  name: string;
  desc: string;
  icon: string;
  key: CrawlerKey;
}

interface CrawlerStatus {
  last_run: string | null;
  status: "success" | "running" | "failed" | "unknown";
  records_updated?: number;
}

const SCHEDULE_INFO: Record<CrawlerKey, { cycle: string; nextRun: (lastRun: string | null) => string }> = {
  places: {
    cycle: "每 10 天",
    nextRun: (last) => {
      if (!last) return "尚未執行";
      const d = new Date(last);
      d.setDate(d.getDate() + 10);
      return d.toLocaleDateString("zh-TW");
    },
  },
  judicial: {
    cycle: "每 30 天",
    nextRun: (last) => {
      if (!last) return "尚未執行";
      const d = new Date(last);
      d.setDate(d.getDate() + 30);
      return d.toLocaleDateString("zh-TW");
    },
  },
  mohw: {
    cycle: "每 30 天",
    nextRun: (last) => {
      if (!last) return "尚未執行";
      const d = new Date(last);
      d.setDate(d.getDate() + 30);
      return d.toLocaleDateString("zh-TW");
    },
  },
};

const CRAWLERS: CrawlerInfo[] = [
  {
    key: "places",
    icon: "⭐",
    name: "Google Places 評分更新",
    desc: "更新全部 904 家診所的 Google 評分與評論數。每次約 TWD 450，執行時間 ~30 分鐘。",
  },
  {
    key: "judicial",
    icon: "⚖️",
    name: "司法院裁判書爬取",
    desc: "從司法院查詢 904 家診所的司法案件數。每日 6-12 點為維護時段，請避開。",
  },
  {
    key: "mohw",
    icon: "🚨",
    name: "衛福部行政處分爬取",
    desc: "查詢衛福部行政裁處資料庫，取得診所行政處分記錄（第 4 維度，開發中）。",
  },
];

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  success: { bg: "#F0FDF4", color: "#16A34A", label: "執行成功" },
  running: { bg: "#FFFBEB", color: "#D97706", label: "執行中..." },
  failed: { bg: "#FEF2F2", color: "#DC2626", label: "執行失敗" },
  unknown: { bg: "#F1F5F9", color: "#64748B", label: "未執行" },
};

export default function AdminSchedulerPage() {
  const [statusMap, setStatusMap] = useState<Record<CrawlerKey, CrawlerStatus>>({
    places: { last_run: null, status: "unknown" },
    judicial: { last_run: null, status: "unknown" },
    mohw: { last_run: null, status: "unknown" },
  });
  const [triggering, setTriggering] = useState<Record<CrawlerKey, boolean>>({
    places: false,
    judicial: false,
    mohw: false,
  });
  const [triggerResult, setTriggerResult] = useState<Record<CrawlerKey, string>>({
    places: "",
    judicial: "",
    mohw: "",
  });

  useEffect(() => {
    fetch(`${API_URL}/api/admin/stats`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: Record<string, unknown>) => {
        const cs = data.crawler_status as Record<CrawlerKey, CrawlerStatus> | undefined;
        if (cs) {
          setStatusMap((prev) => ({ ...prev, ...cs }));
        }
      })
      .catch(() => {});
  }, []);

  const handleTrigger = async (key: CrawlerKey) => {
    setTriggering((p) => ({ ...p, [key]: true }));
    setTriggerResult((p) => ({ ...p, [key]: "" }));
    try {
      const res = await fetch(`${API_URL}/api/admin/trigger-crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crawler: key }),
      });
      if (res.ok) {
        setTriggerResult((p) => ({ ...p, [key]: "已排程，爬蟲執行中（約需數分鐘）" }));
        setStatusMap((p) => ({
          ...p,
          [key]: { ...p[key], status: "running" },
        }));
      } else {
        const d = await res.json().catch(() => ({}));
        setTriggerResult((p) => ({ ...p, [key]: d.detail ?? "觸發失敗" }));
      }
    } catch {
      setTriggerResult((p) => ({ ...p, [key]: "網路錯誤，請稍後再試" }));
    } finally {
      setTriggering((p) => ({ ...p, [key]: false }));
    }
  };

  const formatTime = (t: string | null) => {
    if (!t) return "尚未執行";
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

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>
        資料爬取排程
      </h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>
        手動觸發爬蟲或查看最後執行狀態（排程自動執行於 Phase 2 開放）
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {CRAWLERS.map((crawler) => {
          const status = statusMap[crawler.key];
          const style = STATUS_STYLE[status.status] ?? STATUS_STYLE.unknown;
          const isTriggering = triggering[crawler.key];
          const result = triggerResult[crawler.key];

          return (
            <div
              key={crawler.key}
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "22px 24px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "flex-start",
                gap: 20,
              }}
            >
              <div style={{ fontSize: 32, lineHeight: 1, marginTop: 2 }}>{crawler.icon}</div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>
                    {crawler.name}
                  </h3>
                  <span
                    style={{
                      background: style.bg,
                      color: style.color,
                      padding: "3px 10px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {style.label}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 8px" }}>
                  {crawler.desc}
                </p>
                <div style={{ fontSize: 12, color: "#94A3B8", display: "flex", gap: 16 }}>
                  <span>上次執行：{formatTime(status.last_run)}</span>
                  <span>週期：{SCHEDULE_INFO[crawler.key].cycle}</span>
                  <span>下次預計：{SCHEDULE_INFO[crawler.key].nextRun(status.last_run)}</span>
                  {status.records_updated != null && <span>更新 {status.records_updated} 筆</span>}
                </div>
                {result && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: "8px 12px",
                      background: result.includes("失敗") || result.includes("錯誤") ? "#FEF2F2" : "#F0FDF4",
                      color: result.includes("失敗") || result.includes("錯誤") ? "#DC2626" : "#16A34A",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  >
                    {result}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleTrigger(crawler.key)}
                disabled={isTriggering || status.status === "running"}
                style={{
                  padding: "9px 20px",
                  background:
                    isTriggering || status.status === "running"
                      ? "#E2E8F0"
                      : "#3B82F6",
                  color:
                    isTriggering || status.status === "running"
                      ? "#94A3B8"
                      : "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor:
                    isTriggering || status.status === "running"
                      ? "not-allowed"
                      : "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {isTriggering
                  ? "排程中..."
                  : status.status === "running"
                  ? "執行中..."
                  : "手動觸發"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
