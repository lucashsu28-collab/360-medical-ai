"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPortalToken } from "@/app/portal/utils";

interface ClinicInfo {
  name: string;
  address: string;
  phone: string;
  website: string;
  specialty: string;
  line_oa_url: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function PortalInfoPage() {
  const params = useParams();
  const clinicId = params?.clinic_id as string;
  const [info, setInfo] = useState<ClinicInfo>({ name: "", address: "", phone: "", website: "", specialty: "", line_oa_url: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = getPortalToken();
    fetch(`${API}/api/portal/${clinicId}/info`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setInfo({ name: d.name || "", address: d.address || "", phone: d.phone || "", website: d.website || "", specialty: d.specialty || "", line_oa_url: d.line_oa_url || "" }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clinicId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const token = getPortalToken();
    try {
      const res = await fetch(`${API}/api/portal/${clinicId}/info`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(info),
      });
      if (res.ok) setMsg("儲存成功");
      else setMsg("儲存失敗");
    } catch {
      setMsg("連線失敗");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: "#94A3B8", fontSize: 13 }}>載入中...</p>;

  const fields: { key: keyof ClinicInfo; label: string; placeholder: string }[] = [
    { key: "name", label: "診所名稱", placeholder: "台北信義美醫診所" },
    { key: "address", label: "地址", placeholder: "台北市信義區忠孝東路..." },
    { key: "phone", label: "電話", placeholder: "02-1234-5678" },
    { key: "website", label: "官方網站", placeholder: "https://www.clinic.com" },
    { key: "specialty", label: "主要科別", placeholder: "醫學美容、皮膚科" },
    { key: "line_oa_url", label: "LINE OA 連結", placeholder: "https://lin.ee/xxxxx" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>基本資料</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>編輯診所基本資訊，儲存後即時更新診所頁面</p>

      <form onSubmit={handleSave} style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.06)", maxWidth: 560 }}>
        {fields.map((f) => (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>{f.label}</label>
            <input
              type="text"
              value={info[f.key]}
              onChange={(e) => setInfo({ ...info, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 14, color: "#1E293B", boxSizing: "border-box" }}
            />
          </div>
        ))}
        {msg && <p style={{ fontSize: 13, color: msg === "儲存成功" ? "#10B981" : "#EF4444", marginBottom: 12 }}>{msg}</p>}
        <button type="submit" disabled={saving} style={{ padding: "10px 24px", background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "儲存中..." : "儲存"}
        </button>
      </form>
    </div>
  );
}
