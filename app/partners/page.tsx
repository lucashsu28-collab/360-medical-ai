import ClinicCard from "@/components/ClinicCard";
import { clinics } from "@/data/clinics";

const partnerClinics = clinics.filter((c) => c.isPartner);

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Hero + 說明 */}
      <div className="border-b border-[var(--line)] bg-white px-4 pb-8 pt-10 text-center md:px-6 md:pt-10 md:pb-8">
        <div className="relative z-10 mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,70,184,.1)] bg-[var(--blue-lt)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--blue)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--blue)]" />
          診所資料館
        </div>
        <h2
          className="relative z-10 mb-2 text-2xl font-[900] tracking-tight text-[var(--ink)] md:text-3xl lg:text-4xl"
          style={{ fontFamily: "var(--font-noto-serif-tc)" }}
        >
          <span className="text-[var(--blue)]">✦</span> 診所資料館
        </h2>
        <p className="relative z-10 mx-auto max-w-[560px] text-sm leading-relaxed text-[var(--muted)]">
          以下為與平台合作之診所，評鑑分數獨立計算，不受合作關係影響。
        </p>
      </div>

      {/* 列表 */}
      <div className="mx-auto max-w-[1060px] px-4 py-6 md:px-8 md:py-8">
        <p className="mb-4 text-[13px] text-[var(--muted)]">
          共收錄 <strong className="font-bold text-[var(--ink)]">{partnerClinics.length}</strong> 家診所
        </p>
        <div className="flex flex-col gap-2.5">
          {partnerClinics.length === 0 ? (
            <div className="rounded-[14px] border border-[var(--line)] bg-white py-16 text-center text-[var(--muted)]">
              目前沒有收錄診所。
            </div>
          ) : (
            partnerClinics.map((clinic) => (
              <ClinicCard
                key={clinic.id}
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
                detailBasePath="/partners"
                imagePlaceholder={clinic.imagePlaceholder}
              />
            ))
          )}
        </div>
      </div>

      <footer className="mt-auto border-t border-[var(--line)] bg-[var(--off)] px-6 py-5">
        <div className="mx-auto flex max-w-[1060px] flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-[var(--muted)]">
            © 360醫療AI大調查 · 評鑑分數由系統自動計算，不接受購買或修改
          </p>
          <span className="rounded-full bg-[var(--green-lt)] px-3 py-1 text-[10px] font-bold text-[var(--green)]">
            ✅ 系統運作中
          </span>
        </div>
      </footer>
    </div>
  );
}
