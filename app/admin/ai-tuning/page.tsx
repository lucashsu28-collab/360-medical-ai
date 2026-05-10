"use client";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// ── 常數 ────────────────────────────────────────────────────────────────────

const COLLOQUIAL_EXAMPLES: Record<number, string> = {
  1: "建議您參考該診所之評鑑報告，以利做出適當決策。",
  2: "可以看看這家診所的評鑑結果，作為參考依據。",
  3: "來看看這家診所評得怎樣！評分還不錯喔 😊",
  4: "哇這家超讚的！快看評分！你一定要考慮這家！🔥",
};

const RHYTHM_CARDS = [
  { key: "short", label: "簡短快速", sub: "1-2 句", example: "這家評分 86 分，司法紀錄乾淨，推薦考慮！" },
  { key: "medium", label: "中等節奏", sub: "3-5 句", example: "這家診所在台北信義區，Google 評分 4.7 分，我們評鑑總分 86 分。司法紀錄顯示無糾紛，合法登記正常。整體評估是品質穩定的選擇。" },
  { key: "detailed", label: "詳細完整", sub: "多段落", example: "根據我們的五維度評鑑系統，這家診所各項表現如下：\n\n合法登記：20/20（衛福部查詢正常）\nGoogle 評分：16/20（4.7星，521則評論）\n司法糾紛：20/20（無任何裁判書紀錄）\n稽查違規：20/20（近 3 年無公開違規紀錄）\n媒體口碑：12/20（基準分，無顯著正/負面報導）\n\n綜合來看，這是台北信義區品質相對穩定的選擇，特別適合第一次接觸醫美的朋友。" },
];

const CONDITION_OPTIONS = [
  "猶豫或不確定", "詢問療程費用", "比較多家診所",
  "表達擔心或疑慮", "沉默超過5分鐘", "對某診所表達興趣", "詢問如何預約",
];
const ACTION_OPTIONS = [
  "主動詢問具體需求", "提供客觀評鑑數據比較", "立即推送預約連結",
  "先同理再提供資訊", "主動提問重新引導",
];
const CONDITION_EXAMPLES: Record<string, string> = {
  "猶豫或不確定": "AI：我理解你現在有點猶豫，能告訴我你最在意哪方面嗎？是費用、醫師資歷，還是術後恢復？",
  "詢問療程費用": "AI：費用會因診所和方案不同有所差異，我幫你列出幾家評分高的診所報價比較一下～",
  "比較多家診所": "AI：我來用客觀評鑑分數幫你比較，這樣選擇更有依據！",
  "表達擔心或疑慮": "AI：我懂那種感覺，這類擔心很正常。讓我先說說這個療程的實際狀況……",
  "沉默超過5分鐘": "AI：還在嗎？如果有任何疑問都可以問我，或者我幫你推薦幾個熱門療程？",
  "對某診所表達興趣": "AI：這家評鑑分數不錯！你想直接預約還是先了解更多？",
  "詢問如何預約": "AI：很簡單！點選診所頁面的「立即預約」，填入療程和希望時間，我們會幫你安排 😊",
};

const INTENSITY_LABELS: Record<number, string> = {
  1: "完全被動，等用戶主動詢問",
  2: "輕度引導，偶爾提出建議",
  3: "主動分享資訊，適時推進",
  4: "積極引導，適時提供行動建議",
  5: "高度積極，主動推進預約轉換",
};

interface TriggerRule { condition: string; action: string; enabled: boolean; }
interface FaqItem { question: string; answer: string; enabled: boolean; }
interface GuideLogic { trust_building: boolean; recommend_report: boolean; lead_booking: boolean; }

const DEFAULT_OPENING = `嗨！我是 360 醫美 AI 顧問 😊

您是否正在考慮醫美療程，或想查詢某家診所的評鑑結果呢？

我可以幫您查詢診所的司法紀錄、合法登記狀態、Google 真實評論，讓您做出更有信心的選擇！請直接告訴我您想了解什麼 👇`;

const DEFAULT_BANNED = ["保證效果","絕對安全","100%有效","最好的診所","第一名","神奇療效","永久有效","完全根治","瘦X公斤","年輕X歲","無副作用","不會痛"];

const DEFAULT_RULES: TriggerRule[] = [
  { condition: "猶豫或不確定", action: "主動詢問具體需求", enabled: true },
  { condition: "比較多家診所", action: "提供客觀評鑑數據比較", enabled: true },
  { condition: "對某診所表達興趣", action: "立即推送預約連結", enabled: true },
  { condition: "表達擔心或疑慮", action: "先同理再提供資訊", enabled: true },
  { condition: "沉默超過5分鐘", action: "主動提問重新引導", enabled: true },
];

const DEFAULT_FAQ: FaqItem[] = [
  { question: "玻尿酸多少錢？", answer: "玻尿酸的費用依注射部位、品牌和劑量不同，一般約 $8,000–$25,000。建議直接詢問您有興趣的診所，或我幫您查看該診所的療程頁面 😊", enabled: true },
  { question: "怎麼選擇醫美診所？", answer: "建議從三個面向評估：合法登記（衛福部健保署）、司法糾紛紀錄（司法院裁判書）、Google 真實評論。我可以幫您查詢任一診所的評鑑報告，直接輸入診所名稱就可以囉！", enabled: true },
  { question: "你們是廣告嗎？", answer: "我們是獨立的醫美評鑑平台，評鑑分數完全依據官方公開資料自動計算，不受商業關係影響。任何人都可以自行前往司法院、衛福部、Google Maps 驗證我們的資料 😊", enabled: true },
  { question: "如何預約診所？", answer: "找到您有興趣的診所後，點選「立即預約」按鈕，填寫療程、希望時間、姓名電話，送出後我們會安排諮詢師與您聯繫確認 😊", enabled: true },
];

// ── Helper components ────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "24px 28px", boxShadow: "0 1px 4px rgba(0,0,0,.06)", marginBottom: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1A202C", margin: "0 0 20px", paddingBottom: 12, borderBottom: "1px solid #F1F5F9" }}>{title}</h3>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        position: "relative", width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
        background: value ? "#2B6CB0" : "#CBD5E0", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: value ? 23 : 3, width: 18, height: 18,
        borderRadius: "50%", background: "#fff", transition: "left 0.2s",
      }} />
    </button>
  );
}

function ChatBubble({ role, text }: { role: "user" | "ai"; text: string }) {
  const isUser = role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 10 }}>
      <div style={{
        maxWidth: "75%", padding: "10px 14px", borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        background: isUser ? "#4299E1" : "#2D3748", color: "#fff", fontSize: 13, lineHeight: 1.6,
        whiteSpace: "pre-wrap",
      }}>
        {text}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AITuningPage() {
  const [tone, setTone] = useState<"formal" | "warm" | "concise">("warm");
  const [colloquialLevel, setColloquialLevel] = useState(2);
  const [rhythmMode, setRhythmMode] = useState<"short" | "medium" | "detailed">("medium");
  const [autoRhythm, setAutoRhythm] = useState(false);
  const [replyLength, setReplyLength] = useState(3);
  const [pauseLevel, setPauseLevel] = useState(3);
  const [guideLogic, setGuideLogic] = useState<GuideLogic>({ trust_building: true, recommend_report: true, lead_booking: true });
  const [guideIntensity, setGuideIntensity] = useState(3);
  const [dailyTarget, setDailyTarget] = useState(5);
  const [conversionTarget, setConversionTarget] = useState(30);
  const [openingMessage, setOpeningMessage] = useState(DEFAULT_OPENING);
  const [bannedWords, setBannedWords] = useState<string[]>(DEFAULT_BANNED);
  const [newWord, setNewWord] = useState("");
  const [triggerRules, setTriggerRules] = useState<TriggerRule[]>(DEFAULT_RULES);
  const [faqAnswers, setFaqAnswers] = useState<FaqItem[]>(DEFAULT_FAQ);
  const [editFaqIdx, setEditFaqIdx] = useState<number | null>(null);
  const [editFaqDraft, setEditFaqDraft] = useState<FaqItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token") || "";
    fetch(`${API_URL}/api/admin/ai-tuning/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.tone) setTone(d.tone);
        if (d.colloquial_level) setColloquialLevel(d.colloquial_level);
        if (d.rhythm_mode) setRhythmMode(d.rhythm_mode);
        if (d.auto_rhythm !== undefined) setAutoRhythm(d.auto_rhythm);
        if (d.reply_length) setReplyLength(d.reply_length);
        if (d.pause_level) setPauseLevel(d.pause_level);
        if (d.guide_logic) setGuideLogic(d.guide_logic);
        if (d.guide_intensity) setGuideIntensity(d.guide_intensity);
        if (d.daily_target) setDailyTarget(d.daily_target);
        if (d.conversion_target) setConversionTarget(d.conversion_target);
        if (d.opening_message) setOpeningMessage(d.opening_message);
        if (d.banned_words?.length) setBannedWords(d.banned_words);
        if (d.trigger_rules?.length) setTriggerRules(d.trigger_rules);
        if (d.faq_answers?.length) setFaqAnswers(d.faq_answers);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const token = localStorage.getItem("admin_token") || "";
      const settings = {
        tone, colloquial_level: colloquialLevel, rhythm_mode: rhythmMode,
        auto_rhythm: autoRhythm, reply_length: replyLength, pause_level: pauseLevel,
        guide_logic: guideLogic, guide_intensity: guideIntensity,
        daily_target: dailyTarget, conversion_target: conversionTarget,
        opening_message: openingMessage, banned_words: bannedWords,
        trigger_rules: triggerRules, faq_answers: faqAnswers,
      };
      const res = await fetch(`${API_URL}/api/admin/ai-tuning/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      setSaveMsg(res.ok ? "✅ 設定儲存成功，Gemini Prompt 已更新！" : "❌ 儲存失敗");
      setTimeout(() => setSaveMsg(""), 4000);
    } catch {
      setSaveMsg("❌ 連線失敗");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, color: "#94A3B8", fontSize: 14 }}>載入中...</div>;

  const TONE_CARDS = [
    { key: "formal", icon: "📋", label: "專業嚴謹", desc: "正式書面語氣，措辭謹慎，適合高端客群" },
    { key: "warm", icon: "🤗", label: "親切溫暖", desc: "像朋友聊天，有溫度，放鬆的對話氛圍（預設）" },
    { key: "concise", icon: "⚡", label: "簡潔俐落", desc: "直接給答案，不廢話，效率優先" },
  ];

  return (
    <div style={{ maxWidth: 820 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>AI 顧問調校</h1>
          <p style={{ color: "#64748B", fontSize: 14, margin: "4px 0 0" }}>調整 LINE AI 顧問的對話風格與引導策略，設定儲存後即時生效</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {saveMsg && <span style={{ fontSize: 13, color: saveMsg.startsWith("✅") ? "#16A34A" : "#DC2626" }}>{saveMsg}</span>}
          <button
            onClick={handleSave} disabled={saving}
            style={{ padding: "10px 24px", background: saving ? "#93C5FD" : "#2B6CB0", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}
          >
            {saving ? "儲存中..." : "儲存設定"}
          </button>
        </div>
      </div>

      {/* 1. 語氣風格 */}
      <SectionCard title="① 語氣風格">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {TONE_CARDS.map((c) => (
            <button
              key={c.key}
              onClick={() => setTone(c.key as typeof tone)}
              style={{
                padding: "16px", borderRadius: 10, textAlign: "left", cursor: "pointer",
                border: tone === c.key ? "2px solid #2B6CB0" : "2px solid #E2E8F0",
                background: tone === c.key ? "#EBF8FF" : "#F8FAFC",
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: tone === c.key ? "#2B6CB0" : "#1A202C", marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>{c.desc}</div>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* 2. 口語化程度 */}
      <SectionCard title="② 口語化程度">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          {[1,2,3,4].map((v) => (
            <span key={v} style={{ fontSize: 12, color: colloquialLevel === v ? "#2B6CB0" : "#94A3B8", fontWeight: colloquialLevel === v ? 700 : 400 }}>
              {["書面正式","一般自然","口語親切","超口語活潑"][v-1]}
            </span>
          ))}
        </div>
        <input
          type="range" min={1} max={4} value={colloquialLevel}
          onChange={(e) => setColloquialLevel(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#2B6CB0", marginBottom: 16 }}
        />
        <div style={{ background: "#F0FFF4", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ fontSize: 20 }}>💬</span>
          <div>
            <div style={{ fontSize: 11, color: "#4ADE80", fontWeight: 600, marginBottom: 4 }}>範例回覆 — 程度 {colloquialLevel}</div>
            <div style={{ fontSize: 13, color: "#1A202C", lineHeight: 1.6 }}>{COLLOQUIAL_EXAMPLES[colloquialLevel]}</div>
          </div>
        </div>
      </SectionCard>

      {/* 3. 講話節奏 */}
      <SectionCard title="③ 講話節奏">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 10 }}>A-1 手動設定</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {RHYTHM_CARDS.map((c) => (
              <button
                key={c.key}
                onClick={() => setRhythmMode(c.key as typeof rhythmMode)}
                style={{
                  padding: "14px", borderRadius: 10, textAlign: "left", cursor: "pointer",
                  border: rhythmMode === c.key ? "2px solid #2B6CB0" : "2px solid #E2E8F0",
                  background: rhythmMode === c.key ? "#EBF8FF" : "#F8FAFC",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: rhythmMode === c.key ? "#2B6CB0" : "#1A202C" }}>{c.label}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", margin: "2px 0 8px" }}>{c.sub}</div>
                <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5, borderTop: "1px solid #E2E8F0", paddingTop: 8, whiteSpace: "pre-wrap" }}>{c.example.slice(0,60)}{c.example.length > 60 ? "…" : ""}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#F8FAFC", borderRadius: 10, marginBottom: autoRhythm ? 0 : 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1A202C" }}>A-2 自動偵測節奏</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>依訊息長度與情緒自動切換節奏</div>
          </div>
          <Toggle value={autoRhythm} onChange={setAutoRhythm} />
        </div>
        {autoRhythm && (
          <div style={{ background: "#EBF8FF", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#2B6CB0", marginBottom: 16 }}>
            {[
              "短訊（10字以內）→ 切換簡短快速",
              "中等訊息（11-50字）→ 維持中等節奏",
              "長訊息（51字以上）→ 切換詳細完整",
              "含負面情緒關鍵字 → 切換詳細安撫",
            ].map((r) => <div key={r} style={{ marginBottom: 3 }}>• {r}</div>)}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { label: "回覆長度", value: replyLength, onChange: setReplyLength, tips: ["很短","短","中等","長","很長"] },
            { label: "停頓感（換行頻率）", value: pauseLevel, onChange: setPauseLevel, tips: ["密集","稍密","適中","有呼吸感","很多停頓"] },
          ].map(({ label, value, onChange, tips }) => (
            <div key={label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>{label}</span>
                <span style={{ fontSize: 12, color: "#2B6CB0", fontWeight: 600 }}>{tips[value - 1]}</span>
              </div>
              <input type="range" min={1} max={5} value={value} onChange={(e) => onChange(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#2B6CB0" }} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 4. 引導邏輯 */}
      <SectionCard title="④ 引導邏輯（三階段）">
        {[
          { key: "trust_building" as keyof GuideLogic, label: "建立信任", desc: "先了解用戶需求，分享平台的資料來源與公正性" },
          { key: "recommend_report" as keyof GuideLogic, label: "推薦評鑑報告", desc: "引導查詢特定診所或療程的評鑑報告" },
          { key: "lead_booking" as keyof GuideLogic, label: "導向預約", desc: "當用戶有興趣時，主動提供預約連結" },
        ].map((item, idx) => (
          <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: idx < 2 ? "1px solid #F1F5F9" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#EBF8FF", color: "#2B6CB0", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {idx + 1}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A202C" }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>{item.desc}</div>
              </div>
            </div>
            <Toggle value={guideLogic[item.key]} onChange={(v) => setGuideLogic({ ...guideLogic, [item.key]: v })} />
          </div>
        ))}
      </SectionCard>

      {/* 5. 情境觸發規則 */}
      <SectionCard title="⑤ 情境觸發規則">
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {triggerRules.map((rule, idx) => (
            <div key={idx} style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 14px", border: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#64748B", flexShrink: 0 }}>當用戶</span>
                <select
                  value={rule.condition}
                  onChange={(e) => { const r = [...triggerRules]; r[idx] = { ...r[idx], condition: e.target.value }; setTriggerRules(r); }}
                  style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 12, background: "#fff" }}
                >
                  {CONDITION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
                <span style={{ fontSize: 12, color: "#64748B", flexShrink: 0 }}>→ AI 就</span>
                <select
                  value={rule.action}
                  onChange={(e) => { const r = [...triggerRules]; r[idx] = { ...r[idx], action: e.target.value }; setTriggerRules(r); }}
                  style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 12, background: "#fff" }}
                >
                  {ACTION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                  <Toggle value={rule.enabled} onChange={(v) => { const r = [...triggerRules]; r[idx] = { ...r[idx], enabled: v }; setTriggerRules(r); }} />
                  <button
                    onClick={() => setTriggerRules(triggerRules.filter((_, i) => i !== idx))}
                    style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 16, cursor: "pointer", padding: "0 4px" }}
                  >×</button>
                </div>
              </div>
              {CONDITION_EXAMPLES[rule.condition] && (
                <div style={{ fontSize: 11, color: "#64748B", paddingLeft: 8, borderLeft: "3px solid #E2E8F0", lineHeight: 1.5 }}>
                  {CONDITION_EXAMPLES[rule.condition]}
                </div>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => setTriggerRules([...triggerRules, { condition: CONDITION_OPTIONS[0], action: ACTION_OPTIONS[0], enabled: true }])}
          style={{ padding: "8px 16px", background: "#EFF6FF", color: "#2B6CB0", border: "1px dashed #93C5FD", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 500 }}
        >
          + 新增規則
        </button>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #F1F5F9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>引導積極程度</span>
            <span style={{ fontSize: 12, color: "#2B6CB0", fontWeight: 600 }}>{INTENSITY_LABELS[guideIntensity]}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>
            <span>被動等待用戶發問</span>
            <span>主動積極推進對話</span>
          </div>
          <input type="range" min={1} max={5} value={guideIntensity} onChange={(e) => setGuideIntensity(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#2B6CB0" }} />
        </div>

        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { label: "每日目標預約數", value: dailyTarget, onChange: setDailyTarget, suffix: "筆" },
            { label: "導流轉換率目標", value: conversionTarget, onChange: setConversionTarget, suffix: "%" },
          ].map(({ label, value, onChange, suffix }) => (
            <div key={label}>
              <label style={{ display: "block", fontSize: 13, color: "#475569", fontWeight: 500, marginBottom: 6 }}>{label}</label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="number" min={0} value={value} onChange={(e) => onChange(Number(e.target.value))}
                  style={{ width: 80, padding: "8px 10px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, textAlign: "center" }} />
                <span style={{ fontSize: 13, color: "#64748B" }}>{suffix}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 6. 開場白 */}
      <SectionCard title="⑥ 開場白設定">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>開場白內容</label>
              <span style={{ fontSize: 11, color: openingMessage.length > 150 ? "#EF4444" : "#94A3B8" }}>
                {openingMessage.length}/150
              </span>
            </div>
            <textarea
              value={openingMessage}
              onChange={(e) => setOpeningMessage(e.target.value.slice(0, 150))}
              rows={8}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#475569", marginBottom: 6 }}>LINE 預覽</div>
            <div style={{ background: "#E8F5E9", borderRadius: 12, padding: 16, minHeight: 160 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#4CAF50", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, flexShrink: 0 }}>🤖</div>
                <div style={{ background: "#fff", borderRadius: "0 12px 12px 12px", padding: "10px 14px", fontSize: 12, lineHeight: 1.7, color: "#1A202C", maxWidth: "85%", whiteSpace: "pre-wrap" }}>
                  {openingMessage}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 7. 合規詞過濾 */}
      <SectionCard title="⑦ 合規詞過濾">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {bannedWords.map((w) => (
            <span key={w} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "#FEF2F2", color: "#DC2626", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
              {w}
              <button onClick={() => setBannedWords(bannedWords.filter((x) => x !== w))}
                style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0, marginLeft: 2 }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text" value={newWord} onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && newWord.trim()) { setBannedWords([...bannedWords, newWord.trim()]); setNewWord(""); }}}
            placeholder="輸入新禁用詞"
            style={{ flex: 1, maxWidth: 200, padding: "8px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13 }}
          />
          <button
            onClick={() => { if (newWord.trim()) { setBannedWords([...bannedWords, newWord.trim()]); setNewWord(""); }}}
            style={{ padding: "8px 16px", background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 500 }}
          >
            + 新增
          </button>
        </div>
      </SectionCard>

      {/* 8. 熱門問題標準回答 */}
      <SectionCard title="⑧ 熱門問題標準回答">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: "#F8FAFC" }}>
            <tr>
              {["常見問題", "標準回答", "啟用", "操作"].map((h) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#64748B", fontWeight: 600, borderBottom: "1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {faqAnswers.map((faq, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                {editFaqIdx === idx ? (
                  <>
                    <td style={{ padding: "8px 12px" }}>
                      <input value={editFaqDraft!.question} onChange={(e) => setEditFaqDraft({ ...editFaqDraft!, question: e.target.value })}
                        style={{ width: "100%", padding: "6px 8px", border: "1px solid #93C5FD", borderRadius: 6, fontSize: 12 }} />
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <textarea value={editFaqDraft!.answer} onChange={(e) => setEditFaqDraft({ ...editFaqDraft!, answer: e.target.value })}
                        rows={2} style={{ width: "100%", padding: "6px 8px", border: "1px solid #93C5FD", borderRadius: 6, fontSize: 12, resize: "vertical" }} />
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <Toggle value={editFaqDraft!.enabled} onChange={(v) => setEditFaqDraft({ ...editFaqDraft!, enabled: v })} />
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { const f = [...faqAnswers]; f[idx] = editFaqDraft!; setFaqAnswers(f); setEditFaqIdx(null); setEditFaqDraft(null); }}
                          style={{ padding: "4px 10px", background: "#DCFCE7", color: "#16A34A", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer", fontWeight: 500 }}>儲存</button>
                        <button onClick={() => { setEditFaqIdx(null); setEditFaqDraft(null); }}
                          style={{ padding: "4px 10px", background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>取消</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: "10px 12px", color: "#1A202C", fontWeight: 500, maxWidth: 160 }}>{faq.question}</td>
                    <td style={{ padding: "10px 12px", color: "#475569", maxWidth: 280, lineHeight: 1.5 }}>{faq.answer.slice(0, 60)}{faq.answer.length > 60 ? "…" : ""}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <Toggle value={faq.enabled} onChange={(v) => { const f = [...faqAnswers]; f[idx] = { ...f[idx], enabled: v }; setFaqAnswers(f); }} />
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setEditFaqIdx(idx); setEditFaqDraft({ ...faq }); }}
                          style={{ padding: "4px 10px", background: "#EFF6FF", color: "#3B82F6", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer", fontWeight: 500 }}>編輯</button>
                        <button onClick={() => setFaqAnswers(faqAnswers.filter((_, i) => i !== idx))}
                          style={{ padding: "4px 10px", background: "#FEF2F2", color: "#EF4444", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>刪除</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={() => { const newFaq: FaqItem = { question: "", answer: "", enabled: true }; setFaqAnswers([...faqAnswers, newFaq]); setEditFaqIdx(faqAnswers.length); setEditFaqDraft(newFaq); }}
          style={{ marginTop: 12, padding: "8px 16px", background: "#F0FDF4", color: "#16A34A", border: "1px dashed #86EFAC", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 500 }}
        >
          + 新增問答
        </button>
      </SectionCard>

      {/* 9. 對話效果預覽 */}
      <SectionCard title="⑨ 對話效果預覽">
        <div style={{ background: "#1A202C", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: "#718096", marginBottom: 16, textAlign: "center" }}>
            模擬 LINE 對話 — 套用目前設定的語氣與節奏
          </div>
          <ChatBubble role="user" text="我想做玻尿酸，但不確定要選哪家診所" />
          <ChatBubble role="ai" text={
            tone === "formal"
              ? "建議您透過我們的評鑑系統，依合法登記、Google評分、司法糾紛、稽查違規、媒體口碑五個維度評估。請告知您所在地區以利提供建議。"
              : tone === "concise"
              ? "可以！你在哪個地區？我直接給你幾家高分診所。"
              : `我懂那種感覺，選診所確實需要做點功課 😊\n\n玻尿酸選診所主要看三件事：合法登記有沒有問題、有沒有糾紛紀錄、Google評論口碑怎麼樣。你大概在哪個地區呢？`
          } />
          <ChatBubble role="user" text="台北大安區附近" />
          <ChatBubble role="ai" text={
            rhythmMode === "short"
              ? "OK！大安區我這邊有幾家評分不錯的診所，要我列出來嗎？"
              : rhythmMode === "detailed"
              ? `根據我們五維度評鑑系統，台北大安區目前有三家合作診所評分達到 80 分以上：\n\n1. 評鑑分數最高的診所（總分 91）\n2. Google 評論最多的診所（4,200+ 則）\n3. 合法登記最完整的診所\n\n每家都有各自的優勢，你比較在意哪個面向呢？`
              : `台北大安區有幾家評鑑分數不錯的診所！我幫你篩選一下，你是偏好補充還是除皺呢？這樣可以更精準推薦 😊`
          } />
          <ChatBubble role="user" text="填充，想做嘴唇" />
          <ChatBubble role="ai" text={
            colloquialLevel <= 2
              ? "嘴唇玻尿酸是熱門項目，建議選擇具有豐富注射經驗的醫師。我為您查找評鑑報告中有嘴唇療程且評分優良的診所。"
              : colloquialLevel === 3
              ? "嘴唇玻尿酸超多人做的！嘴型設計真的很靠醫師技術，幫你找幾家在大安區口碑好的診所喔 😊"
              : "嘴唇耶！超多人做這個！🔥 嘴型設計超重要，要找技術好的醫師！我馬上幫你找幾家超讚的診所！"
          } />
          <div style={{ marginTop: 16, padding: "10px 14px", background: "#2D3748", borderRadius: 8, fontSize: 11, color: "#718096" }}>
            觸發規則說明：偵測到用戶詢問療程 → 引導說明地區與需求 → 準備推送評鑑報告
          </div>
        </div>
      </SectionCard>

      {/* 底部儲存 */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingBottom: 40 }}>
        {saveMsg && <span style={{ fontSize: 13, color: saveMsg.startsWith("✅") ? "#16A34A" : "#DC2626", alignSelf: "center" }}>{saveMsg}</span>}
        <button
          onClick={handleSave} disabled={saving}
          style={{ padding: "12px 32px", background: saving ? "#93C5FD" : "#2B6CB0", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "儲存中..." : "儲存設定並更新 Gemini Prompt"}
        </button>
      </div>
    </div>
  );
}
