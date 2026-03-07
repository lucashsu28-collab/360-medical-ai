"use client";

import Link from "next/link";
import type { Treatment } from "@/data/treatments";

const HEAD_GRADIENTS = [
  "linear-gradient(135deg,#c8e6fa,#90caf9)",
  "linear-gradient(135deg,#fce4ec,#f48fb1)",
  "linear-gradient(135deg,#f3e5f5,#ce93d8)",
  "linear-gradient(135deg,#e8f5e9,#a5d6a7)",
  "linear-gradient(135deg,#fff9c4,#fff176)",
  "linear-gradient(135deg,#fbe9e7,#ffab91)",
  "linear-gradient(135deg,#e0f7fa,#80deea)",
  "linear-gradient(135deg,#ede7f6,#b39ddb)",
  "linear-gradient(135deg,#f9fbe7,#dce775)",
];

function formatPrice(n: number): string {
  return `NT$${n.toLocaleString("zh-TW")}`;
}

export interface TreatmentCardProps extends Treatment {
  /** 上方圖示區背景圖 URL，不傳則用漸層 + imagePlaceholder */
  imageUrl?: string | null;
}

export default function TreatmentCard({
  id,
  name,
  description,
  priceMin,
  priceMax,
  clinicCount,
  isPopular,
  imagePlaceholder,
  imageUrl,
}: TreatmentCardProps) {
  const href = `/treatments/${id}`;
  const headIndex =
    Math.abs(id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) %
    HEAD_GRADIENTS.length;
  const headBg = HEAD_GRADIENTS[headIndex];

  return (
    <Link
      href={href}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-[14px] border-[1.5px] border-[var(--line)] bg-white transition-all duration-[0.22s] hover:border-[var(--blue)] hover:shadow-[0_12px_32px_rgba(0,0,0,.09)] hover:-translate-y-0.5"
    >
      <div
        className="relative flex h-[90px] items-center justify-center text-[38px]"
        style={{ background: headBg }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span aria-hidden>{imagePlaceholder}</span>
        )}
        {isPopular && (
          <span className="absolute right-2 top-2 rounded bg-[var(--red)] px-1.5 py-0.5 text-[9px] font-bold text-white">
            熱門
          </span>
        )}
      </div>
      <div className="border-t-0 px-4 py-3.5">
        <div className="mb-1 text-[15px] font-bold text-[var(--ink)]">
          {name}
        </div>
        <div className="mb-2.5 text-[11px] leading-snug text-[var(--muted)] line-clamp-3">
          {description}
        </div>
        <div className="mb-2.5 inline-flex items-center gap-1 rounded-full bg-[var(--blue-lt)] px-2 py-0.5 text-[10px] font-bold text-[var(--blue)]">
          市場行情 NT${priceMin.toLocaleString("zh-TW")}–{priceMax.toLocaleString("zh-TW")}
        </div>
        <div className="flex items-center justify-between border-t border-[var(--line)] pt-2.5">
          <div>
            <div
              className="text-[13px] font-medium text-[var(--blue)]"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              {formatPrice(priceMin)}起
            </div>
            <div className="text-[11px] text-[var(--muted)]">
              全台 {clinicCount.toLocaleString("zh-TW")} 家診所提供
            </div>
          </div>
          <span
            className="text-[16px] text-[var(--light)] transition-colors duration-[0.18s] group-hover:text-[var(--blue)]"
            aria-hidden
          >
            ›
          </span>
        </div>
      </div>
    </Link>
  );
}
