import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "口碑評分規則 | 360 醫美 AI 大調查",
  description: "網路媒體口碑與社群口碑兩維度的評分公式、媒體權威分級與申訴機制",
};

export default function ReputationPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#F7FAFC" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "32px 20px 80px" }}>
        <nav style={{ fontSize: 12, marginBottom: 20 }}>
          <Link href="/" style={{ color: "#718096", textDecoration: "none" }}>首頁</Link>
          <span style={{ margin: "0 6px" }}>/</span>
          <span style={{ color: "#1A202C" }}>口碑評分規則</span>
        </nav>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1A202C", marginBottom: 12 }}>口碑評分規則</h1>
        <p style={{ fontSize: 14, color: "#718096", marginBottom: 32 }}>版本 v1.0 · 最後更新 2026-05-10</p>

        <Section title="一、共通設計">
          <pre style={preStyle}>
{`基準分：60 分（無資料 = 中性）
範圍：0 ~ 100
更新頻率：每日重算
資料區間：採近 12 個月
4 大加權因子：情緒 × 來源 × 真實度 × 新鮮度`}
          </pre>
        </Section>

        <Section title="二、網路媒體口碑（News Score）公式">
          <pre style={preStyle}>
{`News Score = 60 + Σ(每篇文章貢獻值)
每篇貢獻 = 情緒分 × 媒體權威 × 業配折扣 × 時間衰減 × 5
最終 cap 在 0 ~ 100`}
          </pre>

          <h3 style={h3Style}>情緒分</h3>
          <table style={tableStyle}>
            <thead><tr><th>內容類型</th><th>分數</th></tr></thead>
            <tbody>
              <tr><td>強正面（名醫專訪、得獎）</td><td>+1.0</td></tr>
              <tr><td>正面（一般推薦報導）</td><td>+0.5</td></tr>
              <tr><td>中性（純資訊）</td><td>0</td></tr>
              <tr><td>負面（消費者投訴）</td><td>-0.5</td></tr>
              <tr><td>強負面（醫療事故、訴訟）</td><td>-1.0</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>媒體權威度</h3>
          <table style={tableStyle}>
            <thead><tr><th>等級</th><th>媒體</th><th>權重</th></tr></thead>
            <tbody>
              <tr><td>A 級 主流</td><td>蘋果、聯合、自由、中時、TVBS、鏡週刊</td><td>×1.5</td></tr>
              <tr><td>B 級 網路</td><td>ETtoday、三立、東森、Yahoo、風傳媒</td><td>×1.2</td></tr>
              <tr><td>C 級 醫美專業</td><td>醫美時尚、美人圈、ELLE、美麗佳人</td><td>×1.0</td></tr>
              <tr><td>D 級 不知名</td><td>內容農場 / 自動辨識</td><td>×0.5</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>業配折扣</h3>
          <table style={tableStyle}>
            <thead><tr><th>判定</th><th>權重</th></tr></thead>
            <tbody>
              <tr><td>純編輯內容</td><td>×1.0</td></tr>
              <tr><td>疑似業配（含「合作刊登」「廣編」）</td><td>×0.3</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>時間衰減</h3>
          <table style={tableStyle}>
            <thead><tr><th>時間</th><th>權重</th></tr></thead>
            <tbody>
              <tr><td>近 3 個月</td><td>×1.0</td></tr>
              <tr><td>3–6 個月</td><td>×0.7</td></tr>
              <tr><td>6–12 個月</td><td>×0.4</td></tr>
              <tr><td>12 個月以上</td><td>不計入</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>重大事件加重</h3>
          <ul>
            <li>醫療事故報導（造成傷亡）：單篇 -20 分（不衰減）</li>
            <li>訴訟敗訴報導：單篇 -10 分</li>
            <li>得獎/權威認證報導：單篇 +5 分</li>
          </ul>
        </Section>

        <Section title="三、社群口碑（Social Score）公式">
          <pre style={preStyle}>
{`Social Score = 60 + Σ(每篇貼文貢獻值)
每篇貢獻 = 情緒分 × 平台權重 × 互動權重 × 業配折扣 × 時間衰減 × 5`}
          </pre>

          <h3 style={h3Style}>平台權重</h3>
          <table style={tableStyle}>
            <thead><tr><th>平台</th><th>權重</th><th>理由</th></tr></thead>
            <tbody>
              <tr><td>PTT MakeUp / BeautySalon</td><td>×1.5</td><td>老用戶集中、討論深度高</td></tr>
              <tr><td>Dcard 美容板 / 整形板</td><td>×1.3</td><td>匿名真實、互動量大</td></tr>
              <tr><td>Mobile01 美容時尚</td><td>×1.0</td><td>中年女性主力</td></tr>
              <tr><td>痞客邦 / 部落格</td><td>×0.7</td><td>業配比例高</td></tr>
            </tbody>
          </table>

          <h3 style={h3Style}>互動權重</h3>
          <table style={tableStyle}>
            <thead><tr><th>互動程度</th><th>標準</th><th>權重</th></tr></thead>
            <tbody>
              <tr><td>高互動</td><td>留言 ≥ 50 或推 ≥ 100</td><td>×1.3</td></tr>
              <tr><td>中互動</td><td>留言 10–49</td><td>×1.0</td></tr>
              <tr><td>低互動</td><td>留言 &lt; 10</td><td>×0.6</td></tr>
              <tr><td>噓爆文（PTT）</td><td>噓 &gt; 推 × 2</td><td>×1.5（負面加重）</td></tr>
            </tbody>
          </table>
        </Section>

        <Section title="四、評分等級對照">
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

        <Section title="五、防作弊設計">
          <ol>
            <li>同來源同診所 24 小時內僅計第一篇（防灌水）</li>
            <li>單篇權重上限 ±5 分（防極端）</li>
            <li>互動數據抓取後 24 小時內凍結（防即時操作）</li>
            <li>新建立帳號 / 低聲望帳號發文 ×0.5</li>
            <li>短時間爆量負評 → 觸發人工審核（防黑公關）</li>
          </ol>
        </Section>

        <Section title="六、診所申訴機制">
          <p>診所可對單篇來源提出異議：</p>
          <ul>
            <li>「這不是業配」→ 進入人工複核（5 個工作天）</li>
            <li>「報導不實」→ 附證據申請隱藏</li>
            <li>「已和解 / 已改善」→ 不刪除原文，但可附「診所回應」</li>
          </ul>
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

const tableStyle: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 8,
};

const preStyle: React.CSSProperties = {
  background: "#F7FAFC", border: "1px solid #E2E8F0", borderRadius: 6,
  padding: 16, fontSize: 12, lineHeight: 1.7, color: "#1A202C",
  whiteSpace: "pre-wrap", overflow: "auto",
};

const h3Style: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: "#2D3748", marginTop: 20, marginBottom: 8 };

const linkStyle: React.CSSProperties = { color: "#2B6CB0", textDecoration: "none", fontWeight: 600 };
