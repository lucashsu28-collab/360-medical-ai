"use client";

/**
 * 霧化報告：用於單一診所/醫師詳細頁的完整報告區塊。
 * 內容以 blur 遮罩，CTA 引導加 LINE 解鎖。
 * 若提供 lineEntry，按鈕會開啟 LIFF 頁（帶參數加好友，加好友後自動發報告）。
 */
export interface LineEntry {
  type: "clinic" | "doctor";
  id: string;
  name: string;
}

export interface FogReportProps {
  /** 被霧化遮罩的報告內容（仍會渲染，但被 blur 覆蓋） */
  children: React.ReactNode;
  /** LINE 連結（未提供 lineEntry 時使用） */
  lineUrl?: string;
  /** 帶參數加 LINE：點擊時開啟 LIFF，寫入 state 後加好友可自動收到報告 */
  lineEntry?: LineEntry;
  /** 可選副標或說明，顯示在 CTA 下方 */
  subtitle?: string;
  /** 外層額外 class */
  className?: string;
}

const LINE_ADD_URL = "https://lin.ee/6sTCRzm";

export default function FogReport({
  children,
  lineUrl = LINE_ADD_URL,
  lineEntry,
  subtitle,
  className = "",
}: FogReportProps) {
  const handleAddLine = () => {
    if (!lineEntry) return;
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    console.log("LIFF ID:", process.env.NEXT_PUBLIC_LIFF_ID);
    if (liffId && lineEntry) {
      const params = new URLSearchParams({
        type: lineEntry.type,
        id: lineEntry.id,
        name: lineEntry.name,
      });
      window.open(`https://liff.line.me/${liffId}?${params}`, "_blank");
    } else {
      localStorage.setItem("lineEntry", JSON.stringify(lineEntry));
      window.open(LINE_ADD_URL, "_blank");
    }
  };

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
        {lineEntry ? (
          <button
            type="button"
            onClick={handleAddLine}
            className="rounded-[8px] bg-[var(--blue)] px-6 py-3 text-center text-[14px] font-bold text-white shadow-[0_2px_8px_rgba(0,70,184,.2)] transition-colors duration-200 hover:bg-[var(--blue2)]"
          >
            加 LINE 解鎖完整報告
          </button>
        ) : (
          <a
            href={lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[8px] bg-[var(--blue)] px-6 py-3 text-center text-[14px] font-bold text-white shadow-[0_2px_8px_rgba(0,70,184,.2)] transition-colors duration-200 hover:bg-[var(--blue2)]"
          >
            加 LINE 解鎖完整報告
          </a>
        )}
        {subtitle ? (
          <p className="max-w-[280px] text-center text-[12px] text-[var(--muted)] leading-snug">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
