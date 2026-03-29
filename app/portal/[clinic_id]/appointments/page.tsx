"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Appointment {
  id: number;
  user_display_name?: string;
  user_phone?: string;
  treatment_name?: string;
  preferred_date?: string;
  preferred_time?: string;
  note?: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "";
const STATUS_COLOR = { pending: "#F59E0B", confirmed: "#3B82F6", cancelled: "#94A3B8", completed: "#10B981" };
const STATUS_LABEL = { pending: "待確認", confirmed: "已確認", cancelled: "已取消", completed: "已完成" };

export default function PortalAppointmentsPage() {
  const params = useParams();
  const clinicId = params?.clinic_id as string;
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("portal_token") || "";
    fetch(`${API}/api/portal/${clinicId}/appointments`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clinicId]);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>預約列表</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>透過 LINE OA 預約的患者列表（唯讀，請在 LINE OA Manager 接聊）</p>

      {loading ? <p style={{ color: "#94A3B8", fontSize: 13 }}>載入中...</p> : items.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, padding: 32, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>目前沒有預約記錄</div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.06)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["預約時間", "患者", "電話", "療程", "備註", "狀態"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748B", fontWeight: 500, borderBottom: "1px solid #E2E8F0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "12px 16px", color: "#1E293B" }}>
                    {a.preferred_date || "—"}
                    {a.preferred_time && ` ${a.preferred_time}`}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#1E293B" }}>{a.user_display_name || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#64748B" }}>{a.user_phone || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#1E293B" }}>{a.treatment_name || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#94A3B8", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.note || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: STATUS_COLOR[a.status] }}>
                      {STATUS_LABEL[a.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
