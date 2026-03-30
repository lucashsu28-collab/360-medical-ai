"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPortalToken } from "@/app/portal/utils";

interface Promotion {
  id: number;
  title: string;
  price?: string;
  description?: string;
  valid_until?: string;
  category?: string;
  is_active: boolean;
  review_status?: "pending" | "approved" | "rejected";
  reviewer_note?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "";
const STATUS_COLOR = { pending: "#F59E0B", approved: "#10B981", rejected: "#EF4444" };
const STATUS_LABEL = { pending: "審核中", approved: "已上架", rejected: "已拒絕" };

export default function PortalPromotionsPage() {
  const params = useParams();
  const clinicId = params?.clinic_id as string;
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", price: "", description: "", valid_until: "", category: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const token = getPortalToken;

  function load() {
    fetch(`${API}/api/portal/${clinicId}/promotions`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [clinicId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`${API}/api/portal/${clinicId}/promotions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (d.violations?.length > 0) {
        setMsg(`合規警告：${d.violations.join("；")}`);
      } else {
        setMsg("已送出審核，通過後自動上架");
      }
      setForm({ title: "", price: "", description: "", valid_until: "", category: "" });
      setShowForm(false);
      load();
    } catch {
      setMsg("送出失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("確定刪除？")) return;
    await fetch(`${API}/api/portal/${clinicId}/promotions/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>優惠方案</h1>
          <p style={{ color: "#64748B", fontSize: 14, margin: "4px 0 0" }}>新增優惠後送審核，通過即出現在「優惠療程搜尋」頁面</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ padding: "8px 18px", background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + 新增優惠
        </button>
      </div>

      {msg && <p style={{ fontSize: 13, color: msg.includes("警告") ? "#EF4444" : "#10B981", marginBottom: 12 }}>{msg}</p>}

      {showForm && (
        <form onSubmit={handleAdd} style={{ background: "#FFFBEB", borderRadius: 12, padding: 20, marginBottom: 20, border: "1px solid #FDE68A" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1E293B", marginBottom: 12 }}>新增優惠方案</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <input required placeholder="優惠標題 *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13 }} />
            <input placeholder="價格（例：$3,800）" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13 }} />
            <input placeholder="大類（例：雷射、注射）" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13 }} />
            <input type="date" placeholder="有效期至" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13 }} />
          </div>
          <textarea placeholder="優惠說明（選填，請勿使用誇大療效詞彙）" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, resize: "none", boxSizing: "border-box", marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={saving} style={{ padding: "8px 18px", background: "#F59E0B", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>送出審核</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "8px 18px", background: "#fff", color: "#64748B", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>取消</button>
          </div>
        </form>
      )}

      {loading ? <p style={{ color: "#94A3B8", fontSize: 13 }}>載入中...</p> : items.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, padding: 32, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>尚未新增優惠方案</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item) => (
            <div key={item.id} style={{ background: "#fff", borderRadius: 10, padding: "14px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.06)", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  {item.category && <span style={{ fontSize: 11, background: "#FEF3C7", color: "#D97706", borderRadius: 4, padding: "1px 6px" }}>{item.category}</span>}
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#1E293B", margin: 0 }}>{item.title}</p>
                </div>
                {item.price && <p style={{ fontSize: 13, color: "#D97706", margin: "2px 0 0", fontWeight: 600 }}>{item.price}</p>}
                {item.description && <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0" }}>{item.description}</p>}
                {item.valid_until && <p style={{ fontSize: 11, color: "#94A3B8", margin: "4px 0 0" }}>有效期至 {item.valid_until}</p>}
                {item.reviewer_note && <p style={{ fontSize: 12, color: "#EF4444", margin: "4px 0 0" }}>拒絕原因：{item.reviewer_note}</p>}
              </div>
              {item.review_status && (
                <span style={{ fontSize: 11, fontWeight: 600, color: STATUS_COLOR[item.review_status], whiteSpace: "nowrap", marginTop: 2 }}>
                  {STATUS_LABEL[item.review_status]}
                </span>
              )}
              <button onClick={() => handleDelete(item.id)} style={{ padding: "4px 10px", background: "#FEF2F2", color: "#EF4444", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", marginTop: 2 }}>刪除</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
