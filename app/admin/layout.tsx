"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { icon: "📊", label: "數據看板", href: "/admin" },
  { icon: "🏥", label: "診所資料管理", href: "/admin/clinics" },
  { icon: "🤝", label: "合作診所管理", href: "/admin/partners" },
  { icon: "🔓", label: "報告解鎖記錄", href: "/admin/unlocks" },
  { icon: "📤", label: "資料匯出", href: "/admin/export" },
  { icon: "📈", label: "數據分析與排名", href: "/admin/analytics" },
  { icon: "💬", label: "LINE OA 管理", href: "/admin/line-ai" },
  { icon: "📝", label: "內容管理 CMS", href: "/admin/cms" },
  { icon: "🤖", label: "AI顧問訓練", href: "/admin/ai-training" },
  { icon: "⚖️", label: "評分規則管理", href: "/admin/scoring" },
  { icon: "🚨", label: "告警系統", href: "/admin/alerts" },
  { icon: "⚙️", label: "資料爬取排程", href: "/admin/scheduler" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setChecked(true);
      return;
    }
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
    } else {
      setChecked(true);
    }
  }, [pathname, router]);

  if (!checked) return null;

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          minWidth: 220,
          background: "#0F172A",
          display: "flex",
          flexDirection: "column",
          padding: "24px 0",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #1E293B" }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, lineHeight: 1.3 }}>
            360醫美
            <br />
            <span style={{ color: "#94A3B8", fontSize: 13, fontWeight: 400 }}>Admin 後台</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 8px" }}>
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  marginBottom: 4,
                  background: isActive ? "#1E293B" : "transparent",
                  color: isActive ? "#fff" : "#94A3B8",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: "16px 8px", borderTop: "1px solid #1E293B" }}>
          <button
            onClick={() => {
              localStorage.removeItem("admin_token");
              router.push("/admin/login");
            }}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "transparent",
              border: "1px solid #334155",
              borderRadius: 8,
              color: "#64748B",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            登出
          </button>
        </div>
      </aside>

      <main
        style={{
          marginLeft: 220,
          flex: 1,
          background: "#F8FAFC",
          minHeight: "100vh",
        }}
      >
        <div style={{
          background: "#fff",
          borderBottom: "1px solid #E2E8F0",
          padding: "12px 24px",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}>
          <a
            href="https://360-medical-ai.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px 18px",
              background: "#0F6E56",
              color: "#fff",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            前往前台 →
          </a>
        </div>
        <div style={{ padding: 24 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
