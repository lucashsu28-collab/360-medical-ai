"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPortalToken } from "@/app/portal/utils";

interface GalleryItem {
  id: number;
  url: string;
  caption?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function PortalGalleryPage() {
  const params = useParams();
  const clinicId = params?.clinic_id as string;
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ url: "", caption: "" });
  const [saving, setSaving] = useState(false);

  const token = getPortalToken;

  function load() {
    fetch(`${API}/api/portal/${clinicId}/gallery`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [clinicId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`${API}/api/portal/${clinicId}/gallery`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ url: "", caption: "" });
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("確定刪除？")) return;
    await fetch(`${API}/api/portal/${clinicId}/gallery/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>Gallery</h1>
          <p style={{ color: "#64748B", fontSize: 14, margin: "4px 0 0" }}>上傳診所環境照片，顯示於診所頁面</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ padding: "8px 18px", background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + 新增照片
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={{ background: "#F8FAFC", borderRadius: 12, padding: 20, marginBottom: 20, border: "1px solid #E2E8F0" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1E293B", marginBottom: 12 }}>新增照片</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 6 }}>圖片 URL *</label>
            <input required placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 6 }}>說明（選填）</label>
            <input placeholder="例：候診室、手術室" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          {form.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.url} alt="preview" style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 8, marginBottom: 12 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={saving} style={{ padding: "8px 18px", background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>新增</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "8px 18px", background: "#fff", color: "#64748B", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>取消</button>
          </div>
        </form>
      )}

      {loading ? <p style={{ color: "#94A3B8", fontSize: 13 }}>載入中...</p> : items.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, padding: 32, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>尚未上傳照片</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {items.map((g) => (
            <div key={g.id} style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.06)", position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.url} alt={g.caption || "gallery"} style={{ width: "100%", height: 140, objectFit: "cover" }} />
              {g.caption && <p style={{ fontSize: 12, color: "#64748B", padding: "6px 10px", margin: 0 }}>{g.caption}</p>}
              <button onClick={() => handleDelete(g.id)} style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,.5)", border: "none", color: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
