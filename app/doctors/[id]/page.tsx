import Link from "next/link";
import { notFound } from "next/navigation";
import { doctors } from "@/data/doctors";
import type { Doctor } from "@/data/doctors";
import { clinics } from "@/data/clinics";
import FogReport from "@/components/FogReport";
import AddLineButton from "@/components/AddLineButton";

/** 現職診所小卡片（連結到診所頁） */
function ClinicCardSmall({
  clinicId,
  clinicName,
  clinicScore,
  type,
  district,
}: {
  clinicId: string;
  clinicName: string;
  clinicScore: number;
  type: string;
  district: string;
}) {
  const scoreLow = clinicScore < 7.5;
  return (
    <Link
      href={`/clinics/${clinicId}`}
      className="flex items-center gap-4 rounded-[14px] border border-[var(--line)] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,.04)] transition-colors hover:border-[var(--blue)] hover:shadow-[0_4px_12px_rgba(0,0,0,.08)]"
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[10px] bg-[var(--off)] text-xl">
        🏥
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-bold text-[var(--ink)]">{clinicName}</div>
        <div className="mt-0.5 text-[12px] text-[var(--muted)]">
          {type} · {district}
        </div>
        <span
          className={`mt-1.5 inline-block rounded px-2 py-0.5 text-[11px] font-medium ${scoreLow ? "bg-[var(--amber-lt)] text-[var(--amber)]" : "bg-[var(--blue-lt)] text-[var(--blue)]"}`}
          style={{ fontFamily: "var(--font-dm-mono)" }}
        >
          評分 {clinicScore.toFixed(1)}
        </span>
      </div>
      <span className="text-[12px] font-bold text-[var(--blue)]">查看診所 →</span>
    </Link>
  );
}

/** 假資料：霧化區塊內的詳細糾紛紀錄 */
function FakeDisputeContent({ doctorName }: { doctorName: string }) {
  return (
    <div className="space-y-6 p-6 text-[var(--ink)]">
      <section>
        <h3 className="mb-3 text-[14px] font-bold text-[var(--ink)]">
          詳細糾紛紀錄
        </h3>
        <ul className="space-y-3 text-[13px] leading-relaxed text-[var(--ink2)]">
          <li>
            ・民國 111 年 民事訴訟，案號 111 年度 醫字第 XX 號。原告主張術後效果與術前說明不符，請求損害賠償。案經調解成立，內容保密。
          </li>
          <li>
            ・民國 110 年 衛生局申訴案 1 件，事由：術後照護說明不足。經查醫師已補正衛教流程，申訴結案。
          </li>
        </ul>
      </section>
      <section>
        <h3 className="mb-3 text-[14px] font-bold text-[var(--ink)]">
          判決書與申訴案全文
        </h3>
        <p className="text-[13px] leading-relaxed text-[var(--muted)]">
          與「{doctorName}」相關之判決書案號、申訴案進度、媒體報導摘要，加 LINE 解鎖後可查看完整內容與時間軸。
        </p>
      </section>
    </div>
  );
}

export default async function DoctorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doctor = doctors.find((d) => d.id === id);
  if (!doctor) notFound();

  const clinic = clinics.find((c) => c.id === doctor.clinicId);
  const hasDispute = doctor.disputeCount > 0;

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <div className="mx-auto max-w-[720px] px-4 py-8 md:px-8">
        {/* 麵包屑 */}
        <nav className="mb-6 text-[12px] text-[var(--muted)]" aria-label="麵包屑">
          <Link href="/" className="hover:text-[var(--blue)]">首頁</Link>
          <span className="mx-1.5">/</span>
          <Link href="/doctors" className="hover:text-[var(--blue)]">查醫師</Link>
          <span className="mx-1.5">/</span>
          <span className="text-[var(--ink)]">{doctor.name}</span>
        </nav>

        {/* 醫師基本資訊 */}
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start">
          <div
            className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-[14px] bg-[var(--blue-lt)] text-[48px]"
            aria-hidden
          >
            👨‍⚕️
          </div>
          <div className="min-w-0 flex-1">
            <h1
              className="text-2xl font-black text-[var(--ink)]"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {doctor.name}
            </h1>
            <p className="mt-1 text-[14px] font-bold text-[var(--blue)]">
              {doctor.title}
            </p>
            <p className="mt-1 text-[13px] text-[var(--muted)]">
              {doctor.specialty} · 執業 {doctor.yearsOfPractice} 年
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {doctor.specs.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-[var(--line)] bg-[var(--off)] px-2.5 py-1 text-[12px] text-[var(--ink2)]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 現職診所卡片 */}
        <section className="mb-8">
          <h2 className="mb-3 text-[16px] font-bold text-[var(--ink)]">
            現職診所
          </h2>
          {clinic ? (
            <ClinicCardSmall
              clinicId={clinic.id}
              clinicName={clinic.name}
              clinicScore={clinic.scores.total}
              type={clinic.type}
              district={clinic.district}
            />
          ) : (
            <div className="rounded-[14px] border border-[var(--line)] bg-white p-4 text-[13px] text-[var(--muted)]">
              {doctor.clinicName}（評分 {doctor.clinicScore.toFixed(1)}） ·{" "}
              <Link href="/clinics" className="text-[var(--blue)] hover:underline">
                前往查診所
              </Link>
            </div>
          )}
        </section>

        {/* 執照狀態、糾紛紀錄 */}
        <section className="mb-8 rounded-[14px] border border-[var(--line)] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,.04)]">
          <h2 className="mb-4 text-[16px] font-bold text-[var(--ink)]">
            執照與糾紛摘要
          </h2>
          <ul className="space-y-3 text-[13px] text-[var(--ink2)]">
            <li className="flex items-center gap-2">
              {doctor.licenseValid ? (
                <>
                  <span className="text-green-600">✅</span>
                  <span>執照狀態：有效（衛福部醫事查詢系統）</span>
                </>
              ) : (
                <>
                  <span className="text-[var(--amber)]">⚠️</span>
                  <span>執照狀態：待查證</span>
                </>
              )}
            </li>
            <li className="flex items-center gap-2">
              {hasDispute ? (
                <>
                  <span className="text-[var(--amber)]">⚠️</span>
                  <span>
                    糾紛紀錄：{doctor.disputeCount} 件（詳見下方完整報告，加 LINE 解鎖）
                  </span>
                </>
              ) : (
                <>
                  <span className="text-green-600">✅</span>
                  <span>糾紛紀錄：無司法／申訴紀錄</span>
                </>
              )}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--muted)]">📅</span>
              <span>執業年資：{doctor.yearsOfPractice} 年</span>
            </li>
          </ul>
        </section>

        {/* 霧化報告：完整醫師評鑑報告需加 LINE 解鎖 */}
        <section>
          <h2 className="mb-4 text-[16px] font-bold text-[var(--ink)]">
            完整報告（司法／申訴／負評彙整）
          </h2>
          <FogReport
            lineEntry={{ type: "doctor", id: doctor.id, name: doctor.name }}
            subtitle="解鎖後可查看判決書案號、申訴案進度與完整內容"
          >
            <div className="p-4 space-y-2">
              <p className="text-sm font-bold">完整醫師評鑑報告</p>
              <p className="text-xs text-gray-500">司法判決書全文</p>
              <p className="text-xs text-gray-500">申訴案件追蹤紀錄</p>
              <p className="text-xs text-gray-500">患者負評完整分析</p>
              <p className="text-xs text-gray-500">醫師執照狀態驗證</p>
              <p className="text-xs text-gray-500">同診所醫師比較</p>
            </div>
          </FogReport>
        </section>

        {/* 霧化區塊：詳細糾紛紀錄需加 LINE 解鎖 */}
        {hasDispute && (
          <section>
            <h2 className="mb-4 text-[16px] font-bold text-[var(--ink)]">
              詳細糾紛紀錄
            </h2>
            <FogReport
              subtitle="解鎖後可查看判決書案號、申訴案進度與完整內容"
              lineEntry={{ type: "doctor", id: doctor.id, name: doctor.name }}
            >
              <FakeDisputeContent doctorName={doctor.name} />
            </FogReport>
          </section>
        )}

        {/* 無糾紛時仍可顯示解鎖說明（可選） */}
        {!hasDispute && (
          <section className="rounded-[14px] border border-[var(--line)] bg-white p-6 text-center text-[13px] text-[var(--muted)]">
            本醫師目前無司法／申訴紀錄。若需查詢其他醫師或診所完整報告，可{" "}
            <AddLineButton lineEntry={{ type: "doctor", id: doctor.id, name: doctor.name }} label="加 LINE 免費諮詢" />
            。
          </section>
        )}
      </div>
    </div>
  );
}
