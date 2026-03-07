import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import ClinicCard from "@/components/ClinicCard";
import { clinics } from "@/data/clinics";

const LINE_CTA_URL = "#line";

const TREATMENT_TILES = [
  {
    category: "laser",
    label: "雷射光療",
    sub: "淡斑 · 縮毛孔 · 除紋 · 美白",
    icon: "✨",
    gradient: "linear-gradient(160deg,#c8e6fa,#90caf9)",
  },
  {
    category: "injection",
    label: "微整形注射",
    sub: "玻尿酸 · 肉毒 · 晶亮瓷",
    icon: "💉",
    gradient: "linear-gradient(160deg,#fce4ec,#f48fb1)",
  },
  {
    category: "surgery",
    label: "外科手術",
    sub: "雙眼皮 · 隆鼻 · 拉皮",
    icon: "🔬",
    gradient: "linear-gradient(160deg,#f3e5f5,#ce93d8)",
  },
  {
    category: "skin",
    label: "皮膚管理",
    sub: "保濕 · 痘疤 · 敏感修護",
    icon: "🌿",
    gradient: "linear-gradient(160deg,#e8f5e9,#a5d6a7)",
  },
] as const;

const partnerClinics = clinics.filter((c) => c.isPartner).slice(0, 6);

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-white px-4 pb-12 pt-14 text-center md:px-6 md:pt-[72px] md:pb-[60px]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage: "radial-gradient(var(--line) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage:
              "radial-gradient(ellipse 70% 80% at 50% 50%, black 20%, transparent 100%)",
          }}
        />
        <div className="relative z-10 mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,70,184,.12)] bg-[var(--blue-lt)] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--blue)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--blue)]" />
          全台唯一 · 五維度AI評鑑
        </div>
        <h1
          className="relative z-10 mb-3.5 font-[900] leading-tight tracking-tight text-[var(--ink)] md:mb-4 md:text-4xl lg:text-[clamp(36px,5vw,62px)]"
          style={{ fontFamily: "var(--font-noto-serif-tc)" }}
        >
          你找的醫美，<span className="text-[var(--blue)]">真的好嗎？</span>
        </h1>
        <p className="relative z-10 mx-auto mb-6 max-w-[480px] text-base leading-snug text-[var(--muted)] md:mb-9">
          司法糾紛・合法登記・真實口碑
          <br />
          三件你沒查的事，我們幫你查完。
        </p>
        <SearchBox
          variant="hero"
          placeholder="輸入診所名稱、醫師姓名、或療程…"
          searchPath="/clinics"
        />
      </section>

      {/* 熱門療程快速入口 */}
      <section className="mx-auto max-w-[1060px] px-6 py-14 md:py-16">
        <div className="mb-7">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--blue)] mb-1.5">
            依療程找診所
          </div>
          <h2
            className="text-[22px] font-[900] text-[var(--ink)] md:text-3xl"
            style={{ fontFamily: "var(--font-noto-serif-tc)" }}
          >
            你想做什麼？
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-3.5">
          {TREATMENT_TILES.map((t) => (
            <Link
              key={t.category}
              href={`/treatments?category=${t.category}`}
              className="group relative flex aspect-[3/4] overflow-hidden rounded-[14px] transition-all duration-[0.25s] hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,.14)]"
            >
              <div
                className="absolute inset-0 flex items-center justify-center text-5xl md:text-[72px]"
                style={{ background: t.gradient }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to top, rgba(13,27,42,.7) 0%, transparent 55%)",
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div
                  className="text-[18px] font-bold text-white md:text-[20px]"
                  style={{ fontFamily: "var(--font-noto-serif-tc)" }}
                >
                  {t.label}
                </div>
                <div className="text-[11px] font-medium text-white/70">
                  {t.sub}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 精選診所 */}
      <section className="mx-auto max-w-[1060px] px-6 pb-16">
        <div className="mb-7">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--blue)] mb-1.5">
            合作診所推薦
          </div>
          <h2
            className="text-[22px] font-[900] text-[var(--ink)] md:text-3xl"
            style={{ fontFamily: "var(--font-noto-serif-tc)" }}
          >
            評分達標・AI顧問推薦
          </h2>
          <p className="mt-1.5 text-sm text-[var(--muted)] leading-snug">
            以下診所綜合評分 7.5 分以上，通過本平台品質審核。
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partnerClinics.map((clinic) => (
            <ClinicCard key={clinic.id} {...clinic} variant="grid" />
          ))}
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="border-t border-[var(--line)] bg-[var(--ink)] px-6 py-12 md:py-14">
        <div className="mx-auto flex max-w-[1060px] flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h2
              className="text-xl font-[900] text-white md:text-2xl"
              style={{ fontFamily: "var(--font-noto-serif-tc)" }}
            >
              加 LINE 免費諮詢
            </h2>
            <p className="mt-2 text-[13px] text-white/60 leading-relaxed">
              AI 顧問幫你比較診所、推薦方案，完全免費。
            </p>
          </div>
          <a
            href={LINE_CTA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-[10px] bg-[#4fc3f7] px-7 py-3 text-[14px] font-bold text-[var(--ink)] transition-opacity hover:opacity-90"
          >
            📲 加 LINE 免費諮詢
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--off)] px-6 py-5">
        <p className="text-[11px] text-[var(--muted)]">
          © 360醫療AI大調查 · 評鑑分數由系統自動計算，不接受購買或修改
        </p>
        <span className="rounded-full bg-[var(--green-lt)] px-3 py-1 text-[10px] font-bold text-[var(--green)]">
          ✅ 系統運作中
        </span>
      </footer>
    </>
  );
}
