"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/clinics", label: "全台診所資料館" },
  { href: "/doctors", label: "醫師查詢" },
  { href: "/treatments", label: "查療程" },
  { href: "/cities", label: "各縣市" },
  { href: "/blog", label: "醫美專欄" },
  { href: "/faq", label: "常見問題" },
  { href: "/promotions", label: "幫你找優惠療程" },
  { href: "/clinic-update", label: "診所更新資料" },
] as const;

const LINE_CTA_URL = "https://lin.ee/6sTCRzm";

export default function SiteNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname.startsWith("/admin")) return null;
  if (pathname.startsWith("/booking")) return null;
  if (pathname.startsWith("/portal")) return null;

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "#fff",
        borderBottom: "1px solid #E2E8F0",
      }}
      role="navigation"
      aria-label="主導覽"
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}
          aria-label="360醫療AI大調查 首頁"
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: "#2B6CB0",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0,
              flexShrink: 0,
            }}
          >
            360
          </div>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A202C" }}>
              醫美AI大調查
            </div>
            <div style={{ fontSize: 10, color: "#718096", letterSpacing: "0.05em" }}>
              醫美評鑑・全台最大
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div
          className="nav-desktop"
          style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, justifyContent: "center" }}
        >
          {NAV_ITEMS.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#2B6CB0" : "#4A5568",
                  background: isActive ? "#EBF8FF" : "transparent",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Desktop CTA Buttons */}
        <div
          className="nav-cta"
          style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
        >
          <Link
            href="/partnership"
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "#2B6CB0",
              border: "1px solid #2B6CB0",
              background: "transparent",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            我想合作
          </Link>
          <a
            href={LINE_CTA_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: "#ED8936",
              textDecoration: "none",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 6px rgba(237,137,54,.35)",
            }}
          >
            免費諮詢
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="展開選單"
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 6,
            flexDirection: "column",
            gap: 5,
          }}
        >
          <span style={{ display: "block", width: 22, height: 2, background: "#4A5568", borderRadius: 2 }} />
          <span style={{ display: "block", width: 22, height: 2, background: "#4A5568", borderRadius: 2 }} />
          <span style={{ display: "block", width: 22, height: 2, background: "#4A5568", borderRadius: 2 }} />
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div
          style={{
            borderTop: "1px solid #E2E8F0",
            background: "#fff",
            padding: "12px 16px 16px",
          }}
        >
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: "block",
                padding: "10px 8px",
                fontSize: 14,
                color: "#4A5568",
                textDecoration: "none",
                borderBottom: "1px solid #F7FAFC",
              }}
            >
              {label}
            </Link>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Link
              href="/partnership"
              onClick={() => setMenuOpen(false)}
              style={{ flex: 1, padding: "10px 0", textAlign: "center", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#2B6CB0", border: "1px solid #2B6CB0", textDecoration: "none" }}
            >
              我想合作
            </Link>
            <a
              href={LINE_CTA_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              style={{ flex: 1, padding: "10px 0", textAlign: "center", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff", background: "#ED8936", textDecoration: "none" }}
            >
              免費諮詢
            </a>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-cta { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
