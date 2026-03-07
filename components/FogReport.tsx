"use client";

/**
 * 霧化報告：用於單一診所詳細頁的完整報告區塊，非搜尋結果頁。
 * 內容以 blur 遮罩，CTA 引導加 LINE 解鎖。
 */
export interface FogReportProps {
  /** 被霧化遮罩的報告內容（仍會渲染，但被 blur 覆蓋） */
  children: React.ReactNode;
  /** LINE 連結，預設 #line */
  lineUrl?: string;
  /** 可選副標或說明，顯示在 CTA 下方 */
  subtitle?: string;
  /** 外層額外 class */
  className?: string;
}

export default function FogReport({
  children,
  lineUrl = "#line",
  subtitle,
  className = "",
}: FogReportProps) {
  return (
    <div
      className={
        "relative overflow-hidden rounded-[14px] border border-[var(--line)] bg-white " +
        className
      }
    >
      <div className="relative z-0">{children}</div>

      <div
        className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 px-4 py-8"
        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        aria-hidden
      />

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 px-4 py-8">
        <a
          href={lineUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-[8px] bg-[var(--blue)] px-6 py-3 text-center text-[14px] font-bold text-white shadow-[0_2px_8px_rgba(0,70,184,.2)] transition-colors duration-200 hover:bg-[var(--blue2)]"
        >
          加 LINE 解鎖完整報告
        </a>
        {subtitle ? (
          <p className="max-w-[280px] text-center text-[12px] text-[var(--muted)] leading-snug">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
