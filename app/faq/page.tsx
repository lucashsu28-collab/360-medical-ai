import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "醫美常見問題FAQ｜360醫療AI大調查",
  description: "醫美診所選擇、療程安全、評鑑標準等常見問題解答，幫助您做出最明智的醫美決策。",
};

const FAQS = [
  { q: "360醫療AI大調查的評分是如何計算的？", a: "我們採用六維度評鑑系統：Google評分（10分）、司法案件（10分）、合法登記（10分）、行政處分（10分）、新聞媒體（10分）、社群討論（10分），總分60分。各維度資料來自Google Places、司法院裁判書、衛福部健保署等官方來源。" },
  { q: "如何查詢醫師執照是否合法？", a: "我們直接串接衛福部醫事人員查詢系統，即時驗證醫師執照狀態。您可以在醫師查詢頁輸入醫師姓名，系統會即時回傳執照資訊。" },
  { q: "司法案件分數代表什麼意思？", a: "司法案件分數來自司法院裁判書查詢，0件案件為滿分10分，每有一件相關案件扣2分。這反映診所過去是否有醫療糾紛訴訟記錄。" },
  { q: "診所有合法登記是什麼意思？", a: "合法登記指診所已向衛福部健保署完成醫事機構登記，資料來自健保署24,321筆官方紀錄。未完成登記的診所不得合法執業。" },
  { q: "如何解鎖完整評鑑報告？", a: "點擊診所頁面的「解鎖完整報告」按鈕，加入360醫美AI智能顧問LINE官方帳號後，系統會自動將完整報告推播至您的LINE。" },
  { q: "醫美診所選擇有哪些注意事項？", a: "建議確認：1.醫師執照合法性 2.診所衛福部登記狀態 3.過去是否有醫療糾紛 4.Google評分與評論數量 5.是否有行政處分記錄。" },
  { q: "資料多久更新一次？", a: "Google評分每10天更新、司法院裁判書每月更新、健保署登記資料每月更新、行政處分每月更新。" },
  { q: "為什麼某些維度顯示「待補」？", a: "新聞媒體和社群討論兩個維度目前正在開發中，預計近期上線。其餘四個維度已有完整資料。" },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": FAQS.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
      })}} />
      <div className="mx-auto max-w-[780px] px-4 py-8 md:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)] mb-2">常見問題 FAQ</h1>
          <p className="text-[var(--muted)] text-sm">關於醫美評鑑、報告解讀、系統使用的常見問題</p>
        </div>
        <div className="flex flex-col gap-4">
          {FAQS.map((f, i) => (
            <div key={i} className="rounded-[14px] border border-[var(--line)] bg-white p-6">
              <h2 className="text-[15px] font-bold text-[var(--ink)] mb-3">Q. {f.q}</h2>
              <p className="text-[13px] leading-relaxed text-[var(--ink2)]">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
