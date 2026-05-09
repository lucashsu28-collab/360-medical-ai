import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "稽查違規紀錄顯示政策 | 360 醫美 AI 大調查",
  description: "本平台「稽查違規紀錄」維度的資料來源、顯示規則與診所申訴機制",
};

export default function PenaltyPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#F7FAFC" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* breadcrumb */}
        <nav style={{ fontSize: 12, marginBottom: 20 }}>
          <Link href="/" style={{ color: "#718096", textDecoration: "none" }}>首頁</Link>
          <span style={{ margin: "0 6px" }}>/</span>
          <span style={{ color: "#1A202C" }}>稽查違規紀錄政策</span>
        </nav>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1A202C", marginBottom: 12 }}>
          稽查違規紀錄顯示政策
        </h1>
        <p style={{ fontSize: 14, color: "#718096", marginBottom: 32 }}>版本 v1.0 · 最後更新 2026-05-10</p>

        <Section title="一、資料來源">
          <p>本平台「稽查違規紀錄」維度資料聚合自以下來源：</p>
          <ul>
            <li><strong>新聞媒體報導</strong>（主力）：透過 Google News 聚合主流媒體與專業媒體報導</li>
            <li><strong>各縣市衛生局新聞稿</strong>：北市、新北、桃園、台中、台南、高雄</li>
            <li><strong>公平交易委員會處分書</strong>（補充）</li>
          </ul>
          <Note>
            台灣各縣市衛生局處分公告普遍以匿名「○○診所」呈現，僅在新聞媒體採訪報導時才會具名。
            本平台僅呈現「具名」公開資訊，不涉及私人或匿名案件推測。
          </Note>
        </Section>

        <Section title="二、分層顯示策略">
          <table style={tableStyle}>
            <thead>
              <tr><th>時間範圍</th><th>顯示方式</th></tr>
            </thead>
            <tbody>
              <tr><td>近 3 年</td><td>完整顯示（日期、項目、金額、法條、原連結）</td></tr>
              <tr><td>3–5 年</td><td>摘要顯示（折疊式列表）</td></tr>
              <tr><td>5 年以上</td><td>不顯示（內部仍保留）</td></tr>
              <tr><td><strong>重大違規</strong></td><td><strong>永久顯示，不論時間</strong></td></tr>
            </tbody>
          </table>
        </Section>

        <Section title="三、重大違規定義（永久顯示）">
          <p>以下任一即適用：</p>
          <ol>
            <li>違反醫療法第 28 條（密醫 / 非醫師執行醫療業務）</li>
            <li>造成病患死亡或重傷的醫療事故處分</li>
            <li>停業處分（不論天數）</li>
            <li>醫療機構或醫師證書廢止 / 註銷</li>
            <li>違反人體試驗管理辦法</li>
          </ol>
        </Section>

        <Section title="四、嚴重度分級">
          <table style={tableStyle}>
            <thead>
              <tr><th>分級</th><th>判定條件</th></tr>
            </thead>
            <tbody>
              <tr><td>🔴 重大</td><td>停業 / 廢止證書 / 致死致傷 / 密醫 / 人體試驗違規</td></tr>
              <tr><td>🟡 中度</td><td>罰款 ≥ NT$ 100,000，或單一年度受罰 ≥ 3 次</td></tr>
              <tr><td>🟢 輕微</td><td>罰款 &lt; NT$ 50,000，或單純廣告 / 標示類違規</td></tr>
            </tbody>
          </table>
        </Section>

        <Section title="五、評分公式">
          <pre style={preStyle}>
{`Penalty Score = 100 - Σ(每筆扣分)

🔴 重大違規：每筆 -25 分（不衰減，永久）
🟡 中度違規：每筆 -10 分（依時間衰減）
🟢 輕微違規：每筆 -3 分（依時間衰減）

時間衰減：
  近 1 年    ×1.0
  1-2 年    ×0.7
  2-3 年    ×0.4
  3-5 年    ×0.2
  5+ 年     ×0（重大例外，仍永久計入）

無紀錄 = 100 分（滿分）`}
          </pre>
        </Section>

        <Section title="六、診所申訴機制">
          <p>診所對處分內容若有異議，可透過診所後台提出申訴：</p>
          <ul>
            <li><strong>已和解 / 已改善</strong>：可上傳「改善說明」(≤ 200 字)，經審核後顯示在處分紀錄下方</li>
            <li><strong>資料錯誤</strong>：附證據申請隱藏，由人工審核（5 個工作天內回覆）</li>
            <li><strong>非業配誤判</strong>（口碑維度）：見 <Link href="/rules/reputation" style={linkStyle}>口碑評分規則</Link></li>
          </ul>
        </Section>

        <Section title="七、用詞規範">
          <p>本平台統一使用中性用語：</p>
          <ul>
            <li>✅ 採用：「曾受行政處分」「違規紀錄」「處分案件」</li>
            <li>❌ 禁用：「黑心診所」「劣跡」「不良診所」</li>
          </ul>
        </Section>

        <Section title="八、資料免責">
          <p>本頁資料來自政府公開資料與新聞媒體報導，內容以原始公告為準。</p>
          <p>本平台不對處分內容做事實判斷，僅呈現公開資訊。每筆處分皆附原始公告連結，使用者可自行驗證。</p>
        </Section>

        <div style={{ marginTop: 40, padding: 16, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#718096", margin: 0 }}>
            如對特定診所處分紀錄有疑問，請至診所頁面查看 →{" "}
            <Link href="/clinics" style={linkStyle}>全台診所資料館</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24, marginBottom: 16 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1A202C", marginTop: 0, marginBottom: 14 }}>{title}</h2>
      <div style={{ fontSize: 14, color: "#4A5568", lineHeight: 1.8 }}>{children}</div>
    </section>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 12, padding: 12, background: "#FFFAF0", borderLeft: "3px solid #F6AD55", borderRadius: 6, fontSize: 13, color: "#744210" }}>
      💡 {children}
    </div>
  );
}

const tableStyle: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 8,
};

const preStyle: React.CSSProperties = {
  background: "#F7FAFC", border: "1px solid #E2E8F0", borderRadius: 6,
  padding: 16, fontSize: 12, lineHeight: 1.7, color: "#1A202C",
  whiteSpace: "pre-wrap", overflow: "auto",
};

const linkStyle: React.CSSProperties = { color: "#2B6CB0", textDecoration: "none", fontWeight: 600 };
