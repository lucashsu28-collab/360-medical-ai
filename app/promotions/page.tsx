import Link from "next/link";
import { clinics } from "@/data/clinics";
import type { Clinic } from "@/data/clinics";

const partnerClinics = clinics.filter((c) => c.isPartner);

/** 假資料：每家合作診所對應一則優惠（療程名稱、優惠內容、截止日） */
const FAKE_PROMO_TEMPLATES: { treatment: string; offer: string; until: string }[] = [
  { treatment: "皮秒雷射", offer: "首次體驗 8 折", until: "2025/04/30" },
  { treatment: "玻尿酸＋肉毒", offer: "合購省 $2,000", until: "2025/03/31" },
  { treatment: "電波拉皮", offer: "指定部位 9 折", until: "2025/05/15" },
  { treatment: "飛梭雷射", offer: "買 3 送 1", until: "2025/04/15" },
  { treatment: "雙眼皮／隆鼻", offer: "諮詢免掛號費", until: "長期有效" },
  { treatment: "淨膚雷射", offer: "當月壽星 9 折", until: "2025/12/31" },
  { treatment: "童顏針／晶亮瓷", offer: "滿萬折千", until: "2025/03/20" },
  { treatment: "除毛雷射", offer: "小面積體驗價", until: "2025/04/30" },
  { treatment: "痘疤治療", offer: "療程包 85 折", until: "2025/05/01" },
  { treatment: "保濕／皮膚管理", offer: "會員專屬價", until: "長期有效" },
];

function getPromoForClinic(clinic: Clinic, index: number) {
  const t = FAKE_PROMO_TEMPLATES[index % FAKE_PROMO_TEMPLATES.length];
  return {
    treatment: clinic.tags[0] ? `${clinic.tags[0]}等` : t.treatment,
    offer: t.offer,
    until: t.until,
  };
}

export default function PromotionsPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Hero + 說明 */}
      <div className="border-b border-[var(--line)] bg-white px-4 pb-8 pt-10 text-center md:px-6 md:pt-10 md:pb-8">
        <div className="relative z-10 mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,70,184,.1)] bg-[var(--blue-lt)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--blue)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--blue)]" />
          精選優惠
        </div>
        <h2
          className="relative z-10 mb-2 text-2xl font-[900] tracking-tight text-[var(--ink)] md:text-3xl lg:text-4xl"
          style={{ fontFamily: "var(--font-noto-serif-tc)" }}
        >
          精選<span className="text-[var(--blue)]">優惠</span>
        </h2>
        <p className="relative z-10 mx-auto max-w-[560px] text-[12px] leading-relaxed text-[var(--muted)]">
          以下優惠由診所資料館各診所提供，非平台評鑑推薦。
        </p>
      </div>

      {/* 優惠卡片列表 */}
      <div className="mx-auto max-w-[1060px] px-4 py-6 md:px-8 md:py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partnerClinics.map((clinic, i) => {
            const promo = getPromoForClinic(clinic, i);
            return (
              <Link
                key={clinic.id}
                href={`/partners/${clinic.id}`}
                className="flex flex-col rounded-[14px] border border-[var(--line)] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.04)] transition-all hover:border-[var(--blue)] hover:shadow-[0_4px_12px_rgba(0,0,0,.08)]"
              >
                <span className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--blue)]">
                  {promo.treatment}
                </span>
                <p className="mb-2 text-[15px] font-bold text-[var(--ink)]">
                  {promo.offer}
                </p>
                <p className="mb-3 text-[12px] text-[var(--muted)]">
                  至 {promo.until}
                </p>
                <p className="mt-auto text-[13px] text-[var(--ink2)]">
                  {clinic.name}
                </p>
                <span className="mt-1 text-[12px] font-medium text-[var(--blue)]">
                  查看診所 →
                </span>
              </Link>
            );
          })}
        </div>
        {partnerClinics.length === 0 && (
          <div className="rounded-[14px] border border-[var(--line)] bg-white py-16 text-center text-[var(--muted)]">
            目前沒有優惠資料。
          </div>
        )}
      </div>

      {/* 底部 CTA */}
      <section className="border-t border-[var(--line)] bg-white px-4 py-10 md:px-6">
        <div className="mx-auto max-w-[560px] rounded-[14px] border border-[var(--line)] bg-[var(--blue-xl)] p-8 text-center">
          <p className="mb-4 text-[15px] font-bold text-[var(--ink)]">
            想了解更多優惠或預約諮詢？
          </p>
          <a
            href="https://lin.ee/6sTCRzm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-[8px] bg-[var(--line-green)] px-8 py-3 text-[14px] font-bold text-white shadow-[0_2px_8px_rgba(6,199,85,.25)] transition-colors hover:bg-[var(--line-green-hover)]"
          >
            加 LINE 免費諮詢
          </a>
        </div>
      </section>

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
