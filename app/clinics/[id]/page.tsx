import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ScoreCard from "@/components/ScoreCard";
import FogReport from "@/components/FogReport";
import DoctorSearch from "@/components/DoctorSearch";
import ClinicReviewsList from "@/components/ClinicReviewsList";
import type { ScoreCardScores } from "@/components/ScoreCard";

interface Doctor {
  name: string;
  title?: string;
  specialty?: string;
}

interface Promotion {
  title: string;
  price?: string;
  description?: string;
  valid_until?: string;
}

interface GalleryItem {
  url: string;
  caption?: string;
}

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
  is_partner?: boolean;
  partner_since?: string | null;
  line_oa_url?: string | null;
  treatments?: string[];
  doctors?: Doctor[] | null;
  promotions?: Promotion[] | null;
  gallery?: GalleryItem[] | null;
  [key: string]: unknown;
}

function formatContStart(s: string | null | undefined): string {
  if (!s || s.length !== 8) return "—";
  return `${s.slice(0, 4)}/${s.slice(4, 6)}/${s.slice(6, 8)}`;
}

function FakeFogContent({ clinicName }: { clinicName: string }) {
  return (
    <div className="space-y-6 p-6 text-[var(--ink)]">
      <section>
        <h3 className="mb-3 text-[14px] font-bold text-[var(--ink)]">司法／申訴紀錄摘要</h3>
        <ul className="space-y-2 text-[13px] leading-relaxed text-[var(--ink2)]">
          <li>・民國 111 年 民事訴訟 案號 111 年度 醫字第 XX 號，與術後效果認知差異相關，調解成立。</li>
          <li>・民國 110 年 衛生局申訴 1 件，經查為溝通疏失，已改善並結案。</li>
        </ul>
      </section>
      <section>
        <h3 className="mb-3 text-[14px] font-bold text-[var(--ink)]">負評關鍵字彙整（僅供參考）</h3>
        <p className="text-[13px] leading-relaxed text-[var(--muted)]">
          以下由系統彙整自公開評論，加 LINE 可查看完整報告與時間軸。與「{clinicName}」相關的常見負面關鍵字：等候時間、預約難、價格未事先說明、術後衛教不足。
        </p>
      </section>
      <section>
        <h3 className="mb-3 text-[14px] font-bold text-[var(--ink)]">完整報告內容</h3>
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
  const res = await fetch(`${apiUrl}/api/clinics/${id}`, { next: { revalidate: 3600 } });
  if (!res.ok) return { title: "診所不存在" };
  const clinic = (await res.json()) as ApiClinic;
  return {
    title: `${clinic.name} 評鑑報告｜360醫美大調查`,
    description: `${clinic.name}位於${clinic.address ?? ""}，360綜合評分 ${clinic.score != null ? clinic.score.toFixed(1) : "—"} 分。`,
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
  const res = await fetch(`${apiUrl}/api/clinics/${id}`, { next: { revalidate: 3600 } });
  if (!res.ok) notFound();
  const clinic = (await res.json()) as ApiClinic;
  if (!clinic?.id) notFound();

  const isPartner = !!(clinic.is_partner || clinic.partner_since);
  const lineOaUrl = clinic.line_oa_url || "https://lin.ee/6sTCRzm";
  const phone = clinic.phone || "—";
  const reviewCount = clinic.google_review_count ?? 0;

  const breakdown = clinic.score_breakdown as Record<string, number> | undefined;
  const scores: ScoreCardScores = {
    judicial: breakdown?.judicial ?? null,
    google: breakdown?.google ?? null,
    legal: breakdown?.legal ?? (clinic.legal_score as number) ?? null,
    media: breakdown?.media ?? null,
    social: breakdown?.social ?? null,
    total: clinic.score ?? null,
  };

  const tags = clinic.treatments?.length ? clinic.treatments : clinic.specialty ? [clinic.specialty] : [];
  const doctors = clinic.doctors ?? [];
  const promotions = clinic.promotions ?? [];
  const gallery = clinic.gallery ?? [];

  return (
    <div className="min-h-screen bg-[var(--paper)]" style={isPartner ? { paddingBottom: 80 } : undefined}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalOrganization",
            name: clinic.name,
            address: { "@type": "PostalAddress", streetAddress: clinic.address, addressCountry: "TW" },
            telephone: clinic.phone || undefined,
            url: clinic.website || undefined,
            aggregateRating: clinic.google_rating ? {
              "@type": "AggregateRating",
              ratingValue: clinic.google_rating,
              reviewCount: clinic.google_review_count || 0,
              bestRating: 5,
              worstRating: 1,
            } : undefined,
            medicalSpecialty: clinic.specialty || undefined,
          }),
        }}
      />

      {/* Partner Hero Banner */}
      {isPartner && (
        <div className="border-b border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-5 md:px-8">
          <div className="mx-auto flex max-w-[1060px] items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-700">
                ✦ 合作診所
              </span>
              <span className="text-[13px] text-amber-700">
                此診所已加入 360醫療AI大調查合作計畫，資料更完整
              </span>
            </div>
            <a
              href={lineOaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden shrink-0 rounded-[8px] bg-[#06C755] px-5 py-2 text-[13px] font-bold text-white shadow-[0_2px_8px_rgba(6,199,85,.3)] transition-opacity hover:opacity-90 sm:block"
            >
              立即預約諮詢
            </a>
          </div>
        </div>
      )}

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
            <div className={`rounded-[14px] border bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,.04)] ${isPartner ? "border-amber-300 shadow-[0_0_0_1px_rgba(251,191,36,.15)]" : "border-[var(--line)]"}`}>
              <div className="mb-4 flex items-start gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[14px] border border-[var(--line)] bg-[var(--off)] text-2xl" aria-hidden>
                  🏥
                </div>
                <div>
                  <h1 className="text-xl font-black text-[var(--ink)] md:text-2xl" style={{ fontFamily: "var(--font-serif)" }}>
                    {clinic.name}
                  </h1>
                  {clinic.specialty && (
                    <p className="mt-1 text-[13px] text-[var(--muted)]">{clinic.specialty}</p>
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
                  <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-[var(--blue)] hover:underline">
                    官方網站 →
                  </a>
                </p>
              )}
            </div>

            {/* Partner: 優惠方案 */}
            {isPartner && promotions.length > 0 && (
              <section>
                <h2 className="mb-4 text-[16px] font-bold text-[var(--ink)]">優惠方案</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {promotions.map((p, i) => (
                    <div key={i} className="rounded-[12px] border border-amber-200 bg-amber-50 p-4">
                      <p className="mb-1 text-[14px] font-bold text-[var(--ink)]">{p.title}</p>
                      {p.price && <p className="text-[13px] font-semibold text-amber-700">{p.price}</p>}
                      {p.description && <p className="mt-1 text-[12px] text-[var(--muted)]">{p.description}</p>}
                      {p.valid_until && <p className="mt-2 text-[11px] text-[var(--muted)]">有效期至 {p.valid_until}</p>}
                      <a
                        href={lineOaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block rounded-[6px] bg-[#06C755] px-4 py-1.5 text-[12px] font-bold text-white"
                      >
                        預約此方案
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Partner: 醫師團隊 */}
            {isPartner && doctors.length > 0 && (
              <section>
                <h2 className="mb-4 text-[16px] font-bold text-[var(--ink)]">醫師團隊</h2>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {doctors.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-[12px] border border-[var(--line)] bg-white p-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--off)] text-xl">
                        👨‍⚕️
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-[var(--ink)]">{d.name}</p>
                        {d.title && <p className="text-[12px] text-[var(--muted)]">{d.title}</p>}
                        {d.specialty && <p className="text-[12px] text-[var(--blue)]">{d.specialty}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Partner: Gallery */}
            {isPartner && gallery.length > 0 && (
              <section>
                <h2 className="mb-4 text-[16px] font-bold text-[var(--ink)]">診所環境</h2>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                  {gallery.map((g, i) => (
                    <div key={i} className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--off)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.url} alt={g.caption || `診所照片 ${i + 1}`} className="h-40 w-full object-cover" loading="lazy" />
                      {g.caption && <p className="px-2 py-1.5 text-[11px] text-[var(--muted)]">{g.caption}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 360 綜合評分 */}
            <section>
              <h2 className="mb-4 text-[16px] font-bold text-[var(--ink)]">360 綜合評分</h2>
              <div className="mb-3 text-[13px] text-[var(--muted)]">
                {clinic.google_rating != null && (
                  <>Google 評分 {clinic.google_rating.toFixed(1)} · {reviewCount.toLocaleString("zh-TW")} 則評論</>
                )}
              </div>
              <ScoreCard scores={scores} showTotal={true} />
            </section>

            {/* 霧化完整報告 */}
            <section>
              <h2 className="mb-4 text-[16px] font-bold text-[var(--ink)]">完整報告（司法／申訴／負評彙整）</h2>
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
                <h2 className="mb-4 text-[16px] font-bold text-[var(--ink)]">消費者評論</h2>
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
                <ClinicReviewsList clinicId={clinic.id} />
                <p className="text-[12px] text-[var(--muted)] border-t border-[var(--line)] pt-3 mt-4">
                  評論內容由 Google Maps 用戶提供，360醫療AI大調查不對評論內容負責。
                </p>
              </section>
            )}

            {/* Non-partner upgrade CTA */}
            {!isPartner && (
              <div className="rounded-[14px] border border-dashed border-[var(--blue)] bg-[var(--blue-xl)] p-6 text-center">
                <p className="mb-1 text-[15px] font-bold text-[var(--ink)]">想讓診所頁面更完整？</p>
                <p className="mb-4 text-[13px] text-[var(--muted)]">
                  加入合作計畫，展示優惠方案、醫師團隊與診所環境，讓患者更了解您
                </p>
                <Link
                  href="/partnership"
                  className="inline-block rounded-[8px] bg-[var(--blue)] px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_2px_8px_rgba(0,70,184,.2)] transition-colors hover:bg-[var(--blue2)]"
                >
                  了解合作方案 →
                </Link>
              </div>
            )}
          </main>

          {/* 右側欄 */}
          <aside className="w-full shrink-0 lg:w-[300px]">
            <div className={`sticky top-[78px] space-y-6 rounded-[14px] border bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,.04)] ${isPartner ? "border-amber-300" : "border-[var(--line)]"}`}>
              {isPartner && (
                <div className="rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-center text-[13px] font-bold text-amber-700">
                  ✦ 合作診所
                </div>
              )}
              {tags.length > 0 && (
                <div>
                  <h3 className="mb-3 text-[14px] font-bold text-[var(--ink)]">療程項目</h3>
                  <ul className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <li key={tag}>
                        <Link
                          href={`/promotions?q=${encodeURIComponent(tag)}`}
                          className="rounded-[99px] border border-[var(--line)] bg-white px-3 py-1.5 text-[12px] text-[var(--ink2)] transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)]"
                        >
                          {tag}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!isPartner && (
                <div>
                  <h3 className="mb-3 text-[14px] font-bold text-[var(--ink)]">本院醫師</h3>
                  <DoctorSearch embedded />
                </div>
              )}
              <a
                href={lineOaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full rounded-[8px] py-3 text-center text-[14px] font-bold text-white transition-opacity ${isPartner ? "bg-[#06C755] shadow-[0_2px_8px_rgba(6,199,85,.25)] hover:opacity-90" : "bg-[var(--blue)] shadow-[0_2px_8px_rgba(0,70,184,.2)] hover:bg-[var(--blue2)]"}`}
              >
                {isPartner ? "立即預約諮詢" : "加 LINE 免費諮詢"}
              </a>
            </div>
          </aside>
        </div>
      </div>

      {/* Partner Fixed Bottom CTA */}
      {isPartner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-amber-200 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,.08)]">
          <div className="mx-auto flex max-w-[1060px] items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-bold text-[var(--ink)]">{clinic.name}</p>
              <p className="text-[12px] text-[var(--muted)]">透過 LINE OA 預約諮詢</p>
            </div>
            <a
              href={lineOaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-[8px] bg-[#06C755] px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_2px_8px_rgba(6,199,85,.3)] transition-opacity hover:opacity-90"
            >
              立即預約諮詢
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
