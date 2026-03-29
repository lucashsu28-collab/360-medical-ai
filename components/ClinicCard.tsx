"use client";

import Link from "next/link";

/** 五維度評分（與 data/clinics 結構一致） */
export interface ClinicScores {
  judicial: number;
  google: number;
  legal: number;
  media: number;
  social: number;
  total: number;
}

export interface ClinicCardProps {
  /** 診所 id，用於 /clinics/[id] */
  id: string;
  name: string;
  /** 舊版：type；API：用 specialty 取代 */
  type?: string;
  address?: string;
  district?: string;
  /** 舊版標籤；API 無則不顯示 */
  tags?: string[];
  isPartner?: boolean;
  /** 舊版五維度；API 用 score + google_rating 取代 */
  scores?: ClinicScores;
  /** 舊版評論數；API 傳 review_count */
  reviewCount?: number;
  /** API：360 綜合評分（10 分制） */
  score?: number;
  /** API：科別 */
  specialty?: string | null;
  /** API：Google 評分 */
  google_rating?: number;
  /** API：Google 評論數 */
  review_count?: number;
  /** "row" = 列表頁橫式；"grid" = 首頁格狀 */
  variant?: "row" | "grid";
  detailBasePath?: string;
  imageUrl?: string | null;
  imagePlaceholder?: string;
}

const DIM_CONFIG = [
  { key: "judicial" as const, label: "司法", color: "var(--red)" },
  { key: "google" as const, label: "Google", color: "var(--blue)" },
  { key: "legal" as const, label: "合法", color: "var(--green)" },
  { key: "media" as const, label: "媒體", color: "var(--amber)" },
  { key: "social" as const, label: "社群", color: "var(--cyan)" },
] as const;

const THUMB_GRADIENTS = [
  "linear-gradient(135deg,#dbeafe,#bfdbfe)",
  "linear-gradient(135deg,#f3e8ff,#ddd6fe)",
  "linear-gradient(135deg,#dcfce7,#bbf7d0)",
  "linear-gradient(135deg,#fef3c7,#fde68a)",
  "linear-gradient(135deg,#fce7f3,#fbcfe8)",
];

const GRID_GRADIENTS = [
  "linear-gradient(135deg,#dbeafe,#e0f2fe)",
  "linear-gradient(135deg,#f3e8ff,#ede9fe)",
  "linear-gradient(135deg,#dcfce7,#d1fae5)",
];

function formatReviewCount(n: number): string {
  return `${n.toLocaleString("zh-TW")} 則評論`;
}

export default function ClinicCard({
  id,
  name,
  type,
  address,
  district,
  tags = [],
  isPartner = false,
  scores,
  reviewCount,
  score,
  specialty,
  google_rating,
  review_count,
  variant = "row",
  detailBasePath = "/clinics",
  imageUrl,
  imagePlaceholder = "🏥",
}: ClinicCardProps) {
  const href = `${detailBasePath}/${id}`;
  const thumbIndex = Math.abs(id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % THUMB_GRADIENTS.length;
  const gridIndex = thumbIndex % GRID_GRADIENTS.length;
  const thumbBg = THUMB_GRADIENTS[thumbIndex];
  const gridBg = GRID_GRADIENTS[gridIndex];
  /** 使用 API 格式（有 score / google_rating）時為 true */
  const useApiLayout = score != null && google_rating != null;
  const totalScore = useApiLayout ? score : scores?.total ?? 0;
  const displayReviewCount = useApiLayout ? (review_count ?? 0) : (reviewCount ?? 0);
  const addressShort = address ? (address.length > 20 ? `${address.slice(0, 20)}…` : address) : "";

  if (variant === "grid") {
    return (
      <Link
        href={href}
        className={`group flex cursor-pointer flex-col overflow-hidden rounded-[14px] border-[1.5px] bg-white transition-all duration-[0.22s] hover:shadow-[0_14px_36px_rgba(0,0,0,.09)] hover:-translate-y-0.5 ${
          isPartner
            ? "border-amber-400 hover:border-amber-500 shadow-[0_0_0_1px_rgba(251,191,36,.3)]"
            : "border-[var(--line)] hover:border-[var(--blue)]"
        }`}
      >
        <div
          className="relative flex h-[120px] items-center justify-center text-[44px]"
          style={{ background: gridBg }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden>{imagePlaceholder}</span>
          )}
          {isPartner && (
            <span className="absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[9px] font-bold text-black bg-amber-400">
              ✦ 合作診所
            </span>
          )}
          {district && (
            <span className="absolute right-2.5 top-2.5 rounded bg-white/90 px-2 py-1 text-[10px] font-bold text-[var(--ink2)] backdrop-blur-[4px]">
              {district}
            </span>
          )}
        </div>
        <div className="border-t-0 px-4 py-3.5">
          <div className="mb-1 text-[15px] font-bold text-[var(--ink)]">{name}</div>
          <div className="mb-2.5 flex flex-wrap gap-1">
            {tags.slice(0, 5).map((t) => (
              <span
                key={t}
                className="rounded-full bg-[var(--off)] px-2 py-0.5 text-[10px] text-[var(--muted)]"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-[var(--line)] pt-2.5">
            <div>
              <div
                className="text-[22px] font-medium text-[var(--blue)]"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                {totalScore.toFixed(1)}
              </div>
              <div className="text-[11px] text-[var(--muted)]">
                {formatReviewCount(displayReviewCount)}
              </div>
            </div>
            <span className="text-[18px] text-[var(--light)] transition-colors duration-[0.18s] group-hover:text-[var(--blue)]" aria-hidden>›</span>
          </div>
        </div>
      </Link>
    );
  }

  // variant === "row"
  return (
    <Link
      href={href}
      className={`flex cursor-pointer items-stretch overflow-hidden rounded-[14px] border-[1.5px] bg-white transition-all duration-[0.22s] hover:shadow-[0_12px_40px_rgba(0,0,0,.1)] hover:translate-x-0.5 ${
        isPartner
          ? "border-amber-400 hover:border-amber-500 shadow-[0_0_0_1px_rgba(251,191,36,.2)]"
          : "border-[var(--line)] hover:border-[var(--blue)]"
      }`}
    >
      <div
        className="relative flex w-[150px] flex-shrink-0 items-center justify-center text-[48px]"
        style={{ background: thumbBg }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden>{imagePlaceholder}</span>
        )}
        {isPartner && (
          <span className="absolute left-2 top-2.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-black bg-amber-400">
            ✦ 合作診所
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center px-5 py-4">
        <div className="text-[16px] font-bold text-[var(--ink)] mb-0.5">{name}</div>
        {useApiLayout ? (
          <>
            {specialty && (
              <span className="mb-1.5 inline-block w-fit rounded-full bg-[var(--blue-lt)] px-2 py-0.5 text-[10px] font-bold text-[var(--blue)]">
                {specialty}
              </span>
            )}
            {addressShort && (
              <div className="mb-2 text-[12px] text-[var(--muted)]">📍 {addressShort}</div>
            )}
            <div className="text-[12px] text-[var(--muted)]">
              Google {google_rating!.toFixed(1)} · {formatReviewCount(displayReviewCount)}
            </div>
          </>
        ) : (
          <>
            <span className="mb-1.5 inline-block w-fit rounded-full bg-[var(--blue-lt)] px-2 py-0.5 text-[10px] font-bold text-[var(--blue)]">
              {type}
            </span>
            {address && (
              <div className="mb-2 text-[12px] text-[var(--muted)]">📍 {address}</div>
            )}
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {tags.slice(0, 6).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-[var(--off)] px-2 py-0.5 text-[10px] text-[var(--muted)]"
                >
                  {t}
                </span>
              ))}
            </div>
            {scores && (
              <div className="flex flex-wrap gap-2.5">
                {DIM_CONFIG.map(({ key, label, color }) => (
                  <div
                    key={key}
                    className="flex items-center gap-1 text-[11px] text-[var(--muted)]"
                  >
                    <span
                      className="h-[7px] w-[7px] flex-shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {label} {scores[key].toFixed(1)}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <div className="flex w-[120px] flex-shrink-0 flex-col items-center justify-center gap-0.5 border-l border-[var(--line)] p-4">
        <div
          className="text-[28px] font-medium leading-none text-[var(--blue)]"
          style={{ fontFamily: "var(--font-dm-mono)" }}
        >
          {totalScore.toFixed(1)}
        </div>
        <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
          綜合評分
        </div>
        <div className="mt-0.5 text-[10px] text-[var(--muted)]">
          {formatReviewCount(displayReviewCount)}
        </div>
        <span
          className="mt-2 w-full rounded-md bg-[var(--blue-lt)] py-1.5 text-center text-[11px] font-bold text-[var(--blue)] transition-colors duration-[0.18s] hover:bg-[var(--blue)] hover:text-white"
          aria-hidden
        >
          查看評鑑
        </span>
      </div>
    </Link>
  );
}
