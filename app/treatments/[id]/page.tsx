import Link from "next/link";
import { notFound } from "next/navigation";
import { treatments } from "@/data/treatments";
import type { Treatment } from "@/data/treatments";
import { clinics } from "@/data/clinics";
import type { Clinic } from "@/data/clinics";
import ClinicCard from "@/components/ClinicCard";

/** 篩選出 tags 包含此療程的診所（療程名稱與 tag 任一包含即算） */
function getClinicsOfferingTreatment(
  treatment: Treatment,
  allClinics: Clinic[]
): Clinic[] {
  const name = treatment.name;
  return allClinics.filter((c) =>
    c.tags.some(
      (tag) => tag.includes(name) || name.includes(tag)
    )
  );
}

function formatPrice(n: number): string {
  return `NT$ ${n.toLocaleString("zh-TW")}`;
}

export default async function TreatmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const treatment = treatments.find((t) => t.id === id);
  if (!treatment) notFound();

  const offeringClinics = getClinicsOfferingTreatment(treatment, clinics);

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <div className="mx-auto max-w-[1060px] px-4 py-8 md:px-8">
        {/* 麵包屑 */}
        <nav className="mb-6 text-[12px] text-[var(--muted)]" aria-label="麵包屑">
          <Link href="/" className="hover:text-[var(--blue)]">首頁</Link>
          <span className="mx-1.5">/</span>
          <Link href="/treatments" className="hover:text-[var(--blue)]">查療程</Link>
          <span className="mx-1.5">/</span>
          <span className="text-[var(--ink)]">{treatment.name}</span>
        </nav>

        {/* 療程名稱、類別、描述 */}
        <div className="mb-8 rounded-[14px] border border-[var(--line)] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,.04)]">
          <div className="mb-4 flex items-start gap-4">
            <div
              className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[14px] border border-[var(--line)] bg-[var(--off)] text-3xl"
              aria-hidden
            >
              {treatment.imagePlaceholder}
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-block rounded-full bg-[var(--blue-lt)] px-2.5 py-1 text-[11px] font-bold text-[var(--blue)]">
                {treatment.categoryLabel}
              </span>
              <h1
                className="mt-2 text-2xl font-black text-[var(--ink)]"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {treatment.name}
              </h1>
              {treatment.isPopular && (
                <span className="mt-2 inline-block rounded px-2 py-0.5 text-[11px] font-bold text-[var(--amber)] bg-[var(--amber-lt)]">
                  熱門療程
                </span>
              )}
            </div>
          </div>
          <p className="text-[14px] leading-relaxed text-[var(--ink2)]">
            {treatment.description}
          </p>
        </div>

        {/* 市場行情價格範圍 */}
        <section className="mb-8 rounded-[14px] border border-[var(--line)] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,.04)]">
          <h2 className="mb-3 text-[16px] font-bold text-[var(--ink)]">
            市場行情
          </h2>
          <p className="text-[14px] text-[var(--ink2)]">
            參考價格區間：{" "}
            <span
              className="font-medium text-[var(--blue)]"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              {formatPrice(treatment.priceMin)} – {formatPrice(treatment.priceMax)}
            </span>
            <span className="ml-2 text-[13px] text-[var(--muted)]">
              （實際以各診所報價為準）
            </span>
          </p>
        </section>

        {/* 提供此療程的診所列表 */}
        <section className="mb-10">
          <h2 className="mb-4 text-[16px] font-bold text-[var(--ink)]">
            提供此療程的診所（{offeringClinics.length} 家）
          </h2>
          {offeringClinics.length > 0 ? (
            <ul className="space-y-4">
              {offeringClinics.map((clinic) => (
                <li key={clinic.id}>
                  <ClinicCard
                    id={clinic.id}
                    name={clinic.name}
                    type={clinic.type}
                    address={clinic.address}
                    district={clinic.district}
                    tags={clinic.tags}
                    isPartner={clinic.isPartner}
                    scores={clinic.scores}
                    reviewCount={clinic.reviewCount}
                    variant="row"
                    imagePlaceholder={clinic.imagePlaceholder}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-[14px] border border-[var(--line)] bg-white p-6 text-[14px] text-[var(--muted)]">
              目前尚無符合的診所資料，請至{" "}
              <Link href="/clinics" className="text-[var(--blue)] hover:underline">
                查診所
              </Link>{" "}
              瀏覽。
            </p>
          )}
        </section>

        {/* 底部 CTA：加 LINE 免費諮詢 */}
        <section className="rounded-[14px] border border-[var(--line)] bg-[var(--blue-xl)] p-8 text-center">
          <p className="mb-4 text-[15px] font-bold text-[var(--ink)]">
            想了解「{treatment.name}」的診所報價或適合自己的方案？
          </p>
          <a
            href="#line"
            className="inline-block rounded-[8px] bg-[var(--blue)] px-8 py-3 text-[14px] font-bold text-white shadow-[0_2px_8px_rgba(0,70,184,.2)] transition-colors hover:bg-[var(--blue2)]"
          >
            加 LINE 免費諮詢
          </a>
        </section>
      </div>
    </div>
  );
}
