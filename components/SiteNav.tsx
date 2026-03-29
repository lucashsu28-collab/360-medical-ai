"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/clinics", label: "診所資料館" },
  { href: "/doctors", label: "醫師查詢" },
  { href: "/treatments", label: "查療程" },
  { href: "/cities", label: "各縣市" },
  { href: "/blog", label: "醫美專欄" },
  { href: "/faq", label: "常見問題" },
  { href: "/promotions", label: "優惠療程搜尋" },
  { href: "/about", label: "關於我們" },
  { href: "/scoring", label: "評分標準" },
  { href: "/clinic-update", label: "診所更新資料" },
] as const;

/** 加 LINE 連結 */
const LINE_CTA_URL = "https://lin.ee/6sTCRzm";

export default function SiteNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      className="sticky top-0 z-[100] flex h-14 items-center justify-between border-b border-[var(--line)] bg-white/97 px-4 backdrop-blur-[16px] md:h-[62px] md:px-12"
      role="navigation"
      aria-label="主導覽"
    >
      <Link
        href="/"
        className="flex items-center gap-2.5 text-[#0d1b2a] no-underline md:gap-[11px]"
        aria-label="360醫療AI大調查 首頁"
      >
        <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-[var(--blue)] md:h-[38px] md:w-[38px]">
          <span
            className="relative z-10 font-[family-name:var(--font-dm-mono)] text-xs font-medium tracking-tight text-white"
            style={{ fontFamily: "var(--font-dm-mono)" }}
          >
            360
          </span>
          <span
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,.18), transparent)",
            }}
            aria-hidden
          />
        </div>
        <div className="leading-[1.15]">
          <div
            className="text-base font-bold text-[var(--ink)] md:text-[16px]"
            style={{ fontFamily: "var(--font-noto-serif-tc)" }}
          >
            醫療<span className="text-[var(--blue)] not-italic">AI</span>大調查
          </div>
          <div className="text-[9.5px] font-medium tracking-wider text-[var(--muted)]">
            醫美評鑑 · 全台最大
          </div>
        </div>
      </Link>

      <div className="flex flex-wrap items-center justify-end gap-0.5 md:flex-nowrap md:gap-1">
        {NAV_ITEMS.map(({ href, label }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-[7px] px-2 py-1.5 text-[13px] font-medium no-underline transition-all duration-[0.18s] md:px-3 md:py-[7px] ${
                isActive
                  ? "bg-[var(--blue-lt)] text-[var(--blue)]"
                  : "text-[var(--muted)] hover:bg-[var(--blue-lt)] hover:text-[var(--blue)]"
              }`}
            >
              {label}
            </Link>
          );
        })}
        <div
          className="mx-1.5 h-5 w-px bg-[var(--line2)] md:mx-1.5"
          aria-hidden
        />
        <Link
          href="/partnership"
          className="rounded-[7px] bg-[var(--green)] px-4 py-2 text-[13px] font-bold text-white no-underline shadow-[0_2px_8px_rgba(0,135,90,.22)] transition-colors duration-200 hover:bg-[var(--green-hover,#006e48)] md:px-5 md:py-2"
        >
          我想合作
        </Link>
        <div
          className="mx-1.5 h-5 w-px bg-[var(--line2)] md:mx-1.5"
          aria-hidden
        />
        <a
          href={LINE_CTA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-[7px] bg-[var(--line-green)] px-4 py-2 text-[13px] font-bold text-white no-underline shadow-[0_2px_8px_rgba(6,199,85,.25)] transition-colors duration-200 hover:bg-[var(--line-green-hover)] md:px-5 md:py-2"
        >
          免費諮詢
        </a>
      </div>
    </nav>
  );
}
