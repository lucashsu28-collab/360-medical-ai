"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import Link from "next/link";

const NAV = [
  { icon: "📊", label: "數據看板", path: "" },
  { icon: "🏥", label: "基本資料", path: "/info" },
  { icon: "✦", label: "品牌頁面", path: "/brand" },
  { icon: "💆", label: "療程項目", path: "/treatments" },
  { icon: "🎁", label: "優惠方案", path: "/promotions" },
  { icon: "👨‍⚕️", label: "醫師團隊", path: "/doctors" },
  { icon: "🖼️", label: "Gallery", path: "/gallery" },
  { icon: "📅", label: "預約列表", path: "/appointments" },
  { icon: "⚖️", label: "稽查違規", path: "/penalties" },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const clinicId = params?.clinic_id as string;
  const [clinicName, setClinicName] = useState("");
  const [checked, setChecked] = useState(false);
  const [isAdminBypass, setIsAdminBypass] = useState(false);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "";

    // Check for admin bypass via URL param (first load) or sessionStorage (navigation within tab)
    const urlParams = new URLSearchParams(window.location.search);
    const urlBypass = urlParams.get("admin_bypass");
    const ssToken = sessionStorage.getItem("admin_bypass_token");
    const ssClinicId = sessionStorage.getItem("admin_bypass_clinic_id");

    const bypassToken =
      urlBypass === "authenticated" ? "authenticated"
      : ssToken === "authenticated" && ssClinicId === clinicId ? "authenticated"
      : null;

    if (bypassToken) {
      // Persist for subsequent navigation within this tab
      sessionStorage.setItem("admin_bypass_token", bypassToken);
      sessionStorage.setItem("admin_bypass_clinic_id", clinicId);
      setIsAdminBypass(true);
      fetch(`${API}/api/portal/${clinicId}/info`, {
        headers: { Authorization: `Bearer ${bypassToken}` },
      })
        .then((r) => r.json())
        .then((d) => { if (d.name) setClinicName(d.name); })
        .catch(() => {})
        .finally(() => setChecked(true));
      return;
    }

    // Normal portal auth
    const token = localStorage.getItem("portal_token");
    const storedId = localStorage.getItem("portal_clinic_id");
    if (!token || storedId !== clinicId) {
      router.replace("/portal/login");
      return;
    }
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
      {/* Admin bypass banner */}
      {isAdminBypass && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, background: "#7C3AED", color: "#fff", fontSize: 12, fontWeight: 600, textAlign: "center", padding: "6px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <span>🔐 管理員代理模式 — 正在以管理員身份瀏覽「{clinicName}」後台</span>
          <a href="/admin/partners" style={{ color: "#E9D5FF", textDecoration: "underline", fontSize: 11 }}>返回管理後台</a>
        </div>
      )}

      {/* Sidebar */}
      <aside style={{ width: 200, minWidth: 200, background: "#0F172A", display: "flex", flexDirection: "column", padding: isAdminBypass ? "56px 0 0" : "24px 0", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100 }}>
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
          {isAdminBypass ? (
            <a href="/admin/partners" style={{ display: "block", width: "100%", padding: "7px 10px", background: "#7C3AED", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, cursor: "pointer", textAlign: "center", textDecoration: "none" }}>
              ← 返回管理後台
            </a>
          ) : (
            <button
              onClick={() => { localStorage.removeItem("portal_token"); localStorage.removeItem("portal_clinic_id"); router.push("/portal/login"); }}
              style={{ width: "100%", padding: "7px 10px", background: "transparent", border: "1px solid #334155", borderRadius: 8, color: "#64748B", fontSize: 12, cursor: "pointer" }}
            >
              登出
            </button>
          )}
        </div>
      </aside>
      <main style={{ marginLeft: 200, flex: 1, padding: 24, paddingTop: isAdminBypass ? 56 : 24 }}>
        {children}
      </main>
    </div>
  );
}
