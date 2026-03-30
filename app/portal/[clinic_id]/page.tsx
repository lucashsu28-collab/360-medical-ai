"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPortalToken } from "@/app/portal/utils";

interface DashboardData {
  page_views_30d: number;
  appointment_count_30d: number;
  active_promotions: number;
}

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function PortalDashboardPage() {
  const params = useParams();
  const clinicId = params?.clinic_id as string;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getPortalToken();
    fetch(`${API}/api/portal/${clinicId}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clinicId]);

  const stats = [
    { label: "頁面瀏覽（30天）", value: data?.page_views_30d ?? 0, icon: "👁️", color: "#3B82F6", href: null },
    { label: "預約次數（30天）", value: data?.appointment_count_30d ?? 0, icon: "📅", color: "#10B981", href: `/portal/${clinicId}/appointments` },
    { label: "上架中優惠", value: data?.active_promotions ?? 0, icon: "🎁", color: "#F59E0B", href: `/portal/${clinicId}/promotions` },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>數據看板</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>近 30 天診所經營概況</p>

      {loading ? (
        <p style={{ color: "#94A3B8", fontSize: 13 }}>載入中...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
          {stats.map((s) => {
            const card = (
              <div style={{ background: "#fff", borderRadius: 12, padding: "24px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.06)", cursor: s.href ? "pointer" : "default", transition: "box-shadow 0.15s" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 6 }}>{s.label}</p>
                <p style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.value.toLocaleString()}</p>
              </div>
            );
            return s.href ? (
              <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>{card}</Link>
            ) : (
              <div key={s.label}>{card}</div>
            );
          })}
        </div>
      )}

      {/* Quick actions */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 16 }}>快速操作</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            { label: "編輯基本資料", href: `/portal/${clinicId}/info` },
            { label: "新增優惠方案", href: `/portal/${clinicId}/promotions` },
            { label: "管理療程項目", href: `/portal/${clinicId}/treatments` },
            { label: "上傳診所照片", href: `/portal/${clinicId}/gallery` },
          ].map((a) => (
            <Link key={a.label} href={a.href} style={{ padding: "8px 16px", background: "#EFF6FF", borderRadius: 8, fontSize: 13, fontWeight: 500, color: "#3B82F6", textDecoration: "none" }}>
              {a.label} →
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
