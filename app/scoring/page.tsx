import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "評分標準｜360醫療AI大調查",
  description: "360醫療AI大調查採100分制評鑑，五個維度各20分，資料全部公開，任何人都可以驗證。",
};

const DIMENSIONS = [
  {
    num: "1", title: "合法登記", status: "live", color: "#2B6CB0", bg: "#EBF8FF",
    desc: "資料來源：衛福部健保署醫事機構查詢系統。確認診所是否具備合法醫療機構登記，為所有評分維度中最基礎的門檻條件。",
    rows: [["有合法登記（健保署資料庫可查詢）", "20 分"], ["無法查詢登記記錄", "0 分"]],
  },
  {
    num: "2", title: "Google 評分", status: "live", color: "#38A169", bg: "#C6F6D5",
    desc: "資料來源：Google Places API（每10天自動更新）。為避免分數通膨（醫美業 ★4.5+ 是常態），採嚴格分級，理論滿分 20 分需 ★4.9+ 且 ≥5000 評論（目前無診所達標）。",
    rows: [
      ["★ 4.9 以上", "13 分"],
      ["★ 4.7-4.8", "11 分"],
      ["★ 4.5-4.6", "9 分"],
      ["★ 4.0-4.4", "6 分"],
      ["★ 3.5-3.9", "3 分"],
      ["★ 低於 3.5", "0 分"],
      ["評論 ≥ 5000 則（額外）", "+5 分"],
      ["評論 ≥ 2000 則", "+4 分"],
      ["評論 ≥ 1000 則", "+3 分"],
      ["評論 ≥ 500 則", "+2 分"],
      ["評論 ≥ 100 則", "+1 分"],
    ],
  },
  {
    num: "3", title: "司法糾紛", status: "live", color: "#D69E2E", bg: "#FEFCBF",
    desc: "資料來源：司法院裁判書查詢系統。以診所名稱為關鍵字統計涉及醫療糾紛之民事、刑事判決案件數，案件數越多分數越低。",
    rows: [["0 件", "20 分"], ["1 件", "15 分"], ["2 件", "10 分"], ["3 件", "5 分"], ["4 件以上", "0 分"]],
  },
  {
    num: "4", title: "稽查違規", status: "live", color: "#C53030", bg: "#FFF5F5",
    desc: "資料來源：政府公開處分資料聚合（Google News 抓取衛生局/公平會等媒體報導 + Gemini AI 提取）。每週日自動更新。",
    rows: [
      ["近 3 年無公開違規紀錄", "20 分"],
      ["輕微違規（廣告/標示，罰 < NT$ 5 萬）每筆", "-3 分（依時間衰減）"],
      ["中度違規（罰 ≥ NT$ 10 萬）每筆", "-10 分（依時間衰減）"],
      ["重大違規（停業/廢止/致死致傷/密醫）每筆", "-25 分（永久顯示）"],
      ["5 年以上輕中度紀錄", "不計入評分"],
    ],
  },
  {
    num: "5", title: "媒體口碑", status: "live", color: "#ED8936", bg: "#FFFAF0",
    desc: "資料來源：主流媒體報導（蘋果/聯合/自由/中時/TVBS/鏡週刊/ETtoday/Yahoo 等），Gemini 情緒分析 + 業配辨識。每週日自動更新。",
    rows: [
      ["強正面（名醫專訪、得獎）每篇", "+5 分（媒體權威加權）"],
      ["正面（一般推薦報導）每篇", "+2.5 分"],
      ["中性報導每篇", "0 分"],
      ["負面報導每篇", "-2.5 分"],
      ["強負面（醫療事故、訴訟敗訴）每篇", "-5 分"],
      ["業配內容自動降權（×0.3）", "—"],
    ],
  },
];

export default function ScoringPage() {
  return (
    <div style={{ background: "#FAFAF8", minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "36px 24px 32px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EBF8FF", border: "1px solid #BEE3F8", borderRadius: 20, padding: "3px 12px", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#2B6CB0" }}>100分制・全資料公開・任何人都可以驗證</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A202C", margin: "0 0 10px" }}>評分標準</h1>
        <p style={{ fontSize: 14, color: "#718096", maxWidth: 540, margin: "0 auto" }}>
          我們的評分採 100 分制，分為五個維度，每個維度的資料來源、計算邏輯全部公開透明，不存在任何不透明的人工調整。
        </p>
      </div>

      {/* Overview card */}
      <div style={{ maxWidth: 860, margin: "32px auto 0", padding: "0 24px" }}>
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <p style={{ fontSize: 14, color: "#4A5568", marginBottom: 16, lineHeight: 1.7 }}>
            我們相信：選擇醫美診所前，消費者應該有權獲取客觀、可驗證的資訊。所有評分資料均來自公開的官方來源，我們只做資料整合與呈現，不做任何主觀判斷。
          </p>
          <div style={{ background: "#2B6CB0", borderRadius: 10, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>100分滿分，五個維度各20分</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {DIMENSIONS.map((d) => (
                <span key={d.num} style={{ fontSize: 12, fontWeight: 600, background: d.status === "live" ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.1)", color: d.status === "live" ? "#fff" : "rgba(255,255,255,.5)", borderRadius: 99, padding: "3px 10px" }}>
                  {d.title}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Dimension cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
          {DIMENSIONS.map((d) => (
            <div key={d.num} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ background: d.bg, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 28, height: 28, borderRadius: "50%", background: d.color, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {d.num}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: d.color }}>{d.title}</span>
                </div>
                {d.status === "live" ? (
                  <span style={{ fontSize: 11, fontWeight: 700, background: d.color, color: "#fff", borderRadius: 99, padding: "3px 10px" }}>✅ 已上線・滿分 20 分</span>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 700, background: "#F7FAFC", color: "#A0AEC0", border: "1px solid #E2E8F0", borderRadius: 99, padding: "3px 10px" }}>⏳ 開發中</span>
                )}
              </div>
              {/* Body */}
              <div style={{ padding: "16px 20px" }}>
                <p style={{ fontSize: 13, color: "#718096", lineHeight: 1.7, marginBottom: d.rows.length > 0 ? 14 : 0 }}>{d.desc}</p>
                {d.rows.length > 0 && (
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#F7FAFC" }}>
                          <th style={{ padding: "8px 14px", textAlign: "left", fontWeight: 600, color: "#718096", borderBottom: "1px solid #E2E8F0" }}>條件</th>
                          <th style={{ padding: "8px 14px", textAlign: "right", fontWeight: 600, color: "#718096", borderBottom: "1px solid #E2E8F0" }}>分數</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.rows.map((row, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAF8" }}>
                            <td style={{ padding: "8px 14px", color: "#4A5568", borderBottom: i < d.rows.length - 1 ? "1px solid #E2E8F0" : "none" }}>{row[0]}</td>
                            <td style={{ padding: "8px 14px", color: d.color, fontWeight: 700, textAlign: "right", borderBottom: i < d.rows.length - 1 ? "1px solid #E2E8F0" : "none" }}>{row[1]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {d.status === "pending" && (
                  <div style={{ background: "#F7FAFC", border: "1px dashed #E2E8F0", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>🚧</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#718096" }}>此維度正在開發中</div>
                      <div style={{ fontSize: 12, color: "#A0AEC0" }}>資料蒐集與評分規則制定中，預計近期上線</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24, marginBottom: 32 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1A202C", marginBottom: 14 }}>補充說明</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "所有評分均以診所為單位進行統計，而非醫師個人。",
              "Google 評分每10天、司法資料每月、稽查違規與媒體口碑每週自動更新，以反映最新狀況。",
              "若您發現資料有誤，請透過 LINE 官方帳號與我們聯繫，我們將在 5 個工作日內回覆。",
              "本平台不接受診所付費提升評分，所有數值均由系統依規則自動計算。",
            ].map((item, i) => (
              <li key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#718096", lineHeight: 1.7 }}>
                <span style={{ color: "#2B6CB0", flexShrink: 0 }}>•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: "#2B6CB0", padding: "40px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 16px" }}>了解評分標準後，查看你想去的診所吧</h2>
        <Link
          href="/clinics"
          style={{ display: "inline-block", background: "#fff", color: "#2B6CB0", borderRadius: 10, padding: "12px 32px", fontSize: 15, fontWeight: 700, textDecoration: "none" }}
        >
          查詢診所評分 →
        </Link>
      </div>
    </div>
  );
}
