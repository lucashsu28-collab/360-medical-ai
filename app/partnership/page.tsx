import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "我想合作 | 360醫療AI大調查",
  description: "歡迎醫美診所與360醫療AI大調查洽談合作，合作頁面即將上線。",
};

export default function PartnershipPage() {
  return (
    <main className="flex min-h-[calc(100vh-62px)] flex-col items-center justify-center bg-[var(--paper)] px-4 py-20 text-center">
      <div className="mx-auto max-w-lg">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--green-lt,#e0f5ec)] text-4xl">
            🤝
          </div>
        </div>

        <span className="mb-4 inline-block rounded-full bg-[#e0f5ec] px-4 py-1.5 text-xs font-semibold tracking-wider text-[var(--green)]">
          即將上線
        </span>

        <h1
          className="mb-4 text-3xl font-black text-[var(--ink)] md:text-4xl"
          style={{ fontFamily: "var(--font-noto-serif-tc)" }}
        >
          我想合作
        </h1>

        <p className="mb-3 text-[15px] leading-relaxed text-[var(--muted)]">
          頁面建置中，敬請期待。
        </p>
        <p className="mb-10 text-[14px] leading-relaxed text-[var(--muted)]">
          若您有合作洽談需求，歡迎先透過 LINE 官方帳號與我們聯繫，
          我們將由專人為您說明合作方案與流程。
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href="https://lin.ee/6sTCRzm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-xl bg-[var(--line-green)] px-8 py-3 text-[15px] font-bold text-white no-underline shadow-[0_2px_12px_rgba(6,199,85,.25)] transition-colors hover:bg-[var(--line-green-hover)]"
          >
            LINE 聯繫我們
          </a>
          <Link
            href="/"
            className="inline-block rounded-xl border border-[var(--line)] bg-white px-6 py-3 text-[14px] font-semibold text-[var(--muted)] no-underline transition hover:border-[var(--blue)] hover:text-[var(--blue)]"
          >
            回到首頁
          </Link>
        </div>
      </div>
    </main>
  );
}
