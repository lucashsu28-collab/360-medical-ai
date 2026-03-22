import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ScoreCard from "@/components/ScoreCard";
import FogReport from "@/components/FogReport";
import DoctorSearch from "@/components/DoctorSearch";
import type { ScoreCardScores } from "@/components/ScoreCard";

/** 後端 API 回傳的單一診所格式 */
interface ApiClinic {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  specialty?: string;
  score?: number | null;
  google_rating?: number | null;
  google_review_count?: number | null;
  website?: string | null;
  cont_start?: string | null;
  isPartner?: boolean;
  treatments?: string[];
  [key: string]: unknown;
}

function formatContStart(s: string | null | undefined): string {
  if (!s || s.length !== 8) return "—";
  return `${s.slice(0, 4)}/${s.slice(4, 6)}/${s.slice(6, 8)}`;
}

/** 霧化區塊內的糾紛與負評彙整（保留原本 FogReport 內容） */
function FakeFogContent({ clinicName }: { clinicName: string }) {
  return (
    <div className="space-y-6 p-6 text-[var(--ink)]">
      <section>
        <h3 className="mb-3 text-[14px] font-bold text-[var(--ink)]">
          司法／申訴紀錄摘要
        </h3>
        <ul className="space-y-2 text-[13px] leading-relaxed text-[var(--ink2)]">
          <li>・民國 111 年 民事訴訟 案號 111 年度 醫字第 XX 號，與術後效果認知差異相關，調解成立。</li>
          <li>・民國 110 年 衛生局申訴 1 件，經查為溝通疏失，已改善並結案。</li>
        </ul>
      </section>
      <section>
        <h3 className="mb-3 text-[14px] font-bold text-[var(--ink)]">
          負評關鍵字彙整（僅供參考）
        </h3>
        <p className="text-[13px] leading-relaxed text-[var(--muted)]">
          以下由系統彙整自公開評論，加 LINE 可查看完整報告與時間軸。與「{clinicName}」相關的常見負面關鍵字：等候時間、預約難、價格未事先說明、術後衛教不足。
        </p>
      </section>
      <section>
        <h3 className="mb-3 text-[14px] font-bold text-[var(--ink)]">
          完整報告內容
        </h3>
        <p className="text-[13px] leading-relaxed text-[var(--muted)]">
          含判決書案號、申訴案進度、媒體報導摘要、社群討論情緒分析等，解鎖後可下載 PDF。
        </p>
      </section>
    </div>
  );
}


export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const res = await fetch(`${apiUrl}/api/clinics/${id}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return { title: "診所不存在" };
  const clinic = (await res.json()) as ApiClinic;

  return {
    title: `${clinic.name} 評鑑報告｜360醫美大調查`,
    description: `${clinic.name}位於${clinic.address ?? ""}，360綜合評分 ${clinic.score != null ? clinic.score.toFixed(1) : "—"} 分，含司法糾紛、Google評分、合法登記等多維度分析。`,
    openGraph: {
      title: `${clinic.name}｜360醫美評鑑`,
      description: `查看 ${clinic.name} 的完整評鑑報告`,
      url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/clinics/${id}`,
    },
  };
}

export default async function ClinicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const res = await fetch(`${apiUrl}/api/clinics/${id}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) notFound();
  const clinic = (await res.json()) as ApiClinic;
  if (!clinic?.id) notFound();

  const phone = clinic.phone || "—";
  const reviewCount = clinic.google_review_count ?? 0;

  const breakdown = clinic.score_breakdown as Record<string, number> | undefined;

  const scores: ScoreCardScores = {
    judicial: breakdown?.judicial ?? null,
    google: clinic.google_rating ?? null,
    legal: (clinic.legal_score as number) ?? breakdown?.legal ?? null,
    media: breakdown?.media ?? null,
    social: breakdown?.social ?? null,
    total: clinic.score ?? null,
  };

  const tags = clinic.treatments?.length
    ? clinic.treatments
    : clinic.specialty
      ? [clinic.specialty]
      : [];

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalOrganization",
            "name": clinic.name,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": clinic.address,
              "addressCountry": "TW",
            },
            "telephone": clinic.phone || undefined,
            "url": clinic.website || undefined,
            "aggregateRating": clinic.google_rating ? {
              "@type": "AggregateRating",
              "ratingValue": clinic.google_rating,
              "reviewCount": clinic.google_review_count || 0,
              "bestRating": 5,
              "worstRating": 1,
            } : undefined,
            "medicalSpecialty": clinic.specialty || undefined,
          }),
        }}
      />
      <div className="mx-auto max-w-[1060px] px-4 py-8 md:px-8">
        <nav className="mb-6 text-[12px] text-[var(--muted)]" aria-label="麵包屑">
          <Link href="/" className="hover:text-[var(--blue)]">首頁</Link>
          <span className="mx-1.5">/</span>
          <Link href="/clinics" className="hover:text-[var(--blue)]">查診所</Link>
          <span className="mx-1.5">/</span>
          <span className="text-[var(--ink)]">{clinic.name}</span>
        </nav>

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          <main className="min-w-0 flex-1 space-y-8">
            {/* 基本資訊 */}
            <div className="rounded-[14px] border border-[var(--line)] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,.04)]">
              <div className="mb-4 flex items-start gap-4">
                <div
                  className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[14px] border border-[var(--line)] bg-[var(--off)] text-2xl"
                  aria-hidden
                >
                  🏥
                </div>
                <div>
                  <h1
                    className="text-xl font-black text-[var(--ink)] md:text-2xl"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {clinic.name}
                  </h1>
                  {clinic.specialty && (
                    <p className="mt-1 text-[13px] text-[var(--muted)]">
                      {clinic.specialty}
                    </p>
                  )}
                </div>
              </div>
              <ul className="space-y-2 text-[13px] text-[var(--ink2)]">
                <li>地址：{clinic.address || "—"}</li>
                <li>電話：{phone}</li>
                {clinic.cont_start && (
                  <li>健保特約開始：{formatContStart(clinic.cont_start)}</li>
                )}
              </ul>
              {clinic.website && (
                <p className="mt-3">
                  <a
                    href={clinic.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] font-medium text-[var(--blue)] hover:underline"
                  >
                    官方網站 →
                  </a>
                </p>
              )}
            </div>

            {/* 360 綜合評分 + 五維度（僅 Google 有值，其餘「資料收集中」） */}
            <section>
              <h2 className="mb-4 text-[16px] font-bold text-[var(--ink)]">
                360 綜合評分
              </h2>
              <div className="mb-3 text-[13px] text-[var(--muted)]">
                {clinic.google_rating != null && (
                  <>Google 評分 {clinic.google_rating.toFixed(1)} · {reviewCount.toLocaleString("zh-TW")} 則評論</>
                )}
              </div>
              <ScoreCard scores={scores} showTotal={true} />
            </section>

            {/* 霧化完整報告 */}
            <section>
              <h2 className="mb-4 text-[16px] font-bold text-[var(--ink)]">
                完整報告（司法／申訴／負評彙整）
              </h2>
              <FogReport
                subtitle="解鎖後可查看判決書案號、申訴進度與完整負評分析"
                lineEntry={{ type: "clinic", id: clinic.id, name: clinic.name }}
              >
                <FakeFogContent clinicName={clinic.name} />
              </FogReport>
            </section>

            {/* 消費者評論 */}
            {clinic.google_rating != null && (
              <section className="rounded-[14px] border border-[var(--line)] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,.04)]">
                <h2 className="mb-4 text-[16px] font-bold text-[var(--ink)]">
                  消費者評論
                </h2>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-4xl font-black text-[var(--blue)]">{clinic.google_rating.toFixed(1)}</div>
                    <div className="text-[12px] text-[var(--muted)] mt-1">Google 評分</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] text-[var(--ink2)] mb-3">
                      共 <strong>{reviewCount.toLocaleString("zh-TW")}</strong> 則 Google 評論
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-4 py-2 text-[13px] font-medium text-[var(--blue)] transition-colors hover:border-[var(--blue)]"
                    >
                      查看 Google Maps 完整評論 →
                    </a>
                  </div>
                </div>
                <p className="text-[12px] text-[var(--muted)] border-t border-[var(--line)] pt-3">
                  評論內容由 Google Maps 用戶提供，360醫療AI大調查不對評論內容負責。
                </p>
              </section>
            )}
          </main>

          {/* 右側欄 */}
          <aside className="w-full shrink-0 lg:w-[300px]">
            <div className="sticky top-[78px] space-y-6 rounded-[14px] border border-[var(--line)] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,.04)]">
              {clinic.isPartner && (
                <div className="rounded-[8px] bg-[var(--blue-xl)] px-3 py-2 text-center text-[13px] font-bold text-[var(--blue)]">
                  ✦ 診所資料館
                </div>
              )}
              {tags.length > 0 && (
                <div>
                  <h3 className="mb-3 text-[14px] font-bold text-[var(--ink)]">
                    療程項目
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <li key={tag}>
                        <Link
                          href={`/treatments?category=laser&q=${encodeURIComponent(tag)}`}
                          className="rounded-[99px] border border-[var(--line)] bg-white px-3 py-1.5 text-[12px] text-[var(--ink2)] transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)]"
                        >
                          {tag}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <h3 className="mb-3 text-[14px] font-bold text-[var(--ink)]">
                  本院醫師
                </h3>
                <DoctorSearch embedded />
              </div>
              <a
                href="https://lin.ee/6sTCRzm"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-[8px] bg-[var(--blue)] py-3 text-center text-[14px] font-bold text-white shadow-[0_2px_8px_rgba(0,70,184,.2)] transition-colors hover:bg-[var(--blue2)]"
              >
                預約諮詢
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
