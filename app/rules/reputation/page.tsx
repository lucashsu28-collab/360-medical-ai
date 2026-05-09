import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "媒體口碑評分規則 | 360 醫美 AI 大調查",
  description: "媒體口碑維度的評分公式、媒體權威分級與申訴機制",
};

export default function ReputationPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#F7FAFC" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "32px 20px 80px" }}>
        <nav style={{ fontSize: 12, marginBottom: 20 }}>
          <Link href="/" style={{ color: "#718096", textDecoration: "none" }}>首頁</Link>
          <span style={{ margin: "0 6px" }}>/</span>
          <span style={{ color: "#1A202C" }}>媒體口碑評分規則</span>
        </nav>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1A202C", marginBottom: 12 }}>媒體口碑評分規則</h1>
        <p style={{ fontSize: 14, color: "#718096", marginBottom: 32 }}>版本 v2.0 · 最後更新 2026-05-10</p>

        <Section title="一、評分維度說明">
          <p>本平台診所評鑑採用 <strong>五維度評分</strong>，每維度滿分 20 分，總分滿分 100：</p>
          <ol>
            <li><strong>司法糾紛</strong>（20 分）— 司法院裁判書</li>
            <li><strong>Google 評分</strong>（20 分）— Google Places 公開評論</li>
            <li><strong>合法登記</strong>（20 分）— 衛福部健保署</li>
            <li><strong>稽查違規紀錄</strong>（20 分）— 政府公開資料 + 媒體報導 → 詳見 <Link href="/rules/penalty" style={linkStyle}>稽查紀錄政策</Link></li>
            <li><strong>媒體口碑</strong>（20 分）— 主流媒體報導，本頁說明</li>
          </ol>
          <Note>
            為維護評分客觀性，社群匿名討論（PTT/Dcard/論壇）<strong>不納入評分</strong>。
            社群內容易受水軍、業配與黑公關操作，本平台僅採用可驗證、可追溯的主流媒體來源。
          </Note>
        </Section>

        <Section title="二、媒體口碑公式">
          <pre style={preStyle}>
{`媒體口碑分數 = 60 + Σ(每篇文章貢獻值)
每篇貢獻 = 情緒分 × 媒體權威 × 業配折扣 × 時間衰減 × 5
最終 cap 在 0 ~ 100

對總分貢獻 = (媒體口碑分數 / 100) × 20

基準分：60（無資料 = 中性，不偏袒不打壓）
資料區間：近 12 個月`}
          </pre>
        </Section>

        <Section title="三、情緒分">
          <table style={tableStyle}>
            <thead><tr><th>內容類型</th><th>分數</th></tr></thead>
            <tbody>
              <tr><td>強正面（名醫專訪、得獎、權威認證）</td><td>+1.0</td></tr>
              <tr><td>正面（一般推薦報導、心得分享多正面）</td><td>+0.5</td></tr>
              <tr><td>中性（純資訊、新聞快報、診所介紹）</td><td>0</td></tr>
              <tr><td>負面（消費者投訴、警告、爭議）</td><td>-0.5</td></tr>
              <tr><td>強負面（醫療事故傷亡、訴訟敗訴、執照廢止）</td><td>-1.0</td></tr>
            </tbody>
          </table>
        </Section>

        <Section title="四、媒體權威度">
          <table style={tableStyle}>
            <thead><tr><th>等級</th><th>媒體</th><th>權重</th></tr></thead>
            <tbody>
              <tr><td>A 級 主流</td><td>蘋果、聯合、自由、中時、TVBS、鏡週刊</td><td>×1.5</td></tr>
              <tr><td>B 級 網路</td><td>ETtoday、三立、東森、Yahoo、風傳媒、新頭殼</td><td>×1.2</td></tr>
              <tr><td>C 級 醫美專業</td><td>醫美時尚、美人圈、ELLE、美麗佳人</td><td>×1.0</td></tr>
              <tr><td>D 級 不知名</td><td>內容農場 / 自動辨識</td><td>×0.5</td></tr>
            </tbody>
          </table>
        </Section>

        <Section title="五、業配折扣">
          <table style={tableStyle}>
            <thead><tr><th>判定</th><th>權重</th></tr></thead>
            <tbody>
              <tr><td>純編輯內容</td><td>×1.0</td></tr>
              <tr><td>疑似業配（含「合作刊登」「廣編」「廠商提供」）</td><td>×0.3</td></tr>
              <tr><td>確認業配</td><td>×0.1</td></tr>
            </tbody>
          </table>
          <p style={{ marginTop: 10 }}>業配辨識由 <strong>關鍵字 + Gemini AI 雙重判定</strong>，前台會明確標示業配內容並折扣計分。</p>
        </Section>

        <Section title="六、時間衰減">
          <table style={tableStyle}>
            <thead><tr><th>時間</th><th>權重</th></tr></thead>
            <tbody>
              <tr><td>近 3 個月</td><td>×1.0</td></tr>
              <tr><td>3–6 個月</td><td>×0.7</td></tr>
              <tr><td>6–12 個月</td><td>×0.4</td></tr>
              <tr><td>12 個月以上</td><td>不計入</td></tr>
            </tbody>
          </table>
        </Section>

        <Section title="七、重大事件加重">
          <ul>
            <li>醫療事故報導（造成傷亡）：單篇 -20 分（不衰減，永久計入）</li>
            <li>訴訟敗訴報導：單篇 -10 分</li>
            <li>得獎/權威認證報導：單篇 +5 分</li>
          </ul>
        </Section>

        <Section title="八、評分等級對照">
          <table style={tableStyle}>
            <thead><tr><th>分數</th><th>等級</th><th>標籤</th></tr></thead>
            <tbody>
              <tr><td>90–100</td><td>S</td><td>🌟 口碑卓越</td></tr>
              <tr><td>80–89</td><td>A</td><td>⭐ 口碑優良</td></tr>
              <tr><td>70–79</td><td>B</td><td>✓ 口碑良好</td></tr>
              <tr><td>60–69</td><td>C</td><td>➖ 口碑中性</td></tr>
              <tr><td>50–59</td><td>D</td><td>⚠️ 口碑普通</td></tr>
              <tr><td>0–49</td><td>E</td><td>🔴 口碑警示</td></tr>
            </tbody>
          </table>
        </Section>

        <Section title="九、防作弊設計">
          <ol>
            <li>同來源同診所 24 小時內僅計第一篇（防灌水）</li>
            <li>單篇權重上限 ±5 分（防極端）</li>
            <li>D 級不知名媒體權重折半，避免內容農場操作</li>
            <li>業配辨識雙軌：關鍵字 + Gemini AI</li>
          </ol>
        </Section>

        <Section title="十、診所申訴機制">
          <p>診所可對單篇來源提出異議：</p>
          <ul>
            <li>「這不是業配」→ 進入人工複核（5 個工作天）</li>
            <li>「報導不實」→ 附證據申請隱藏</li>
            <li>「已和解 / 已改善」→ 不刪除原文，但可附「診所回應」</li>
          </ul>
          <p style={{ marginTop: 10 }}>申訴入口：診所後台 <code style={{ fontSize: 12, background: "#F7FAFC", padding: "2px 6px", borderRadius: 4 }}>/portal/[id]/penalties</code></p>
        </Section>

        <div style={{ marginTop: 40, padding: 16, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#718096", margin: 0 }}>
            稽查違規紀錄相關規則 →{" "}
            <Link href="/rules/penalty" style={linkStyle}>稽查違規顯示政策</Link>
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
