"use client";

import Link from "next/link";
import type { Doctor } from "@/data/doctors";

const AVA_GRADIENTS = [
  "linear-gradient(135deg,#dbeafe,#bfdbfe)",
  "linear-gradient(135deg,#f3e8ff,#ddd6fe)",
  "linear-gradient(135deg,#dcfce7,#bbf7d0)",
  "linear-gradient(135deg,#fce7f3,#fbcfe8)",
];

export interface DoctorCardProps extends Doctor {
  /** 頭像圖片 URL，不傳則顯示佔位 emoji */
  imageUrl?: string | null;
  /** 頭像佔位 emoji */
  imagePlaceholder?: string;
}

/** 診所評分低於此值時以琥珀色顯示 */
const CLINIC_SCORE_WARN_THRESHOLD = 7.5;

export default function DoctorCard({
  id,
  name,
  title,
  specialty,
  clinicId,
  clinicName,
  clinicScore,
  specs,
  licenseValid,
  disputeCount,
  yearsOfPractice,
  district,
  imageUrl,
  imagePlaceholder = "👨‍⚕️",
}: DoctorCardProps) {
  const href = `/doctors/${id}`;
  const avaIndex = Math.abs(id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % AVA_GRADIENTS.length;
  const avaBg = AVA_GRADIENTS[avaIndex];
  const clinicScoreLow = clinicScore < CLINIC_SCORE_WARN_THRESHOLD;
  const hasDispute = disputeCount > 0;

  return (
    <Link
      href={href}
      className="flex cursor-pointer items-stretch overflow-hidden rounded-[14px] border-[1.5px] border-[var(--line)] bg-white transition-all duration-[0.22s] hover:border-[var(--blue)] hover:shadow-[0_12px_40px_rgba(0,0,0,.1)] hover:translate-x-0.5"
    >
      <div
        className="relative flex w-[110px] flex-shrink-0 items-center justify-center text-[40px]"
        style={{ background: avaBg }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden>{imagePlaceholder}</span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center px-5 py-4">
        <div className="text-[16px] font-bold text-[var(--ink)] mb-0.5">{name}</div>
        <span className="mb-1.5 inline-block w-fit rounded-full bg-[var(--blue-lt)] px-2 py-0.5 text-[10px] font-bold text-[var(--blue)]">
          {title}
        </span>
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--muted)]">
          <span>🏥 現職：{clinicName}</span>
          <span
            className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${clinicScoreLow ? "bg-[var(--amber-lt)] text-[var(--amber)]" : "bg-[var(--blue-lt)] text-[var(--blue)]"}`}
            style={{ fontFamily: "var(--font-dm-mono)" }}
          >
            診所評分 {clinicScore.toFixed(1)}
          </span>
        </div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {specs.slice(0, 6).map((s) => (
            <span
              key={s}
              className="rounded-full border border-[var(--line)] bg-[var(--off)] px-2 py-0.5 text-[10px] text-[var(--ink2)]"
            >
              {s}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] text-[var(--muted)]">
          <span>{licenseValid ? "✅ 執照有效" : "⚠️ 執照待查"}</span>
          <span>
            {hasDispute ? `⚠️ ${disputeCount} 件糾紛紀錄` : "✅ 無司法糾紛紀錄"}
          </span>
          <span>📅 執業 {yearsOfPractice} 年</span>
        </div>
      </div>
      <div className="flex w-[120px] flex-shrink-0 flex-col items-center justify-center gap-0.5 border-l border-[var(--line)] p-4">
        <div
          className="text-[26px] font-medium leading-none text-[var(--ink)]"
          style={{ fontFamily: "var(--font-dm-mono)" }}
        >
          {yearsOfPractice}
        </div>
        <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)] text-center">
          執業年資
        </div>
        <span
          className={`mt-1 inline-flex items-center gap-0.5 rounded px-2 py-1 text-[10px] font-bold ${
            hasDispute ? "bg-[var(--amber-lt)] text-[var(--amber)]" : "bg-[var(--green-lt)] text-[var(--green)]"
          }`}
        >
          {hasDispute ? `⚠️ ${disputeCount}件糾紛` : "✅ 無糾紛"}
        </span>
        <span
          className="mt-2 w-full rounded-md bg-[var(--blue-lt)] py-1.5 text-center text-[11px] font-bold text-[var(--blue)] transition-colors duration-[0.18s] hover:bg-[var(--blue)] hover:text-white"
          aria-hidden
        >
          查看醫師
        </span>
      </div>
    </Link>
  );
}
