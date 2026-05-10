"use client";
import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface ScoringRules {
  legal: { has_registration: number; no_registration: number };
  google_stars: {
    "4.5+": number; "4.0-4.4": number; "3.5-3.9": number;
    "3.0-3.4": number; below_3_0: number;
  };
  google_reviews: {
    "1000+": number; "500-999": number; "100-499": number;
    "1-99": number; "0": number;
  };
  judicial: {
    "0_cases": number; "1_case": number; "2_cases": number;
    "3_cases": number; "4plus_cases": number;
  };
}

const DEFAULT_RULES: ScoringRules = {
  legal: { has_registration: 20, no_registration: 0 },
  google_stars: { "4.5+": 15, "4.0-4.4": 12, "3.5-3.9": 9, "3.0-3.4": 6, below_3_0: 3 },
  google_reviews: { "1000+": 5, "500-999": 4, "100-499": 3, "1-99": 2, "0": 0 },
  judicial: { "0_cases": 20, "1_case": 15, "2_cases": 10, "3_cases": 5, "4plus_cases": 0 },
};

// API 回傳的 key 是 below_3.0，JS 不能直接用點，統一在載入/儲存時轉換
function apiToState(raw: Record<string, unknown>): ScoringRules {
  const gs = (raw.google_stars ?? {}) as Record<string, number>;
  return {
    legal: (raw.legal ?? DEFAULT_RULES.legal) as ScoringRules["legal"],
    google_stars: {
      "4.5+": gs["4.5+"] ?? 15,
      "4.0-4.4": gs["4.0-4.4"] ?? 12,
      "3.5-3.9": gs["3.5-3.9"] ?? 9,
      "3.0-3.4": gs["3.0-3.4"] ?? 6,
      below_3_0: gs["below_3.0"] ?? gs["below_3_0"] ?? 3,
    },
    google_reviews: (raw.google_reviews ?? DEFAULT_RULES.google_reviews) as ScoringRules["google_reviews"],
    judicial: (raw.judicial ?? DEFAULT_RULES.judicial) as ScoringRules["judicial"],
  };
}

function stateToApi(r: ScoringRules): Record<string, unknown> {
  return {
    legal: r.legal,
    google_stars: {
      "4.5+": r.google_stars["4.5+"],
      "4.0-4.4": r.google_stars["4.0-4.4"],
      "3.5-3.9": r.google_stars["3.5-3.9"],
      "3.0-3.4": r.google_stars["3.0-3.4"],
      "below_3.0": r.google_stars.below_3_0,
    },
    google_reviews: r.google_reviews,
    judicial: r.judicial,
  };
}

function NumInput({
  value, onChange,
}: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number" min={0} max={100}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        width: 60, padding: "4px 8px", border: "1px solid #E2E8F0",
        borderRadius: 6, fontSize: 14, textAlign: "center",
        outline: "none",
      }}
    />
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function RuleRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F1F5F9" }}>
      <span style={{ fontSize: 13, color: "#475569" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <NumInput value={value} onChange={onChange} />
        <span style={{ fontSize: 12, color: "#94A3B8" }}>分</span>
      </div>
    </div>
  );
}

function PendingCard({ title, icon }: { title: string; icon: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#94A3B8", margin: 0 }}>{title}</h2>
        <span style={{ fontSize: 11, background: "#F1F5F9", color: "#94A3B8", borderRadius: 10, padding: "2px 8px", fontWeight: 600 }}>建置中</span>
      </div>
      <div style={{ border: "1px dashed #E2E8F0", borderRadius: 8, padding: "18px 20px", color: "#94A3B8", fontSize: 13 }}>
        🚧 此維度資料蒐集中，預計 Phase 3 上線後正式啟用。
      </div>
    </div>
  );
}

export default function ScoringPage() {
  const [rules, setRules] = useState<ScoringRules>(DEFAULT_RULES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<"" | "ok" | "err">("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API_URL}/api/admin/scoring-rules`, {
      headers: { "x-admin-token": localStorage.getItem("admin_token") ?? "" },
    })
      .then((r) => r.json())
      .then((d) => {
        setRules(apiToState(d.rules ?? {}));
        setUpdatedAt(d.updated_at ?? null);
      })
      .catch(() => setRules(DEFAULT_RULES))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    setSaving(true);
    setSavedMsg("");
    try {
      const res = await fetch(`${API_URL}/api/admin/scoring-rules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": localStorage.getItem("admin_token") ?? "",
        },
        body: JSON.stringify({ rules: stateToApi(rules) }),
      });
      const data = await res.json();
      if (data.ok) {
        setSavedMsg("ok");
        setUpdatedAt(new Date().toISOString());
      } else {
        setSavedMsg("err");
      }
    } catch {
      setSavedMsg("err");
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(""), 3000);
    }
  }

  function setLegal(key: keyof ScoringRules["legal"], v: number) {
    setRules((r) => ({ ...r, legal: { ...r.legal, [key]: v } }));
  }
  function setStars(key: keyof ScoringRules["google_stars"], v: number) {
    setRules((r) => ({ ...r, google_stars: { ...r.google_stars, [key]: v } }));
  }
  function setReviews(key: keyof ScoringRules["google_reviews"], v: number) {
    setRules((r) => ({ ...r, google_reviews: { ...r.google_reviews, [key]: v } }));
  }
  function setJudicial(key: keyof ScoringRules["judicial"], v: number) {
    setRules((r) => ({ ...r, judicial: { ...r.judicial, [key]: v } }));
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>評分規則管理</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 16 }}>
        調整各維度評分規則，儲存後下次計算診所分數時生效
      </p>

      {/* 說明警示 */}
      <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: "10px 16px", marginBottom: 24, fontSize: 13, color: "#C2410C" }}>
        ⚠️ 評分規則調整後，需重新計算所有診所分數才會生效。目前規則儲存至資料庫，但自動重算功能預計 Phase 3 開放。
      </div>

      {loading ? (
        <div style={{ color: "#94A3B8", fontSize: 14, textAlign: "center", padding: 40 }}>載入中...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* 維度一：合法登記 */}
          <SectionCard title="合法登記（滿分 20 分）" icon="🏛️">
            <RuleRow label="有合法登記（健保署可查詢）" value={rules.legal.has_registration} onChange={(v) => setLegal("has_registration", v)} />
            <RuleRow label="無法查詢登記記錄" value={rules.legal.no_registration} onChange={(v) => setLegal("no_registration", v)} />
          </SectionCard>

          {/* 維度二：Google 評分 */}
          <SectionCard title="Google 評分（理論 20 分・實務 max ~17）" icon="⭐">
            <p style={{ fontSize: 12, color: "#64748B", marginBottom: 12, fontWeight: 600 }}>星等（max 13 分）</p>
            <RuleRow label="★ 4.9 以上" value={13} onChange={() => {}} />
            <RuleRow label="★ 4.7 ～ 4.8" value={11} onChange={() => {}} />
            <RuleRow label="★ 4.5 ～ 4.6" value={9} onChange={() => {}} />
            <RuleRow label="★ 4.0 ～ 4.4" value={6} onChange={() => {}} />
            <RuleRow label="★ 3.5 ～ 3.9" value={3} onChange={() => {}} />
            <RuleRow label="★ 低於 3.5" value={0} onChange={() => {}} />
            <p style={{ fontSize: 12, color: "#64748B", margin: "16px 0 12px", fontWeight: 600 }}>評論數量（max 5 分）</p>
            <RuleRow label="≥ 5,000 則" value={5} onChange={() => {}} />
            <RuleRow label="≥ 2,000 則" value={4} onChange={() => {}} />
            <RuleRow label="≥ 1,000 則" value={3} onChange={() => {}} />
            <RuleRow label="≥ 500 則" value={2} onChange={() => {}} />
            <RuleRow label="≥ 100 則" value={1} onChange={() => {}} />
            <RuleRow label="< 100 則" value={0} onChange={() => {}} />
            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 10, lineHeight: 1.6 }}>
              ※ 嚴格公式：醫美 ★4.5+ 是業界平均，不該等於滿分。理論滿 20 需 ★4.9+ 且 ≥5000 評論，目前無診所達標。實務 max ~17（★4.9+ 且 ≥2000 評論）。
            </p>
          </SectionCard>

          {/* 維度三：司法糾紛 */}
          <SectionCard title="司法糾紛（滿分 20 分）" icon="⚖️">
            <RuleRow label="0 件" value={rules.judicial["0_cases"]} onChange={(v) => setJudicial("0_cases", v)} />
            <RuleRow label="1 件" value={rules.judicial["1_case"]} onChange={(v) => setJudicial("1_case", v)} />
            <RuleRow label="2 件" value={rules.judicial["2_cases"]} onChange={(v) => setJudicial("2_cases", v)} />
            <RuleRow label="3 件" value={rules.judicial["3_cases"]} onChange={(v) => setJudicial("3_cases", v)} />
            <RuleRow label="4 件以上" value={rules.judicial["4plus_cases"]} onChange={(v) => setJudicial("4plus_cases", v)} />
          </SectionCard>

          {/* 維度四：稽查違規 */}
          <SectionCard title="稽查違規（滿分 20 分）" icon="🚨">
            <p style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>
              資料來源：Google News 聚合各縣市衛生局處分新聞 + Gemini AI 提取。每週日自動更新。
            </p>
            <RuleRow label="近 3 年無公開違規紀錄" value={20} onChange={() => {}} />
            <RuleRow label="輕微違規（廣告/標示）每筆扣分" value={-3} onChange={() => {}} />
            <RuleRow label="中度違規（罰 ≥ NT$10 萬）每筆扣分" value={-10} onChange={() => {}} />
            <RuleRow label="重大違規（停業/廢止/致死致傷）每筆扣分" value={-25} onChange={() => {}} />
            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 10, lineHeight: 1.6 }}>
              ※ 規則目前由後端 main.py 寫死，UI 編輯尚未串接。如需調整請改 backend/services/penalty_score.py。
            </p>
          </SectionCard>

          {/* 維度五：媒體口碑 */}
          <SectionCard title="媒體口碑（滿分 20 分・基準 12 分）" icon="📰">
            <p style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>
              資料來源：主流媒體報導（Google News）+ Gemini 情緒分析 + 業配辨識。每週日自動更新。
            </p>
            <RuleRow label="基準分（無顯著正/負面報導）" value={12} onChange={() => {}} />
            <RuleRow label="強正面（名醫專訪、得獎）每篇加分" value={5} onChange={() => {}} />
            <RuleRow label="正面（一般推薦報導）每篇加分" value={2.5} onChange={() => {}} />
            <RuleRow label="負面報導每篇扣分" value={-2.5} onChange={() => {}} />
            <RuleRow label="強負面（醫療事故、訴訟敗訴）每篇扣分" value={-5} onChange={() => {}} />
            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 10, lineHeight: 1.6 }}>
              ※ 業配內容自動降權 ×0.3。社群匿名討論不納入評分（防水軍/黑公關）。
            </p>
          </SectionCard>

          {/* 儲存區 */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "16px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 12, color: "#94A3B8" }}>
              {updatedAt ? `上次儲存：${updatedAt.replace("T", " ").slice(0, 16)}` : "尚未儲存過規則"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {savedMsg === "ok" && (
                <span style={{ fontSize: 13, color: "#16A34A", fontWeight: 600 }}>✅ 規則已儲存</span>
              )}
              {savedMsg === "err" && (
                <span style={{ fontSize: 13, color: "#DC2626", fontWeight: 600 }}>❌ 儲存失敗，請重試</span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "10px 28px", background: "#3B82F6", color: "#fff",
                  border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.65 : 1,
                }}
              >
                {saving ? "儲存中…" : "儲存規則"}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
