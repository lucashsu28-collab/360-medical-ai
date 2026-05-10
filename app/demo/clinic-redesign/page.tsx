"use client";
import { useState } from "react";
import Link from "next/link";

/**
 * 設計預覽頁 v2：
 * - 合作版改為「診所小網站首頁」感：Hero 主視覺 + 多廣告版面 + Tab 在下
 * - 非合作版維持簡潔第三方評鑑報告
 */

const MOCK = {
  name: "晶緻醫美診所",
  slogan: "在這裡，遇見更自信的自己",
  subtitle: "信義區 14 年信賴 · 360 AI 認證合作診所",
  address: "台北市信義區忠孝東路五段 123 號",
  phone: "(02) 1234-5678",
  google_rating: 4.8,
  review_count: 1247,
  total_score: 94,
  scores: { judicial: 19, google: 18, legal: 20, penalty: 19, media: 18 },
  director: {
    name: "吳欣儀 醫師",
    title: "院長｜醫學美容專科",
    years: 14,
    desc: "畢業於國防醫學院，前長庚醫院醫師。專注於微整與抗老化領域 14 年，主治玻尿酸、童顏針、肉毒桿菌等微整療程，累計治療超過 12,000 位顧客。",
  },
  // 5 個亮點小卡（標題 / 內容由後台輸入，icon 統一星星 ✨）
  features: [
    { title: "360 AI 認證", desc: "五維度評鑑 9 分以上" },
    { title: "14 年信賴", desc: "信義區深耕 14 年" },
    { title: "專業團隊", desc: "5 位主治醫師駐診" },
    { title: "LINE 24h 客服", desc: "營業外時段真人回覆" },
    { title: "自有療程", desc: "客製化專屬療程方案" },
  ],
  signatureTreatments: [
    {
      title: "皮秒雷射",
      tagline: "一次淨膚到底",
      desc: "適合斑點、痘疤、毛孔粗大、暗沉膚質，無修復期、效果立現",
      price: "原價 $12,000 · 限時 $8,800",
      badge: "🔥 招牌",
    },
    {
      title: "玻尿酸塑形",
      tagline: "自然立體輪廓",
      desc: "蘋果肌、淚溝、法令紋、唇形、鼻樑，恢復飽滿年輕的自己",
      price: "$8,000 / cc 起",
      badge: "✨ 熱門",
    },
  ],
  testimonials: [
    { name: "Lily", initial: "L", text: "醫師很細心會聽你的需求，做完皮秒整個人發光！", rating: 5 },
    { name: "Anna", initial: "A", text: "第一次打玻尿酸很緊張，吳醫師講解很清楚，效果超自然。", rating: 5 },
    { name: "Chris", initial: "C", text: "服務環境都很棒，已經介紹給好幾個朋友來。", rating: 5 },
  ],
  treatments: [
    { name: "皮秒雷射", price: "$8,800–$12,000", desc: "深層淨膚、淡斑除痘" },
    { name: "玻尿酸", price: "$8,000/cc", desc: "微整形/法令紋/蘋果肌" },
    { name: "肉毒桿菌", price: "$6,000/部位", desc: "除皺、瘦小臉" },
    { name: "童顏針", price: "$25,000/瓶", desc: "膠原增生、抗老" },
    { name: "電波拉皮", price: "$45,000/次", desc: "緊緻、輪廓提升" },
    { name: "音波拉提", price: "$38,000/次", desc: "下顎線、雙下巴改善" },
  ],
  promotions: [
    { title: "週年慶限定組合", price: "$18,800（原價 $25,000）", expires: "2026-06-30" },
    { title: "新客體驗", price: "$2,800（皮秒+保養）", expires: "2026-12-31" },
  ],
  doctors: [
    { name: "吳欣儀 醫師", title: "院長｜醫學美容醫師", spec: "微整形、抗老" },
    { name: "陳志遠 醫師", title: "皮膚科專科", spec: "雷射、皮膚管理" },
    { name: "李雅婷 醫師", title: "整形外科專科", spec: "雙眼皮、隆鼻" },
  ],
};

export default function DesignPreviewPage() {
  const [view, setView] = useState<"partner" | "free">("partner");

  return (
    <div style={{ background: "#F1F5F9", minHeight: "100vh" }}>
      <div style={{ background: "#0F172A", color: "#fff", padding: "12px 20px", position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>📐 診所頁視覺方案 A v2 — 合作版改為小網站首頁</div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
            合作 = 診所自有品牌主頁（Hero + 廣告版面 + Tab）/ 非合作 = 嚴肅第三方評鑑
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, background: "#1E293B", padding: 4, borderRadius: 8 }}>
          <button onClick={() => setView("partner")}
            style={{ padding: "6px 16px", border: 0, borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600, background: view === "partner" ? "#F59E0B" : "transparent", color: view === "partner" ? "#0F172A" : "#94A3B8" }}>
            ✦ 合作診所版
          </button>
          <button onClick={() => setView("free")}
            style={{ padding: "6px 16px", border: 0, borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600, background: view === "free" ? "#fff" : "transparent", color: view === "free" ? "#0F172A" : "#94A3B8" }}>
            📋 非合作診所版
          </button>
        </div>
      </div>

      {view === "partner" ? <PartnerView /> : <FreeView />}

      <div style={{ padding: "40px 20px", textAlign: "center", background: "#fff", borderTop: "1px solid #E2E8F0" }}>
        <Link href="/admin" style={{ fontSize: 12, color: "#64748B", textDecoration: "none" }}>← 返回後台</Link>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// 合作診所版：診所小網站首頁
// ════════════════════════════════════════
function PartnerView() {
  const [tab, setTab] = useState<"treatment" | "promo" | "doctor" | "gallery">("treatment");

  return (
    <div style={{ background: "#fff" }}>
      {/* ════════ 1. Hero 大圖區（500px，主視覺） ════════ */}
      <div style={{ position: "relative", height: 520, overflow: "hidden" }}>
        {/* 主視覺照片佔位（後台讓診所上傳） */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 35%, #D97706 65%, #B45309 100%)",
        }}>
          <div style={{ position: "absolute", top: -200, right: -150, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.3) 0%, transparent 65%)" }} />
          <div style={{ position: "absolute", bottom: -100, left: -50, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.18) 0%, transparent 65%)" }} />
          <div style={{ position: "absolute", top: "20%", left: "55%", fontSize: 96, opacity: 0.12 }}>✨</div>
        </div>

        {/* 遮罩 */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,.35) 100%)" }} />

        {/* 上方診所名 + 認證 */}
        <div style={{ position: "absolute", top: 32, left: 0, right: 0, padding: "0 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(255,255,255,.95)", color: "#B45309", borderRadius: 99, fontSize: 12, fontWeight: 700, marginBottom: 16, boxShadow: "0 4px 14px rgba(0,0,0,.1)" }}>
              ✦ 360 AI 認證合作診所
            </div>
          </div>
        </div>

        {/* 下方主視覺文案 */}
        <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, padding: "0 24px", color: "#fff" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ fontSize: 14, marginBottom: 8, opacity: 0.92, letterSpacing: "0.05em" }}>{MOCK.subtitle}</div>
            <h1 style={{ fontSize: 56, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em", textShadow: "0 4px 20px rgba(0,0,0,.25)", lineHeight: 1.1 }}>
              {MOCK.name}
            </h1>
            <div style={{ fontSize: 22, fontWeight: 400, marginBottom: 28, opacity: 0.95, textShadow: "0 2px 8px rgba(0,0,0,.2)" }}>
              {MOCK.slogan}
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button style={{ padding: "14px 32px", background: "#06C755", color: "#fff", border: 0, borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 20px rgba(6,199,85,.5)", display: "flex", alignItems: "center", gap: 10 }}>
                💬 立即預約諮詢
              </button>
              <button style={{ padding: "14px 26px", background: "rgba(255,255,255,.18)", color: "#fff", border: "1.5px solid rgba(255,255,255,.4)", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(10px)" }}>
                📞 撥打電話
              </button>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, padding: "10px 18px", background: "rgba(255,255,255,.95)", borderRadius: 12, color: "#1A202C", boxShadow: "0 4px 14px rgba(0,0,0,.1)" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#B45309", lineHeight: 1 }}>{MOCK.total_score}</div>
                  <div style={{ fontSize: 9, color: "#64748B" }}>360 評分</div>
                </div>
                <div style={{ width: 1, height: 30, background: "#E2E8F0" }} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#F59E0B", lineHeight: 1 }}>★ {MOCK.google_rating}</div>
                  <div style={{ fontSize: 9, color: "#64748B" }}>{MOCK.review_count} 評論</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* mockup 提示 */}
        <div style={{ position: "absolute", top: 20, right: 20, padding: "4px 10px", background: "rgba(0,0,0,.4)", color: "#fff", borderRadius: 4, fontSize: 10, backdropFilter: "blur(8px)" }}>
          ↑ 此處放診所主視覺照片（後台 hero_image 欄位）
        </div>
      </div>

      {/* ════════ 2. 360 評鑑（黑底，緊接 Hero） ════════ */}
      <div style={{ padding: "40px 24px", background: "#0F172A", color: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4, letterSpacing: "0.15em" }}>VERIFIED BY 360 AI</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>360 醫美 AI 第三方評鑑</h3>
            </div>
            <Link href="/rules/reputation" style={{ fontSize: 12, color: "#FBBF24", textDecoration: "none" }}>查看評分規則 →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {[
              { k: "judicial", label: "司法糾紛", v: MOCK.scores.judicial, icon: "⚖️" },
              { k: "google", label: "Google 評分", v: MOCK.scores.google, icon: "📍" },
              { k: "legal", label: "合法登記", v: MOCK.scores.legal, icon: "🏛️" },
              { k: "penalty", label: "稽查違規", v: MOCK.scores.penalty, icon: "⚠️" },
              { k: "media", label: "媒體口碑", v: MOCK.scores.media, icon: "📰" },
            ].map((d) => (
              <div key={d.k} style={{ textAlign: "center", padding: 16, background: "#1E293B", borderRadius: 10, border: "1px solid #334155" }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{d.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#FBBF24", lineHeight: 1 }}>{d.v}</div>
                <div style={{ fontSize: 9, color: "#64748B", marginTop: 4 }}>/ 20 分</div>
                <div style={{ fontSize: 11, color: "#CBD5E1", marginTop: 8, fontWeight: 600 }}>{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════ 3. 五大亮點小卡（icon 統一星星 ✨） ════════ */}
      <div style={{ background: "linear-gradient(180deg, #FFFBEB 0%, #FEF3C7 100%)", padding: "44px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: "#D97706", letterSpacing: "0.2em", marginBottom: 6, fontWeight: 600 }}>WHY US</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1A202C", margin: 0 }}>本院特色</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
            {MOCK.features.map((f, i) => (
              <div key={i} style={{ background: "#fff", padding: "22px 16px", borderRadius: 12, border: "1px solid #FED7AA", boxShadow: "0 2px 8px rgba(245,158,11,.06)", textAlign: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, margin: "0 auto 12px", background: "linear-gradient(135deg, #FBBF24, #D97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#fff" }}>
                  ✨
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════ 3. 招牌療程廣告 Banner ════════ */}
      <div style={{ padding: "60px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 12, color: "#D97706", letterSpacing: "0.2em", marginBottom: 8, fontWeight: 600 }}>SIGNATURE TREATMENTS</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "#1A202C", margin: 0, letterSpacing: "-0.01em" }}>本院招牌療程</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {MOCK.signatureTreatments.map((t, i) => (
              <div key={i} style={{ position: "relative", borderRadius: 18, overflow: "hidden", aspectRatio: "16/10", background: i === 0
                ? "linear-gradient(135deg, #FED7AA 0%, #FBBF24 50%, #D97706 100%)"
                : "linear-gradient(135deg, #FECACA 0%, #F87171 50%, #DC2626 100%)" }}>
                <div style={{ position: "absolute", top: 16, right: 16, padding: "5px 14px", background: "rgba(255,255,255,.95)", color: i === 0 ? "#B45309" : "#991B1B", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                  {t.badge}
                </div>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,.55) 100%)" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 28, color: "#fff" }}>
                  <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 6, letterSpacing: "0.1em" }}>{t.tagline}</div>
                  <h3 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 10px", textShadow: "0 2px 8px rgba(0,0,0,.3)" }}>{t.title}</h3>
                  <div style={{ fontSize: 13, opacity: 0.92, marginBottom: 14, lineHeight: 1.6 }}>{t.desc}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{t.price}</div>
                    <button style={{ padding: "8px 18px", background: "#fff", color: "#1A202C", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      了解更多 →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════ 4. 院長形象橫幅 ════════ */}
      <div style={{ padding: "60px 24px", background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "320px 1fr", gap: 48, alignItems: "center" }}>
          {/* 院長照片 */}
          <div style={{ aspectRatio: "1", borderRadius: 20, background: "linear-gradient(135deg, #FBBF24, #D97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 100, color: "#fff", boxShadow: "0 12px 40px rgba(245,158,11,.3)", position: "relative" }}>
            👨‍⚕️
            <div style={{ position: "absolute", bottom: -12, left: "50%", transform: "translateX(-50%)", padding: "6px 16px", background: "#1A202C", color: "#FBBF24", borderRadius: 99, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
              {MOCK.director.years} 年資歷
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#D97706", letterSpacing: "0.2em", marginBottom: 8, fontWeight: 600 }}>OUR DIRECTOR</div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#1A202C", margin: "0 0 6px", letterSpacing: "-0.01em" }}>{MOCK.director.name}</h2>
            <div style={{ fontSize: 15, color: "#92400E", marginBottom: 18, fontWeight: 600 }}>{MOCK.director.title}</div>
            <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.85, margin: "0 0 24px" }}>{MOCK.director.desc}</p>
            <button style={{ padding: "10px 24px", background: "#1A202C", color: "#FBBF24", border: 0, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              查看醫師團隊 →
            </button>
          </div>
        </div>
      </div>

      {/* ════════ 5. 客戶見證 ════════ */}
      <div style={{ padding: "60px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 12, color: "#D97706", letterSpacing: "0.2em", marginBottom: 8, fontWeight: 600 }}>TESTIMONIALS</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "#1A202C", margin: 0, letterSpacing: "-0.01em" }}>顧客真實見證</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {MOCK.testimonials.map((t, i) => (
              <div key={i} style={{ padding: 26, background: "#FFFBEB", borderRadius: 14, border: "1px solid #FED7AA" }}>
                <div style={{ fontSize: 24, marginBottom: 12, color: "#F59E0B" }}>{"★".repeat(t.rating)}</div>
                <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.8, marginBottom: 16, minHeight: 60 }}>
                  &ldquo;{t.text}&rdquo;
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#FBBF24", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{t.initial}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A202C" }}>{t.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════ 6. Tab 詳細資料區 ════════ */}
      <div style={{ background: "#F8FAFC", borderTop: "1px solid #E2E8F0" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", position: "sticky", top: 60, zIndex: 50 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", gap: 0 }}>
            {[
              { k: "treatment", label: "💉 完整療程列表" },
              { k: "promo", label: "🎁 限時優惠" },
              { k: "doctor", label: "👨‍⚕️ 醫師團隊" },
              { k: "gallery", label: "📸 環境相片" },
            ].map((t) => (
              <button key={t.k} onClick={() => setTab(t.k as any)}
                style={{ padding: "16px 22px", border: 0, background: "transparent", fontSize: 14, fontWeight: 600, cursor: "pointer", color: tab === t.k ? "#B45309" : "#64748B", borderBottom: tab === t.k ? "3px solid #F59E0B" : "3px solid transparent", marginBottom: -1 }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 48px" }}>
          {tab === "treatment" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {MOCK.treatments.map((t, i) => (
                <div key={i} style={{ padding: 20, background: "#fff", border: "1px solid #FED7AA", borderRadius: 12, boxShadow: "0 2px 6px rgba(245,158,11,.06)" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1A202C", marginBottom: 6 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginBottom: 10, lineHeight: 1.6, minHeight: 32 }}>{t.desc}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#B45309" }}>{t.price}</div>
                </div>
              ))}
            </div>
          )}
          {tab === "promo" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {MOCK.promotions.map((p, i) => (
                <div key={i} style={{ padding: 20, background: "linear-gradient(135deg, #FFFBEB 0%, #FFEDD5 100%)", border: "2px solid #F59E0B", borderRadius: 12 }}>
                  <div style={{ display: "inline-block", padding: "3px 10px", background: "#B45309", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 4, marginBottom: 10 }}>限時</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1A202C", marginBottom: 8 }}>{p.title}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#B45309", marginBottom: 12 }}>{p.price}</div>
                  <div style={{ fontSize: 12, color: "#92400E" }}>有效期至 {p.expires}</div>
                </div>
              ))}
            </div>
          )}
          {tab === "doctor" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {MOCK.doctors.map((d, i) => (
                <div key={i} style={{ padding: 20, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#FED7AA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>👨‍⚕️</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1A202C" }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{d.title}</div>
                    <div style={{ fontSize: 11, color: "#B45309", marginTop: 4 }}>{d.spec}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "gallery" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[1,2,3,4,5,6,7,8].map((i) => (
                <div key={i} style={{ aspectRatio: "1", background: `linear-gradient(135deg, hsl(${30+i*15},80%,75%), hsl(${20+i*15},80%,55%))`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 28 }}>
                  📸
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 底部 sticky CTA */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,.98)", backdropFilter: "blur(10px)", borderTop: "1px solid #F59E0B", padding: "12px 24px", boxShadow: "0 -4px 16px rgba(0,0,0,.1)", zIndex: 99 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A202C" }}>{MOCK.name}</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>透過 LINE OA 預約諮詢，享 360 認證保障</div>
          </div>
          <button style={{ padding: "12px 32px", background: "#06C755", color: "#fff", border: 0, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(6,199,85,.4)" }}>
            💬 立即預約諮詢
          </button>
        </div>
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}

// ════════════════════════════════════════
// 非合作診所版：嚴肅第三方評鑑報告
// ════════════════════════════════════════
function FreeView() {
  return (
    <div style={{ background: "#F8FAFC" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px 24px 28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "#F1F5F9", color: "#64748B", borderRadius: 4, fontSize: 11, fontWeight: 600, marginBottom: 12 }}>
            ⓘ 此診所未加入 360 合作計畫
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>{MOCK.name}</h1>
          <div style={{ display: "flex", gap: 18, fontSize: 12, color: "#475569" }}>
            <span>📍 {MOCK.address}</span>
            <span>📞 {MOCK.phone}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "28px 24px 40px" }}>
        <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 28, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, paddingBottom: 20, borderBottom: "2px solid #1E293B" }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 6, letterSpacing: "0.1em" }}>360 醫美 AI 第三方評鑑</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>五維度評鑑報告</h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: "#0F172A", lineHeight: 1, fontFamily: "var(--font-dm-mono, monospace)" }}>{MOCK.total_score}</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>/ 100 分</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {[
              { k: "judicial", label: "司法糾紛", v: MOCK.scores.judicial, icon: "⚖️" },
              { k: "google", label: "Google 評分", v: MOCK.scores.google, icon: "📍" },
              { k: "legal", label: "合法登記", v: MOCK.scores.legal, icon: "🏛️" },
              { k: "penalty", label: "稽查違規", v: MOCK.scores.penalty, icon: "⚠️" },
              { k: "media", label: "媒體口碑", v: MOCK.scores.media, icon: "📰" },
            ].map((d) => (
              <div key={d.k} style={{ textAlign: "center", padding: "18px 8px", border: "1px solid #E2E8F0", borderRadius: 8 }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{d.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", lineHeight: 1, fontFamily: "var(--font-dm-mono, monospace)" }}>{d.v}</div>
                <div style={{ fontSize: 10, color: "#64748B", marginTop: 4 }}>/ 20 分</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 8, fontWeight: 600 }}>{d.label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, padding: 12, background: "#F8FAFC", borderRadius: 6, fontSize: 11, color: "#64748B", lineHeight: 1.7 }}>
            ⓘ 本評鑑由 360 醫美 AI 平台獨立計算，資料來源：司法院裁判書、Google Places、衛福部、政府公開處分資料、主流媒體報導。
          </div>
        </section>

        <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24, marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: "0 0 12px" }}>⚠️ 稽查違規紀錄</h3>
          <div style={{ padding: 20, background: "#F0FDF4", borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>✓</div>
            <div style={{ fontSize: 13, color: "#166534" }}>目前無公開違規紀錄</div>
          </div>
        </section>

        <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24, marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: "0 0 12px" }}>📰 媒體口碑</h3>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "center" }}>
            <div style={{ textAlign: "center", paddingRight: 16, borderRight: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#3182CE" }}>92</div>
              <div style={{ fontSize: 10, color: "#64748B" }}>分</div>
            </div>
            <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.7 }}>
              近 12 個月共 8 則主流媒體提及，正面 5 則 / 中性 3 則，無負面報導
            </div>
          </div>
        </section>

        <section style={{ background: "#fff", border: "1px dashed #CBD5E0", borderRadius: 12, padding: 24, marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: "0 0 8px" }}>📋 完整評鑑報告</h3>
          <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 12px", lineHeight: 1.7 }}>
            含判決書案號、申訴案進度、媒體報導全文、口碑分析，加 LINE 解鎖後可下載 PDF
          </p>
          <button style={{ padding: "10px 20px", background: "#0F172A", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            🔓 加 LINE 解鎖完整報告
          </button>
        </section>

        <div style={{ marginTop: 32, padding: 18, background: "#F8FAFC", borderLeft: "3px solid #CBD5E0", borderRadius: 6 }}>
          <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
            <strong style={{ color: "#0F172A" }}>是這家診所的負責人嗎？</strong>
            加入 360 合作計畫，可在頁面展示療程介紹、優惠方案、醫師團隊與診所環境照片。
            {" "}
            <Link href="/partnership" style={{ color: "#1D4ED8", textDecoration: "underline", fontWeight: 600 }}>了解合作方案 →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
