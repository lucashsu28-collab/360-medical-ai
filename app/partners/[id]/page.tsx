import Link from "next/link";
import { notFound } from "next/navigation";
import { clinics } from "@/data/clinics";
import type { Clinic } from "@/data/clinics";
import { doctors } from "@/data/doctors";
import type { Doctor } from "@/data/doctors";
import { treatments } from "@/data/treatments";
import type { Treatment } from "@/data/treatments";

/** 僅合作診所可進入此頁 */
function getPartnerClinic(id: string): Clinic | null {
  const clinic = clinics.find((c) => c.id === id);
  return clinic?.isPartner ? clinic : null;
}

/** 此診所的醫師團隊（clinicId 對應） */
function getDoctorsByClinic(clinicId: string): Doctor[] {
  return doctors.filter((d) => d.clinicId === clinicId);
}

/** 此診所提供的療程（tags 與療程名稱對應） */
function getTreatmentsForClinic(clinic: Clinic): Treatment[] {
  return treatments.filter((t) =>
    clinic.tags.some(
      (tag) => tag.includes(t.name) || t.name.includes(tag)
    )
  );
}

function formatPrice(n: number): string {
  return `NT$ ${n.toLocaleString("zh-TW")}`;
}

function getMapUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

const FAKE_PHONE = "02-1234-5678";
const FAKE_HOURS = [
  { days: "週一至週五", time: "10:00 – 21:00" },
  { days: "週六", time: "10:00 – 18:00" },
  { days: "週日及國定假日", time: "休診" },
];

/** 假資料：限時優惠 */
const FAKE_PROMOS = [
  { title: "皮秒雷射體驗價", discount: "首次 8 折", until: "2025/04/30" },
  { title: "玻尿酸＋肉毒組合", discount: "合購省 $2,000", until: "2025/03/31" },
  { title: "會員專屬", discount: "當月壽星 9 折", until: "長期有效" },
];

export default async function PartnerClinicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clinic = getPartnerClinic(id);
  if (!clinic) notFound();

  const clinicDoctors = getDoctorsByClinic(clinic.id);
  const clinicTreatments = getTreatmentsForClinic(clinic);
  const mapUrl = getMapUrl(clinic.address);

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <div className="mx-auto max-w-[1060px] px-4 py-8 md:px-8">
        {/* 麵包屑 */}
        <nav className="mb-6 text-[12px] text-[var(--muted)]" aria-label="麵包屑">
          <Link href="/" className="hover:text-[var(--blue)]">首頁</Link>
          <span className="mx-1.5">/</span>
          <Link href="/partners" className="hover:text-[var(--blue)]">診所資料館</Link>
          <span className="mx-1.5">/</span>
          <span className="text-[var(--ink)]">{clinic.name}</span>
        </nav>

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          {/* 主內容 */}
          <main className="min-w-0 flex-1 space-y-8">
            {/* 頂部：診所名稱、合作標示、評分 */}
            <div className="rounded-[14px] border border-[var(--line)] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,.04)]">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-md bg-[var(--blue)] px-3 py-1.5 text-[12px] font-bold text-white">
                  ✦ 診所資料館
                </span>
                <h1
                  className="text-2xl font-black text-[var(--ink)] md:text-3xl"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {clinic.name}
                </h1>
                <span
                  className="rounded-md bg-[var(--blue-lt)] px-3 py-1.5 text-[16px] font-medium text-[var(--blue)]"
                  style={{ fontFamily: "var(--font-dm-mono)" }}
                >
                  {clinic.scores.total.toFixed(1)} 分
                </span>
              </div>
              <p className="mt-2 text-[13px] text-[var(--muted)]">
                {clinic.type} · {clinic.district} · {clinic.reviewCount.toLocaleString("zh-TW")} 則評論
              </p>
            </div>

            {/* 醫師團隊 */}
            <section>
              <h2 className="mb-4 text-[16px] font-bold text-[var(--ink)]">
                醫師團隊
              </h2>
              {clinicDoctors.length > 0 ? (
                <ul className="space-y-3">
                  {clinicDoctors.map((doc) => (
                    <li key={doc.id}>
                      <Link
                        href={`/doctors/${doc.id}`}
                        className="flex items-center gap-4 rounded-[14px] border border-[var(--line)] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,.04)] transition-colors hover:border-[var(--blue)] hover:shadow-[0_4px_12px_rgba(0,0,0,.08)]"
                      >
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[10px] bg-[var(--blue-lt)] text-2xl">
                          👨‍⚕️
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[15px] font-bold text-[var(--ink)]">
                            {doc.name}
                          </div>
                          <div className="mt-0.5 text-[12px] text-[var(--muted)]">
                            {doc.title} · 執業 {doc.yearsOfPractice} 年
                          </div>
                        </div>
                        <span className="text-[12px] font-bold text-[var(--blue)]">
                          查看醫師 →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-[14px] border border-[var(--line)] bg-white p-4 text-[13px] text-[var(--muted)]">
                  暫無醫師資料，請至{" "}
                  <Link href="/doctors" className="text-[var(--blue)] hover:underline">
                    查醫師
                  </Link>{" "}
                  瀏覽。
                </p>
              )}
            </section>

            {/* 療程項目列表（含價格） */}
            <section>
              <h2 className="mb-4 text-[16px] font-bold text-[var(--ink)]">
                療程項目
              </h2>
              {clinicTreatments.length > 0 ? (
                <ul className="space-y-2 rounded-[14px] border border-[var(--line)] bg-white shadow-[0_2px_8px_rgba(0,0,0,.04)] overflow-hidden">
                  {clinicTreatments.map((t) => (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3 last:border-b-0"
                    >
                      <Link
                        href={`/treatments/${t.id}`}
                        className="text-[14px] font-medium text-[var(--ink)] hover:text-[var(--blue)] hover:underline"
                      >
                        {t.name}
                      </Link>
                      <span
                        className="text-[13px] text-[var(--muted)]"
                        style={{ fontFamily: "var(--font-dm-mono)" }}
                      >
                        {formatPrice(t.priceMin)} – {formatPrice(t.priceMax)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-[14px] border border-[var(--line)] bg-white p-4 text-[13px] text-[var(--muted)]">
                  暫無療程資料。
                </p>
              )}
            </section>

            {/* 限時優惠 */}
            <section>
              <h2 className="mb-4 text-[16px] font-bold text-[var(--ink)]">
                限時優惠
              </h2>
              <ul className="space-y-3">
                {FAKE_PROMOS.map((promo, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-[var(--line)] bg-[var(--amber-lt)]/50 px-4 py-3"
                  >
                    <div>
                      <span className="text-[14px] font-bold text-[var(--ink)]">
                        {promo.title}
                      </span>
                      <span className="ml-2 text-[13px] font-medium text-[var(--amber)]">
                        {promo.discount}
                      </span>
                    </div>
                    <span className="text-[12px] text-[var(--muted)]">
                      至 {promo.until}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 預約按鈕 CTA */}
            <section className="rounded-[14px] border-2 border-[var(--blue)] bg-[var(--blue-xl)] p-8 text-center">
              <p className="mb-4 text-[15px] font-bold text-[var(--ink)]">
                預約諮詢 · 專人為您安排
              </p>
              <a
                href="https://lin.ee/6sTCRzm"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-[8px] bg-[var(--blue)] px-10 py-4 text-[16px] font-bold text-white shadow-[0_4px_12px_rgba(0,70,184,.25)] transition-colors hover:bg-[var(--blue2)]"
              >
                立即預約
              </a>
            </section>
          </main>

          {/* 右側欄：聯絡資訊、營業時間、地圖 */}
          <aside className="w-full shrink-0 lg:w-[300px]">
            <div className="sticky top-[78px] space-y-6 rounded-[14px] border border-[var(--line)] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,.04)]">
              <div>
                <h3 className="mb-3 text-[14px] font-bold text-[var(--ink)]">
                  聯絡資訊
                </h3>
                <ul className="space-y-2 text-[13px] text-[var(--ink2)]">
                  <li>地址：{clinic.address}</li>
                  <li>電話：{FAKE_PHONE}</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-3 text-[14px] font-bold text-[var(--ink)]">
                  營業時間
                </h3>
                <ul className="space-y-1.5 text-[13px] text-[var(--ink2)]">
                  {FAKE_HOURS.map((row, i) => (
                    <li key={i}>
                      {row.days} {row.time}
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-[8px] border border-[var(--line)] bg-[var(--off)] py-3 text-center text-[13px] font-bold text-[var(--blue)] transition-colors hover:bg-[var(--blue-lt)]"
              >
                在 Google 地圖中開啟
              </a>
              <Link
                href={`/clinics/${clinic.id}`}
                className="block text-center text-[12px] text-[var(--muted)] hover:text-[var(--blue)] hover:underline"
              >
                查看完整診所評鑑 →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
