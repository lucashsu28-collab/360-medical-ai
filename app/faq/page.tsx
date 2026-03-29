"use client";

import { useState } from "react";

const CATEGORIES = [
  { key: "scoring",   label: "評鑑與評分" },
  { key: "source",    label: "資料來源" },
  { key: "usage",     label: "如何使用" },
  { key: "reading",   label: "報告解讀" },
  { key: "accuracy",  label: "資料正確性" },
];

const FAQS: { cat: string; q: string; a: string }[] = [
  { cat: "scoring", q: "360醫療AI大調查的評分是如何計算的？", a: "我們採用五維度評鑑系統，每個維度各 20 分，合計 100 分滿分。五個維度為：合法登記、Google評分、司法糾紛、新聞媒體（開發中）、社群口碑（開發中）。各維度資料來自衛福部健保署、Google Places、司法院裁判書等官方來源，全部公開可自行驗證。" },
  { cat: "scoring", q: "評鑑分數會受到商業因素影響嗎？", a: "絕對不會。本平台評分完全由系統依公開資料自動計算，不接受任何形式的付費提升或人工調整。合作診所可以讓頁面更完整豐富，但合作與否不影響評鑑分數。這是我們最核心的承諾。" },
  { cat: "scoring", q: "司法案件分數代表什麼意思？", a: "司法案件分數來自司法院裁判書查詢，0件案件為滿分20分，案件越多扣分越多（每件扣5分）。這反映診所過去是否有醫療糾紛訴訟記錄。資料可在司法院全球資訊網自行查閱驗證。" },
  { cat: "source", q: "資料來自哪些來源？", a: "主要三大來源：① 衛福部健保署醫事機構查詢（合法登記、24,321筆資料）② 司法院裁判書全文查詢（司法糾紛紀錄）③ Google Places API（評分與評論數，904筆）。所有來源都是官方公開資料，任何人都可以自行驗證。" },
  { cat: "source", q: "資料多久更新一次？", a: "Google評分每10天更新一次；司法院裁判書每月更新；健保署登記資料每月更新。更新時間不一定，如發現資料明顯過時，請透過 LINE 官方帳號通知我們。" },
  { cat: "usage", q: "如何查詢特定診所？", a: "您可以在首頁或「全台診所資料館」頁面的搜尋框輸入診所名稱，或使用縣市、療程類型等篩選條件縮小範圍。搜尋結果會顯示評鑑分數、地址與療程資訊。" },
  { cat: "usage", q: "如何查詢醫師執照是否合法？", a: "前往「醫師查詢」頁面，輸入醫師姓名即可查詢衛福部醫事人員資料。可查看執業縣市、主要執業科別、證書類別等資訊。若需要完整報告，可點選「解鎖報告」透過 LINE 接收。" },
  { cat: "reading", q: "如何解讀評鑑分數？", a: "滿分 100 分，建議參考值：80分以上為優良、60-79分為普通、60分以下需謹慎。但請注意，分數只是參考，建議結合實際造訪、詢問朋友經驗等方式做綜合判斷。部分維度仍在開發中，分數未來會更完整。" },
  { cat: "reading", q: "為什麼某些維度顯示「開發中」？", a: "新聞媒體和社群口碑兩個維度目前正在開發中，這兩個維度的評分暫時為0。目前已上線的三個維度（合法登記、Google評分、司法糾紛）已能反映診所的基本品質面向。" },
  { cat: "accuracy", q: "如何申請更新診所資料？", a: "請前往「診所更新資料」頁面，填寫申請表單。申請僅限診所負責人或經授權人員，提交後會由人工審核，審核通過後會在平台上更新。如有急迫需求，也可直接加入 LINE 官方帳號聯繫。" },
  { cat: "accuracy", q: "如果我發現資料有誤怎麼辦？", a: "若發現評鑑資料有明顯錯誤（如診所名稱、地址有誤，或評分計算有問題），請透過「診所更新資料」頁面提交，或直接加入 360醫美AI大調查 LINE 官方帳號聯繫我們，我們將在 5 個工作日內回覆。" },
];

export default function FaqPage() {
  const [activeCat, setActiveCat] = useState("scoring");
  const [openQ, setOpenQ] = useState<number | null>(0);

  const filtered = FAQS.filter((f) => f.cat === activeCat);

  return (
    <div style={{ background: "#FAFAF8", minHeight: "100vh" }}>
      {/* Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question", name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      })}} />

      {/* Hero */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "32px 24px 28px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EBF8FF", border: "1px solid #BEE3F8", borderRadius: 20, padding: "3px 12px", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#2B6CB0" }}>常見問題</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A202C", margin: "0 0 8px" }}>常見問題 FAQ</h1>
        <p style={{ fontSize: 13, color: "#718096", margin: 0 }}>關於醫美評鑑、報告解讀、系統使用的常見問題</p>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px", display: "grid", gridTemplateColumns: "200px 1fr", gap: 24, alignItems: "flex-start" }}>

        {/* Left categories */}
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 8, position: "sticky", top: 76 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => { setActiveCat(cat.key); setOpenQ(null); }}
              style={{
                display: "block", width: "100%", padding: "10px 14px", textAlign: "left",
                border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13,
                fontWeight: activeCat === cat.key ? 700 : 400,
                background: activeCat === cat.key ? "#EBF8FF" : "transparent",
                color: activeCat === cat.key ? "#2B6CB0" : "#4A5568",
                marginBottom: 2,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Right accordion */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((f, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
              <button
                onClick={() => setOpenQ(openQ === i ? null : i)}
                style={{
                  width: "100%", padding: "16px 20px", textAlign: "left", border: "none", background: "transparent",
                  display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", gap: 12,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1A202C", lineHeight: 1.5 }}>Q. {f.q}</span>
                <span style={{ fontSize: 16, color: "#A0AEC0", flexShrink: 0 }}>{openQ === i ? "▲" : "▼"}</span>
              </button>
              {openQ === i && (
                <div style={{ padding: "0 20px 16px", borderTop: "1px solid #F7FAFC" }}>
                  <p style={{ fontSize: 13, color: "#718096", lineHeight: 1.8, margin: 0 }}>{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
