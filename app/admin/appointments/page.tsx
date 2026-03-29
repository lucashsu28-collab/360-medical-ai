"use client";
import { useEffect, useState, useCallback } from "react";

interface Appointment {
  id: number;
  clinic_id: string;
  clinic_name?: string;
  treatment_name?: string;
  preferred_date?: string;
  preferred_time?: string;
  user_display_name?: string;
  user_phone?: string;
  note?: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "";
const STATUS_BG = { pending: "#FFF5E6", confirmed: "#EBF8FF", cancelled: "#F7FAFC", completed: "#F0FFF4" };
const STATUS_COLOR = { pending: "#ED8936", confirmed: "#2B6CB0", cancelled: "#A0AEC0", completed: "#38A169" };
const STATUS_LABEL = { pending: "待確認", confirmed: "已確認", cancelled: "已取消", completed: "已完成" };

export default function AdminAppointmentsPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || "" : "";

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    fetch(`${API}/api/appointments/admin?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [statusFilter, token]);

  useEffect(() => { load(); }, [load]);

  async function restoreAI(id: number) {
    setRestoringId(id);
    await fetch(`${API}/api/appointments/admin/${id}/restore-ai`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    setRestoringId(null);
    load();
  }

  const todayCount = items.filter((a) => a.created_at?.startsWith(new Date().toISOString().slice(0, 10))).length;
  const pendingCount = items.filter((a) => a.status === "pending").length;
  const completedCount = items.filter((a) => a.status === "completed").length;

  return (
    <div>
      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "今日預約", value: todayCount, icon: "📅", color: "#2B6CB0" },
          { label: "本月預約", value: items.length, icon: "📊", color: "#38A169" },
          { label: "待確認", value: pendingCount, icon: "⏳", color: "#ED8936" },
          { label: "已完成", value: completedCount, icon: "✅", color: "#38A169" },
        ].map((k) => (
          <div key={k.label} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: k.color, marginBottom: 2 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: "#718096" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["", "pending", "confirmed", "completed", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
              background: statusFilter === s ? "#2B6CB0" : "#fff",
              color: statusFilter === s ? "#fff" : "#4A5568",
              fontWeight: statusFilter === s ? 600 : 400,
              boxShadow: "0 1px 3px rgba(0,0,0,.06)",
            }}
          >
            {s === "" ? "全部" : STATUS_LABEL[s as keyof typeof STATUS_LABEL]}
            {s === "pending" && pendingCount > 0 && (
              <span style={{ marginLeft: 6, background: "#ED8936", color: "#fff", borderRadius: 99, padding: "1px 6px", fontSize: 10 }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "32px", textAlign: "center", color: "#A0AEC0" }}>載入中...</div>
      ) : items.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "32px", textAlign: "center", color: "#A0AEC0" }}>目前沒有預約記錄</div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: "#F7FAFC" }}>
              <tr>
                {["編號", "診所", "患者姓名・電話", "療程", "希望時間", "狀態", "操作"].map((h) => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: "#718096", fontWeight: 600, borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #F7FAFC" }}>
                  <td style={{ padding: "11px 14px", color: "#A0AEC0", fontSize: 12 }}>#{a.id}</td>
                  <td style={{ padding: "11px 14px", color: "#1A202C", fontWeight: 600 }}>{a.clinic_name || a.clinic_id}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ fontSize: 13, color: "#1A202C" }}>{a.user_display_name || "—"}</div>
                    <div style={{ fontSize: 11, color: "#A0AEC0" }}>{a.user_phone || "—"}</div>
                  </td>
                  <td style={{ padding: "11px 14px", color: "#4A5568" }}>{a.treatment_name || "—"}</td>
                  <td style={{ padding: "11px 14px", color: "#4A5568", whiteSpace: "nowrap" }}>
                    {a.preferred_date || "—"}{a.preferred_time ? ` ${a.preferred_time}` : ""}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "3px 10px",
                      background: STATUS_BG[a.status],
                      color: STATUS_COLOR[a.status],
                    }}>
                      {STATUS_LABEL[a.status]}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    {(a.status === "pending" || a.status === "confirmed") ? (
                      <button
                        onClick={() => restoreAI(a.id)}
                        disabled={restoringId === a.id}
                        style={{ padding: "5px 12px", background: "#38A169", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: restoringId === a.id ? 0.6 : 1, whiteSpace: "nowrap" }}
                      >
                        {restoringId === a.id ? "處理中..." : "恢復AI"}
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: "#A0AEC0" }}>查看</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 14, padding: "10px 14px", background: "#EBF8FF", borderRadius: 8, fontSize: 12, color: "#2B6CB0" }}>
        💡 諮詢師在 LINE OA Manager 接聊完成後，點「恢復AI」讓 AI 重新接管對話。
      </div>
    </div>
  );
}
