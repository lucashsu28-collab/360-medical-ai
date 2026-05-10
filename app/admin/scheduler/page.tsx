"use client";
import { useEffect, useState, useCallback } from "react";

interface Scheduler {
  id: string;
  schedule: string;
  time_zone: string;
  state: string;
  uri: string;
  http_method: string;
  description?: string;
  last_attempt_time: string | null;
  next_schedule_time: string | null;
  // enriched
  icon?: string;
  name?: string;
  category?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "";

const STATE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  ENABLED: { color: "#2F855A", bg: "#F0FFF4", label: "✅ 啟用" },
  PAUSED: { color: "#A0AEC0", bg: "#F7FAFC", label: "⏸ 已暫停" },
  DISABLED: { color: "#E53E3E", bg: "#FFF5F5", label: "❌ 已停用" },
  UPDATE_FAILED: { color: "#C05621", bg: "#FFFAF0", label: "⚠ 更新失敗" },
};

const CATEGORY_BADGE: Record<string, { color: string; bg: string; label: string }> = {
  core: { color: "#2B6CB0", bg: "#EBF8FF", label: "核心" },
  p3a: { color: "#C53030", bg: "#FFF5F5", label: "P3-A 稽查" },
  p3b: { color: "#3182CE", bg: "#EBF8FF", label: "P3-B 媒體" },
  p3c: { color: "#A0AEC0", bg: "#F1F5F9", label: "P3-C 社群（已下線）" },
};

// 常用 cron 預設選項
const CRON_PRESETS = [
  { label: "每天 03:00", value: "0 3 * * *" },
  { label: "每週日 03:00", value: "0 3 * * 0" },
  { label: "每週日 04:00", value: "0 4 * * 0" },
  { label: "每週日 05:00", value: "0 5 * * 0" },
  { label: "每 10 天 03:00", value: "0 3 */10 * *" },
  { label: "每月 1 號 04:00", value: "0 4 1 * *" },
  { label: "每月 1 號 05:00", value: "0 5 1 * *" },
];

export default function AdminSchedulerPage() {
  const [items, setItems] = useState<Scheduler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editSchedule, setEditSchedule] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || "" : "";
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/api/admin/schedulers`, { headers })
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.detail || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((d) => setItems(d.items || []))
      .catch((e) => setError(e.message || "載入失敗"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function runNow(id: string) {
    if (!confirm(`確認立即執行「${id}」？\n（稽查 / 媒體口碑 爬蟲會花費 Gemini 額度）`)) return;
    setRunning(id);
    try {
      const r = await fetch(`${API}/api/admin/schedulers/${id}/run`, { method: "POST", headers });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        alert(d.detail || "觸發失敗");
      } else {
        alert(`「${id}」已觸發，5-10 分鐘後查看結果`);
      }
    } finally {
      setRunning(null);
      load();
    }
  }

  async function togglePause(s: Scheduler) {
    const action = s.state === "PAUSED" ? "resume" : "pause";
    const r = await fetch(`${API}/api/admin/schedulers/${s.id}`, {
      method: "PATCH", headers, body: JSON.stringify({ action }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      alert(d.detail || "操作失敗");
    }
    load();
  }

  function startEdit(s: Scheduler) {
    setEditing(s.id);
    setEditSchedule(s.schedule);
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editSchedule.trim()) { alert("cron 不可為空"); return; }
    setSavingEdit(true);
    const r = await fetch(`${API}/api/admin/schedulers/${editing}`, {
      method: "PATCH", headers, body: JSON.stringify({ schedule: editSchedule.trim() }),
    });
    setSavingEdit(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      alert(d.detail || "更新失敗");
      return;
    }
    setEditing(null);
    load();
  }

  function formatTime(t: string | null): string {
    if (!t) return "—";
    try {
      return new Date(t).toLocaleString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch { return t; }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: "#718096", margin: 0 }}>
          管理 GCP Cloud Scheduler 排程任務。可調整 cron 表達式、暫停/恢復、立即觸發手動掃描。
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#A0AEC0" }}>載入中…</div>
      ) : error ? (
        <div style={{ padding: 24, background: "#FFF5F5", border: "1px solid #FEB2B2", borderRadius: 10, color: "#C53030" }}>
          ⚠ {error}
          <div style={{ marginTop: 10, fontSize: 12, color: "#742A2A" }}>
            可能原因：Cloud Run service account 缺少 <code>roles/cloudscheduler.admin</code> 權限。
            <br />
            請執行：<br />
            <code style={{ display: "block", marginTop: 6, padding: 8, background: "#FED7D7", borderRadius: 4, fontSize: 11 }}>
              gcloud projects add-iam-policy-binding medical-ai-489522 \<br />
              &nbsp;&nbsp;--member=serviceAccount:&lt;CLOUD_RUN_SA&gt; \<br />
              &nbsp;&nbsp;--role=roles/cloudscheduler.admin
            </code>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          {items.map((s) => {
            const stateStyle = STATE_STYLE[s.state] || STATE_STYLE.DISABLED;
            const catBadge = s.category ? CATEGORY_BADGE[s.category] : null;
            const isRunning = running === s.id;
            return (
              <div key={s.id} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ fontSize: 26 }}>{s.icon || "🔧"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1A202C", margin: 0 }}>
                        {s.name || s.id}
                      </h3>
                      {catBadge && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: catBadge.color, background: catBadge.bg, padding: "2px 8px", borderRadius: 4 }}>
                          {catBadge.label}
                        </span>
                      )}
                      <span style={{ fontSize: 11, fontWeight: 700, color: stateStyle.color, background: stateStyle.bg, padding: "2px 10px", borderRadius: 99 }}>
                        {stateStyle.label}
                      </span>
                    </div>
                    {s.description && (
                      <p style={{ fontSize: 12, color: "#718096", margin: "0 0 10px", lineHeight: 1.5 }}>{s.description}</p>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, fontSize: 12, marginBottom: 12 }}>
                      <Info label="ID" value={<code style={{ fontSize: 11 }}>{s.id}</code>} />
                      <Info label="Cron" value={
                        editing === s.id ? (
                          <input
                            value={editSchedule}
                            onChange={(e) => setEditSchedule(e.target.value)}
                            style={{ width: "100%", padding: "4px 6px", fontSize: 12, border: "1px solid #2B6CB0", borderRadius: 4, fontFamily: "monospace" }}
                          />
                        ) : (
                          <code style={{ fontSize: 12, color: "#1A202C", fontWeight: 600 }}>{s.schedule}</code>
                        )
                      } />
                      <Info label="時區" value={s.time_zone} />
                      <Info label="上次執行" value={formatTime(s.last_attempt_time)} />
                      <Info label="下次執行" value={formatTime(s.next_schedule_time)} />
                      <Info label="HTTP" value={`${s.http_method}`} />
                    </div>

                    {editing === s.id && (
                      <div style={{ marginBottom: 10, padding: 10, background: "#F7FAFC", borderRadius: 6 }}>
                        <div style={{ fontSize: 11, color: "#4A5568", marginBottom: 6 }}>常用排程預設：</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {CRON_PRESETS.map((p) => (
                            <button key={p.value} onClick={() => setEditSchedule(p.value)}
                              style={{ padding: "3px 8px", fontSize: 11, border: "1px solid #CBD5E0", borderRadius: 4, background: "#fff", cursor: "pointer" }}>
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => runNow(s.id)} disabled={isRunning || s.state !== "ENABLED"}
                        style={btn("#2B6CB0", isRunning || s.state !== "ENABLED")}>
                        {isRunning ? "執行中…" : "🚀 立即執行"}
                      </button>

                      {editing === s.id ? (
                        <>
                          <button onClick={saveEdit} disabled={savingEdit} style={btn("#38A169", savingEdit)}>
                            {savingEdit ? "儲存中…" : "💾 儲存 cron"}
                          </button>
                          <button onClick={() => setEditing(null)} style={btn("#A0AEC0")}>取消</button>
                        </>
                      ) : (
                        <button onClick={() => startEdit(s)} style={btn("#7C3AED")}>✏️ 修改排程</button>
                      )}

                      <button onClick={() => togglePause(s)} style={btn(s.state === "PAUSED" ? "#38A169" : "#ED8936")}>
                        {s.state === "PAUSED" ? "▶️ 恢復" : "⏸ 暫停"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cron 速查 */}
      <div style={{ marginTop: 24, padding: 16, background: "#F7FAFC", border: "1px solid #E2E8F0", borderRadius: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A202C", marginBottom: 8 }}>📘 Cron 表達式速查</div>
        <div style={{ fontSize: 12, color: "#4A5568", lineHeight: 1.8, fontFamily: "monospace" }}>
          <div><code>分 時 日 月 週</code>（週 0=週日，1-6=週一到週六）</div>
          <div><code>0 3 * * *</code> → 每天 03:00</div>
          <div><code>0 3 * * 0</code> → 每週日 03:00</div>
          <div><code>0 3 */10 * *</code> → 每 10 天 03:00</div>
          <div><code>0 4 1 * *</code> → 每月 1 號 04:00</div>
          <div><code>*/30 * * * *</code> → 每 30 分鐘</div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#A0AEC0", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ color: "#4A5568" }}>{value || "—"}</div>
    </div>
  );
}

function btn(color: string, disabled = false): React.CSSProperties {
  return {
    padding: "6px 14px", border: 0, borderRadius: 6, fontSize: 12, fontWeight: 600,
    background: disabled ? "#CBD5E0" : color,
    color: "#fff", cursor: disabled ? "not-allowed" : "pointer",
  };
}
