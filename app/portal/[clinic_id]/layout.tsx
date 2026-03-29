"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import Link from "next/link";

const NAV = [
  { icon: "📊", label: "數據看板", path: "" },
  { icon: "🏥", label: "基本資料", path: "/info" },
  { icon: "💆", label: "療程項目", path: "/treatments" },
  { icon: "🎁", label: "優惠方案", path: "/promotions" },
  { icon: "👨‍⚕️", label: "醫師團隊", path: "/doctors" },
  { icon: "🖼️", label: "Gallery", path: "/gallery" },
  { icon: "📅", label: "預約列表", path: "/appointments" },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const clinicId = params?.clinic_id as string;
  const [clinicName, setClinicName] = useState("");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("portal_token");
    const storedId = localStorage.getItem("portal_clinic_id");
    if (!token || storedId !== clinicId) {
      router.replace("/portal/login");
      return;
    }
    const API = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${API}/api/portal/${clinicId}/info`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.name) setClinicName(d.name); })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [clinicId, router]);

  if (!checked) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC" }}>
      {/* Sidebar */}
      <aside style={{ width: 200, minWidth: 200, background: "#0F172A", display: "flex", flexDirection: "column", padding: "24px 0", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100 }}>
        <div style={{ padding: "0 16px 20px", borderBottom: "1px solid #1E293B" }}>
          <div style={{ color: "#F59E0B", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>✦ 合作診所</div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1.4 }}>{clinicName || "診所後台"}</div>
        </div>
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {NAV.map((item) => {
            const href = `/portal/${clinicId}${item.path}`;
            const isActive = item.path === ""
              ? pathname === `/portal/${clinicId}`
              : pathname.startsWith(href);
            return (
              <Link key={item.path} href={href} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 8, marginBottom: 2, background: isActive ? "#1E293B" : "transparent", color: isActive ? "#fff" : "#94A3B8", textDecoration: "none", fontSize: 13, fontWeight: isActive ? 600 : 400 }}>
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: "12px 8px", borderTop: "1px solid #1E293B" }}>
          <button
            onClick={() => { localStorage.removeItem("portal_token"); localStorage.removeItem("portal_clinic_id"); router.push("/portal/login"); }}
            style={{ width: "100%", padding: "7px 10px", background: "transparent", border: "1px solid #334155", borderRadius: 8, color: "#64748B", fontSize: 12, cursor: "pointer" }}
          >
            登出
          </button>
        </div>
      </aside>
      <main style={{ marginLeft: 200, flex: 1, padding: 24 }}>
        {children}
      </main>
    </div>
  );
}
