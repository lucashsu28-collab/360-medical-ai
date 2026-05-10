import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "關於我們 | 360醫療AI大調查",
  description: "360醫療AI大調查的使命：提供透明、公正、有據可查的醫美診所評鑑，協助消費者避免資訊不對稱。",
};

const SOURCES = [
  {
    icon: "🏥",
    title: "衛福部健保署",
    desc: "逾1,500家合法登記醫美診所完整資料，確保每一家受評診所均具備合法執業資格，資訊來自政府公開資料庫。",
    tag: "政府開放資料",
    tagColor: "#0046b8",
    tagBg: "#e8f0fb",
  },
  {
    icon: "⭐",
    title: "Google Maps",
    desc: "串接 Google Places API 取得真實用戶評分與評論數量，反映一般民眾對診所服務品質的實際感受。",
    tag: "即時爬取",
    tagColor: "#00875a",
    tagBg: "#e0f5ec",
  },
  {
    icon: "⚖️",
    title: "司法院裁判書",
    desc: "全文檢索司法院公開裁判書資料庫，統計各診所涉及醫療糾紛的判決記錄，讓消費者掌握客觀法律數據。",
    tag: "公開判決書",
    tagColor: "#a86800",
    tagBg: "#fff3e0",
  },
  {
    icon: "🚨",
    title: "政府稽查違規公告",
    desc: "聚合各縣市衛生局、公平會處分公告與主流媒體採訪報導，依嚴重度分輕中重三級扣分，重大違規（停業、廢止、致死致傷）永久顯示。",
    tag: "政府公開資料",
    tagColor: "#c53030",
    tagBg: "#fff5f5",
  },
  {
    icon: "📰",
    title: "主流媒體口碑",
    desc: "Google News 聚合蘋果、聯合、自由、中時、TVBS、ETtoday 等主流媒體報導，AI 自動辨識業配內容降權處理。社群匿名討論不納入評分。",
    tag: "AI 情緒分析",
    tagColor: "#ed8936",
    tagBg: "#fffaf0",
  },
] as const;

const VALUES = [
  { icon: "🔍", title: "透明可查", desc: "每一項評分依據均來自公開資料，消費者可自行至原始來源驗證。" },
  { icon: "⚖️", title: "客觀公正", desc: "平台不收診所廣告費，評分標準對所有診所一視同仁，不存在人為調整。" },
  { icon: "📊", title: "AI輔助分析", desc: "結合大型語言模型分析非結構化資料（判決書、評論文本），提升評分精確度。" },
  { icon: "🔄", title: "持續更新", desc: "爬蟲每月定期更新，確保評分反映診所的最新狀況，而非過時資訊。" },
] as const;

export default function AboutPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white px-4 pb-16 pt-16 text-center md:px-6 md:pb-20 md:pt-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: "radial-gradient(var(--line) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-2xl">
          <span className="mb-4 inline-block rounded-full bg-[var(--blue-lt)] px-4 py-1.5 text-xs font-semibold tracking-wider text-[var(--blue)]">
            關於我們
          </span>
          <h1
            className="mb-5 text-3xl font-black leading-snug text-[var(--ink)] md:text-4xl"
            style={{ fontFamily: "var(--font-noto-serif-tc)" }}
          >
            透明、公正、有據可查的
            <br className="hidden md:block" />
            醫美診所評鑑平台
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-[var(--muted)]">
            我們相信，每一位走進醫美診所的消費者，都應該享有與醫療機構同等的資訊優勢。
            360醫療AI大調查以公開數據為基礎，提供客觀、可驗證的評鑑報告。
          </p>
        </div>
      </section>

      {/* 平台使命 */}
      <section className="bg-[var(--paper)] px-4 py-14 md:px-6 md:py-16">
        <div className="mx-auto max-w-3xl">
          <h2
            className="mb-6 text-center text-2xl font-bold text-[var(--ink)] md:text-3xl"
            style={{ fontFamily: "var(--font-noto-serif-tc)" }}
          >
            為什麼我們要做這個平台？
          </h2>
          <div className="space-y-5 text-[15px] leading-[1.85] text-[var(--ink2)]">
            <p>
              台灣醫美市場規模龐大，每年有數十萬人次走進診所進行各類美容醫療處置。然而，在選擇診所時，消費者往往只能依賴口耳相傳、業配廣告或評論網站的片面資訊——這些資訊容易造假、難以驗證。
            </p>
            <p>
              另一方面，醫療糾紛資料、診所合法登記狀態、真實評分數量等關鍵資訊，雖然散落在政府資料庫與法院公告中，卻因為格式分散、查詢繁瑣，一般消費者幾乎無法取得。
            </p>
            <p>
              <strong className="text-[var(--ink)]">我們的目標，就是打破這種資訊不對稱。</strong>
              透過自動化爬蟲與AI分析，將衛福部、Google、司法院、政府稽查公告、主流媒體報導等公開資料整合成一套統一的五維度評分系統，讓每一個人在5秒內就能查到一家診所的客觀概況。
            </p>
          </div>
        </div>
      </section>

      {/* 資料來源 */}
      <section className="bg-white px-4 py-14 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl">
          <h2
            className="mb-3 text-center text-2xl font-bold text-[var(--ink)] md:text-3xl"
            style={{ fontFamily: "var(--font-noto-serif-tc)" }}
          >
            資料從哪裡來？
          </h2>
          <p className="mb-10 text-center text-sm text-[var(--muted)]">
            所有評分依據均來自公開資料，任何人都可以到原始來源自行驗證
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {SOURCES.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
              >
                <div className="mb-4 text-4xl">{s.icon}</div>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-base font-bold text-[var(--ink)]">{s.title}</h3>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: s.tagBg, color: s.tagColor }}
                  >
                    {s.tag}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-[var(--muted)]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 核心價值 */}
      <section className="bg-[var(--paper)] px-4 py-14 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl">
          <h2
            className="mb-10 text-center text-2xl font-bold text-[var(--ink)] md:text-3xl"
            style={{ fontFamily: "var(--font-noto-serif-tc)" }}
          >
            我們的核心原則
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-xl bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
                <div className="mb-3 text-3xl">{v.icon}</div>
                <h3 className="mb-2 text-sm font-bold text-[var(--ink)]">{v.title}</h3>
                <p className="text-xs leading-relaxed text-[var(--muted)]">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--blue)] px-4 py-14 text-center md:px-6 md:py-16">
        <div className="mx-auto max-w-xl">
          <h2
            className="mb-4 text-2xl font-bold text-white md:text-3xl"
            style={{ fontFamily: "var(--font-noto-serif-tc)" }}
          >
            立即查詢你想去的診所
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-blue-100">
            全台逾 1,567 家醫美診所，評分數據每月更新，免費查詢不需註冊
          </p>
          <Link
            href="/clinics"
            className="inline-block rounded-xl bg-white px-8 py-3 text-base font-bold text-[var(--blue)] no-underline shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-transform duration-150 hover:-translate-y-0.5"
          >
            查詢診所評分 →
          </Link>
        </div>
      </section>
    </main>
  );
}
