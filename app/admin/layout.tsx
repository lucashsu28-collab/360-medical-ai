"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const PRIMARY_NAV = [
  { icon: "📊", label: "數據看板",      href: "/admin" },
  { icon: "🏥", label: "診所資料管理",  href: "/admin/clinics" },
  { icon: "🤝", label: "合作診所管理",  href: "/admin/partners" },
  { icon: "📅", label: "預約管理",      href: "/admin/appointments" },
  { icon: "💬", label: "LINE OA 數據",  href: "/admin/line" },
  { icon: "📋", label: "內容審核",      href: "/admin/cms" },
  { icon: "⚖️", label: "稽查違規",      href: "/admin/penalties" },
];

const SYSTEM_NAV = [
  { icon: "🤖", label: "AI 顧問調校",   href: "/admin/ai-tuning" },
  { icon: "🕷️", label: "爬蟲排程",      href: "/admin/scheduler" },
  { icon: "⚠️", label: "警告系統",      href: "/admin/alerts" },
  { icon: "📤", label: "資料匯出",      href: "/admin/export" },
  { icon: "⚙️", label: "評分規則",      href: "/admin/scoring" },
];

function NavItem({ item, isActive }: { item: { icon: string; label: string; href: string }; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 12px", borderRadius: 7, marginBottom: 2,
        background: isActive ? "#2B6CB0" : "transparent",
        color: isActive ? "#fff" : "#A0AEC0",
        textDecoration: "none", fontSize: 13,
        fontWeight: isActive ? 600 : 400,
      }}
    >
      <span style={{ fontSize: 15, width: 18, textAlign: "center" }}>{item.icon}</span>
      {item.label}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") { setChecked(true); return; }
    const token = localStorage.getItem("admin_token");
    if (!token) router.replace("/admin/login");
    else setChecked(true);
  }, [pathname, router]);

  if (!checked) return null;
  if (pathname === "/admin/login") return <>{children}</>;

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  // Find current page title
  const allNav = [...PRIMARY_NAV, ...SYSTEM_NAV];
  const currentNav = allNav.find((n) => isActive(n.href));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F7FAFC" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, minWidth: 220, background: "#1A202C",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>360 醫美 AI</div>
          <div style={{ fontSize: 10, color: "#718096", marginTop: 2 }}>後台管理系統</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#4A5568", letterSpacing: "0.08em", padding: "4px 12px 6px", textTransform: "uppercase" }}>
            主要功能
          </div>
          {PRIMARY_NAV.map((item) => (
            <NavItem key={item.href} item={item} isActive={isActive(item.href)} />
          ))}
          <div style={{ fontSize: 10, fontWeight: 600, color: "#4A5568", letterSpacing: "0.08em", padding: "12px 12px 6px", textTransform: "uppercase" }}>
            系統管理
          </div>
          {SYSTEM_NAV.map((item) => (
            <NavItem key={item.href} item={item} isActive={isActive(item.href)} />
          ))}
        </nav>

        {/* Bottom user area */}
        <div style={{ padding: "12px 12px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2B6CB0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              A
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0" }}>管理員</div>
              <div style={{ fontSize: 11, color: "#718096" }}>Super Admin</div>
            </div>
          </div>
          <button
            onClick={() => { localStorage.removeItem("admin_token"); router.push("/admin/login"); }}
            style={{ width: "100%", padding: "7px", background: "transparent", border: "1px solid rgba(255,255,255,.1)", borderRadius: 6, color: "#718096", fontSize: 12, cursor: "pointer" }}
          >
            登出
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 220, flex: 1, minHeight: "100vh", background: "#F7FAFC" }}>
        {/* Topbar */}
        <div style={{
          background: "#fff", borderBottom: "1px solid #E2E8F0", height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px", position: "sticky", top: 0, zIndex: 50,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1A202C" }}>
            {currentNav?.label || "後台管理"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#718096" }}>
              {new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" })}
            </span>
            <a
              href="https://360-medical-ai.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: "6px 14px", background: "#EBF8FF", color: "#2B6CB0", borderRadius: 7, fontSize: 12, fontWeight: 600, textDecoration: "none" }}
            >
              前往前台 →
            </a>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "24px 28px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
