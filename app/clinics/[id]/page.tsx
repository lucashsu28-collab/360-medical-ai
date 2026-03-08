import Link from "next/link";
import { notFound } from "next/navigation";
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

function ReviewItem({
  author,
  date,
  rating,
  text,
}: {
  author: string;
  date: string;
  rating: number;
  text: string;
}) {
  return (
    <article className="border-b border-[var(--line)] py-4 last:border-b-0">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[13px] font-bold text-[var(--ink)]">{author}</span>
        <span className="text-[12px] text-[var(--muted)]">{date}</span>
        <span
          className="text-[13px] font-medium"
          style={{ fontFamily: "var(--font-dm-mono)", color: "var(--blue)" }}
        >
          {rating.toFixed(1)}
        </span>
      </div>
      <p className="text-[13px] leading-relaxed text-[var(--ink2)]">{text}</p>
    </article>
  );
}

const FAKE_REVIEWS = [
  { author: "王**", date: "2024-02-15", rating: 4.5, text: "醫師解說清楚，術後恢復順利，整體滿意。唯一是預約要提早。" },
  { author: "林**", date: "2024-01-28", rating: 5, text: "環境乾淨，護理師很親切，雷射效果符合預期，會再回診。" },
  { author: "陳**", date: "2024-01-10", rating: 4, text: "價格透明，沒有強迫推銷。術後有一點紅腫，幾天就退了。" },
  { author: "張**", date: "2023-12-22", rating: 4.5, text: "第一次做醫美有點緊張，醫師和團隊都很專業，體驗不錯。" },
  { author: "李**", date: "2023-12-05", rating: 4, text: "交通方便，診所空間舒適。療程效果中規中矩，可接受。" },
];

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

  /** 真實資料目前只有 google_rating，其餘四維度顯示「資料收集中」 */
  const scores: ScoreCardScores = {
    judicial: null,
    google: clinic.google_rating ?? null,
    legal: null,
    media: null,
    social: null,
    total: clinic.score ?? null,
  };

  const tags = clinic.treatments?.length
    ? clinic.treatments
    : clinic.specialty
      ? [clinic.specialty]
      : [];

  return (
    <div className="min-h-screen bg-[var(--paper)]">
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
            <section className="rounded-[14px] border border-[var(--line)] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,.04)]">
              <h2 className="mb-4 text-[16px] font-bold text-[var(--ink)]">
                消費者評論
              </h2>
              <p className="mb-4 text-[13px] text-[var(--muted)]">
                共 {reviewCount} 則評論 · 以下為精選摘要
              </p>
              <div className="divide-y-0">
                {FAKE_REVIEWS.map((r, i) => (
                  <ReviewItem
                    key={i}
                    author={r.author}
                    date={r.date}
                    rating={r.rating}
                    text={r.text}
                  />
                ))}
              </div>
            </section>
          </main>

          {/* 右側欄 */}
          <aside className="w-full shrink-0 lg:w-[300px]">
            <div className="sticky top-[78px] space-y-6 rounded-[14px] border border-[var(--line)] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,.04)]">
              {clinic.isPartner && (
                <div className="rounded-[8px] bg-[var(--blue-xl)] px-3 py-2 text-center text-[13px] font-bold text-[var(--blue)]">
                  ✦ 合作診所
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
