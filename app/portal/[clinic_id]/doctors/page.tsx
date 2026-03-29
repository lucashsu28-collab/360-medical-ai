"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Doctor {
  id: number;
  name: string;
  title?: string;
  specialty?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function PortalDoctorsPage() {
  const params = useParams();
  const clinicId = params?.clinic_id as string;
  const [items, setItems] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", title: "", specialty: "" });
  const [saving, setSaving] = useState(false);

  const token = () => localStorage.getItem("portal_token") || "";

  function load() {
    fetch(`${API}/api/portal/${clinicId}/doctors`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [clinicId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`${API}/api/portal/${clinicId}/doctors`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", title: "", specialty: "" });
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("確定刪除？")) return;
    await fetch(`${API}/api/portal/${clinicId}/doctors/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>醫師團隊</h1>
          <p style={{ color: "#64748B", fontSize: 14, margin: "4px 0 0" }}>管理診所醫師資料，顯示於診所頁面</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ padding: "8px 18px", background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + 新增醫師
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={{ background: "#F0FDF4", borderRadius: 12, padding: 20, marginBottom: 20, border: "1px solid #BBF7D0" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1E293B", marginBottom: 12 }}>新增醫師</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <input required placeholder="姓名 *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13 }} />
            <input placeholder="職稱（例：院長）" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13 }} />
            <input placeholder="專長（例：皮秒雷射）" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13 }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={saving} style={{ padding: "8px 18px", background: "#10B981", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>新增</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "8px 18px", background: "#fff", color: "#64748B", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>取消</button>
          </div>
        </form>
      )}

      {loading ? <p style={{ color: "#94A3B8", fontSize: 13 }}>載入中...</p> : items.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, padding: 32, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>尚未新增醫師</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {items.map((d) => (
            <div key={d.id} style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,.06)", position: "relative" }}>
              <div style={{ fontSize: 28, marginBottom: 8, textAlign: "center" }}>👨‍⚕️</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", textAlign: "center", margin: 0 }}>{d.name}</p>
              {d.title && <p style={{ fontSize: 12, color: "#64748B", textAlign: "center", margin: "2px 0 0" }}>{d.title}</p>}
              {d.specialty && <p style={{ fontSize: 12, color: "#3B82F6", textAlign: "center", margin: "2px 0 0" }}>{d.specialty}</p>}
              <button onClick={() => handleDelete(d.id)} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
