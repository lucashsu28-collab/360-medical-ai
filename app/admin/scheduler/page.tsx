"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
type CrawlerKey = "places" | "judicial" | "mohw";

interface CrawlerStatus { last_run: string | null; status: "success" | "running" | "failed" | "unknown"; records_updated?: number; }

const TASKS = [
  { key: "places" as CrawlerKey, icon: "⭐", name: "Google Places 評分更新", cycle: "每10天", live: true, desc: "更新全部 904 家診所的 Google 評分與評論數。每次約 TWD 450，執行時間 ~30 分鐘。" },
  { key: "judicial" as CrawlerKey, icon: "⚖️", name: "司法院裁判書更新", cycle: "每30天", live: true, desc: "從司法院查詢 904 家診所的司法案件數。每日 6-12 點為維護時段，請避開。" },
  { key: "mohw" as CrawlerKey, icon: "🏛️", name: "健保署診所資料同步", cycle: "每7天", live: true, desc: "更新衛福部健保署醫事機構登記資料，確保合法登記分數準確。" },
  { key: "news" as unknown as CrawlerKey, icon: "📰", name: "新聞媒體監測", cycle: "每天", live: false, desc: "統計診所相關新聞媒體報導正負評傾向（第4維度，開發中）。" },
  { key: "social" as unknown as CrawlerKey, icon: "💬", name: "社群口碑監測", cycle: "每天", live: false, desc: "分析 PTT、Dcard 等社群平台的診所討論情緒（第5維度，開發中）。" },
];

const MOCK_LOGS = [
  { time: "2026-03-29 14:32", task: "Google Places 評分更新", result: "success", duration: "28分鐘", records: 904 },
  { time: "2026-03-25 09:15", task: "健保署診所資料同步", result: "success", duration: "5分鐘", records: 24321 },
  { time: "2026-02-28 22:00", task: "司法院裁判書更新", result: "success", duration: "14分鐘", records: 904 },
  { time: "2026-02-19 14:32", task: "Google Places 評分更新", result: "success", duration: "31分鐘", records: 904 },
];

export default function AdminSchedulerPage() {
  const [statusMap, setStatusMap] = useState<Record<string, CrawlerStatus>>({
    places: { last_run: null, status: "unknown" },
    judicial: { last_run: null, status: "unknown" },
    mohw: { last_run: null, status: "unknown" },
  });
  const [triggering, setTriggering] = useState<Record<string, boolean>>({});
  const [triggerResult, setTriggerResult] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`${API_URL}/api/admin/stats`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: Record<string, unknown>) => {
        const cs = data.crawler_status as Record<CrawlerKey, CrawlerStatus> | undefined;
        if (cs) setStatusMap((prev) => ({ ...prev, ...cs }));
      })
      .catch(() => {});
  }, []);

  const handleTrigger = async (key: string) => {
    setTriggering((p) => ({ ...p, [key]: true }));
    setTriggerResult((p) => ({ ...p, [key]: "" }));
    try {
      const res = await fetch(`${API_URL}/api/admin/trigger-crawl`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crawler: key }),
      });
      if (res.ok) {
        setTriggerResult((p) => ({ ...p, [key]: "已排程，爬蟲執行中（約需數分鐘）" }));
        setStatusMap((p) => ({ ...p, [key]: { ...(p[key] || {}), status: "running" } }));
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

  const handleTriggerAll = async () => {
    for (const t of TASKS.filter((t) => t.live)) {
      await handleTrigger(t.key as string);
    }
  };

  const formatTime = (t: string | null) => {
    if (!t) return "尚未執行";
    try { return new Date(t).toLocaleString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }); }
    catch { return t; }
  };

  const getStatusStyle = (s: string) => ({
    success: { bg: "#F0FFF4", color: "#38A169", label: "✅ 啟用" },
    running: { bg: "#FFF5E6", color: "#ED8936", label: "⏳ 執行中" },
    failed: { bg: "#FFF5F5", color: "#E53E3E", label: "❌ 失敗" },
    unknown: { bg: "#F7FAFC", color: "#A0AEC0", label: "— 未執行" },
  }[s] ?? { bg: "#F7FAFC", color: "#A0AEC0", label: s });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button
          onClick={handleTriggerAll}
          style={{ padding: "9px 22px", background: "#2B6CB0", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          立即執行全部
        </button>
      </div>

      {/* Task list */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: "#F7FAFC" }}>
            <tr>
              {["任務名稱", "排程週期", "上次執行", "結果", "下次執行", "狀態", "操作"].map((h) => (
                <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: "#718096", fontWeight: 600, borderBottom: "1px solid #E2E8F0", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TASKS.map((task) => {
              const status = statusMap[task.key as string] || { last_run: null, status: "unknown" };
              const ss = getStatusStyle(task.live ? status.status : "pending_dev");
              const isTriggering = triggering[task.key as string];
              const result = triggerResult[task.key as string];

              return (
                <tr key={task.key as string} style={{ borderBottom: "1px solid #F7FAFC" }}>
                  <td style={{ padding: "13px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{task.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A202C" }}>{task.name}</div>
                        <div style={{ fontSize: 11, color: "#A0AEC0", marginTop: 1 }}>{task.desc.slice(0, 40)}...</div>
                      </div>
                    </div>
                    {result && (
                      <div style={{ marginTop: 6, fontSize: 11, color: result.includes("失敗") || result.includes("錯誤") ? "#E53E3E" : "#38A169" }}>
                        {result}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "13px 14px", color: "#4A5568" }}>{task.cycle}</td>
                  <td style={{ padding: "13px 14px", color: "#718096", whiteSpace: "nowrap" }}>{formatTime(status.last_run)}</td>
                  <td style={{ padding: "13px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, background: ss.bg, color: ss.color, borderRadius: 99, padding: "3px 10px" }}>
                      {task.live ? ss.label : "⏳ 開發中"}
                    </span>
                  </td>
                  <td style={{ padding: "13px 14px", color: "#718096", whiteSpace: "nowrap" }}>—</td>
                  <td style={{ padding: "13px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, background: task.live ? "#F0FFF4" : "#F7FAFC", color: task.live ? "#38A169" : "#A0AEC0", borderRadius: 99, padding: "3px 10px" }}>
                      {task.live ? "啟用" : "未啟用"}
                    </span>
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    {task.live ? (
                      <button
                        onClick={() => handleTrigger(task.key as string)}
                        disabled={isTriggering || status.status === "running"}
                        style={{ padding: "5px 14px", background: isTriggering || status.status === "running" ? "#F7FAFC" : "#2B6CB0", color: isTriggering || status.status === "running" ? "#A0AEC0" : "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: isTriggering || status.status === "running" ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
                      >
                        {isTriggering || status.status === "running" ? "執行中..." : "立即執行"}
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: "#A0AEC0" }}>設定</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recent logs */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #E2E8F0", fontSize: 14, fontWeight: 700, color: "#1A202C" }}>
          最近執行日誌
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: "#F7FAFC" }}>
            <tr>
              {["時間", "任務名稱", "執行結果", "耗時", "更新筆數"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#718096", fontWeight: 600, borderBottom: "1px solid #E2E8F0", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_LOGS.map((log, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #F7FAFC" }}>
                <td style={{ padding: "10px 14px", color: "#718096", whiteSpace: "nowrap" }}>{log.time}</td>
                <td style={{ padding: "10px 14px", color: "#4A5568" }}>{log.task}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: "#F0FFF4", color: "#38A169", borderRadius: 99, padding: "2px 10px" }}>
                    ✅ 成功
                  </span>
                </td>
                <td style={{ padding: "10px 14px", color: "#4A5568" }}>{log.duration}</td>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#2B6CB0" }}>{log.records.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
