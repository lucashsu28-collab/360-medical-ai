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
  user_line_id?: string;
  note?: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "";
const STATUS_COLOR = { pending: "#F59E0B", confirmed: "#3B82F6", cancelled: "#94A3B8", completed: "#10B981" };
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
    fetch(`${API}/api/appointments/admin?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [statusFilter, token]);

  useEffect(() => { load(); }, [load]);

  async function restoreAI(id: number) {
    setRestoringId(id);
    await fetch(`${API}/api/appointments/admin/${id}/restore-ai`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setRestoringId(null);
    load();
  }

  const pendingCount = items.filter((a) => a.status === "pending").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>預約管理</h1>
        {pendingCount > 0 && (
          <span style={{ background: "#FEF3C7", color: "#D97706", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8 }}>
            {pendingCount} 筆待確認
          </span>
        )}
      </div>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 20 }}>預約管理 · 諮詢師接聊後點「恢復AI模式」結案</p>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["", "pending", "confirmed", "completed", "cancelled"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid", borderColor: statusFilter === s ? "#3B82F6" : "#E2E8F0", background: statusFilter === s ? "#EFF6FF" : "#fff", color: statusFilter === s ? "#3B82F6" : "#64748B", fontSize: 13, cursor: "pointer" }}>
            {s === "" ? "全部" : STATUS_LABEL[s as keyof typeof STATUS_LABEL]}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "#94A3B8", fontSize: 13 }}>載入中...</p>
      ) : items.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, padding: 32, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
          目前沒有預約記錄
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.06)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["預約時間", "診所", "療程", "患者", "電話", "備註", "狀態", "操作"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#64748B", fontWeight: 500, borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #F1F5F9", background: a.status === "pending" ? "#FFFBEB" : "#fff" }}>
                  <td style={{ padding: "11px 14px", color: "#1E293B", whiteSpace: "nowrap" }}>
                    {a.preferred_date || "—"}{a.preferred_time ? ` ${a.preferred_time}` : ""}
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>{new Date(a.created_at).toLocaleDateString("zh-TW")}</div>
                  </td>
                  <td style={{ padding: "11px 14px", color: "#1E293B" }}>{a.clinic_name || a.clinic_id}</td>
                  <td style={{ padding: "11px 14px", color: "#1E293B" }}>{a.treatment_name || "—"}</td>
                  <td style={{ padding: "11px 14px", color: "#1E293B" }}>{a.user_display_name || "—"}</td>
                  <td style={{ padding: "11px 14px", color: "#64748B" }}>{a.user_phone || "—"}</td>
                  <td style={{ padding: "11px 14px", color: "#94A3B8", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.note || "—"}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: STATUS_COLOR[a.status] }}>
                      {STATUS_LABEL[a.status]}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    {(a.status === "pending" || a.status === "confirmed") && (
                      <button
                        onClick={() => restoreAI(a.id)}
                        disabled={restoringId === a.id}
                        style={{ padding: "5px 10px", background: "#F0FDF4", color: "#10B981", border: "1px solid #BBF7D0", borderRadius: 6, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", opacity: restoringId === a.id ? 0.5 : 1 }}
                      >
                        恢復AI模式
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 16, padding: 12, background: "#F8FAFC", borderRadius: 8, fontSize: 12, color: "#64748B" }}>
        💡 諮詢師在 <strong>LINE OA Manager</strong> 接聊完成後，點「恢復AI模式」讓 AI 重新接管對話。
      </div>
    </div>
  );
}
