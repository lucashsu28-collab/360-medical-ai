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
      image: "https://images.unsplash.com/photo-1772831902679-3f41c106d7a2?w=1200&q=80",
    },
    {
      title: "玻尿酸塑形",
      tagline: "自然立體輪廓",
      desc: "蘋果肌、淚溝、法令紋、唇形、鼻樑，恢復飽滿年輕的自己",
      price: "$8,000 / cc 起",
      badge: "✨ 熱門",
      image: "https://images.unsplash.com/photo-1552693673-1bf958298935?w=1200&q=80",
    },
  ],
  // 主頁顧客前後對照（4 卡，示意圖；正式版改為診所後台上傳）
  beforeAfter: [
    {
      treatment: "皮秒雷射淨膚",
      duration: "療程後 4 週",
      note: "斑點淡化、膚色提亮",
      before: "https://images.unsplash.com/photo-1606815013283-f5dcea587c38?w=600&q=80",
      after: "https://images.unsplash.com/photo-1669040620696-9c9fbc9a3ba5?w=600&q=80",
    },
    {
      treatment: "玻尿酸塑形",
      duration: "療程後立即",
      note: "蘋果肌飽滿、法令紋撫平",
      before: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80",
      after: "https://images.unsplash.com/photo-1707544738456-a5f930510139?w=600&q=80",
    },
    {
      treatment: "童顏針抗老",
      duration: "療程後 8 週",
      note: "膠原增生、輪廓緊緻",
      before: "https://images.unsplash.com/photo-1544717304-a2db4a7b16ee?w=600&q=80",
      after: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&q=80",
    },
    {
      treatment: "音波拉提",
      duration: "療程後 12 週",
      note: "下顎線清晰、雙下巴改善",
      before: "https://images.unsplash.com/photo-1713085085470-fba013d67e65?w=600&q=80",
      after: "https://images.unsplash.com/photo-1772831902679-3f41c106d7a2?w=600&q=80",
    },
  ],
  // Tab 客戶好評（更豐富的文字評價）
  testimonials: [
    { name: "Lily", initial: "L", text: "醫師很細心會聽你的需求，做完皮秒整個人發光！", rating: 5, treatment: "皮秒雷射" },
    { name: "Anna", initial: "A", text: "第一次打玻尿酸很緊張，吳醫師講解很清楚，效果超自然。", rating: 5, treatment: "玻尿酸塑形" },
    { name: "Chris", initial: "C", text: "服務環境都很棒，已經介紹給好幾個朋友來。", rating: 5, treatment: "肉毒桿菌" },
    { name: "May", initial: "M", text: "童顏針的效果出乎意料！朋友都問我是不是回春了。", rating: 5, treatment: "童顏針" },
    { name: "Doris", initial: "D", text: "從諮詢到術後追蹤都很到位，是我看過最專業的醫美診所。", rating: 5, treatment: "電波拉皮" },
    { name: "Eric", initial: "E", text: "男生來打皮秒去痘疤，醫師完全沒有差別待遇，很尊重。", rating: 5, treatment: "皮秒雷射" },
  ],
  // Tab 媒體報導
  mediaReports: [
    { outlet: "ETtoday", title: "信義區醫美推薦：晶緻醫美吳欣儀醫師專訪", date: "2026-03-15", tier: "B" },
    { outlet: "TVBS 健康 2.0", title: "醫美風潮回歸自然，名醫談微整新趨勢", date: "2026-02-08", tier: "A" },
    { outlet: "自由時報", title: "醫美評比：360 AI 認證 9 分以上診所名單", date: "2026-01-22", tier: "A" },
    { outlet: "美人圈", title: "皮秒雷射深度解析，醫師告訴你怎麼選", date: "2025-12-10", tier: "C" },
    { outlet: "Yahoo 新聞", title: "醫美廣告新規上路，業者該如何應對", date: "2025-11-05", tier: "B" },
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
  const [tab, setTab] = useState<"treatment" | "promo" | "doctor" | "gallery" | "media" | "reviews">("treatment");

  return (
    <div style={{ background: "#fff" }}>
      {/* ════════ 1. Hero 大圖區（500px，主視覺） ════════ */}
      <div style={{ position: "relative", height: 520, overflow: "hidden" }}>
        {/* 真實主視覺照片 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1772831902679-3f41c106d7a2?w=1800&q=80"
          alt="診所主視覺"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />

        {/* 暖色調遮罩，配品牌色 */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(180,83,9,.55) 0%, rgba(217,119,6,.4) 50%, rgba(0,0,0,.55) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,.5) 100%)" }} />

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

      </div>

      {/* ════════ 2. 360 評鑑（白底，緊接 Hero） ════════ */}
      <div style={{ padding: "44px 24px", background: "#fff", borderBottom: "1px solid #F1F5F9" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "#D97706", marginBottom: 4, letterSpacing: "0.15em", fontWeight: 600 }}>VERIFIED BY 360 AI</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#1A202C" }}>360 醫美 AI 第三方評鑑</h3>
            </div>
            <Link href="/rules/reputation" style={{ fontSize: 12, color: "#B45309", textDecoration: "none", fontWeight: 600 }}>查看評分規則 →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {[
              { k: "judicial", label: "司法糾紛", v: MOCK.scores.judicial, icon: "⚖️" },
              { k: "google", label: "Google 評分", v: MOCK.scores.google, icon: "📍" },
              { k: "legal", label: "合法登記", v: MOCK.scores.legal, icon: "🏛️" },
              { k: "penalty", label: "稽查違規", v: MOCK.scores.penalty, icon: "⚠️" },
              { k: "media", label: "媒體口碑", v: MOCK.scores.media, icon: "📰" },
            ].map((d) => (
              <div key={d.k} style={{ textAlign: "center", padding: 16, background: "#FFFBEB", borderRadius: 10, border: "1px solid #FED7AA" }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{d.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#B45309", lineHeight: 1 }}>{d.v}</div>
                <div style={{ fontSize: 9, color: "#A0AEC0", marginTop: 4 }}>/ 20 分</div>
                <div style={{ fontSize: 11, color: "#1A202C", marginTop: 8, fontWeight: 600 }}>{d.label}</div>
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
              <div key={i} style={{ position: "relative", borderRadius: 18, overflow: "hidden", aspectRatio: "16/10", background: "#1A202C" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.image} alt={t.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", top: 16, right: 16, padding: "5px 14px", background: "rgba(255,255,255,.95)", color: i === 0 ? "#B45309" : "#991B1B", borderRadius: 99, fontSize: 11, fontWeight: 700, zIndex: 2 }}>
                  {t.badge}
                </div>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 20%, rgba(0,0,0,.7) 100%)" }} />
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
          <div style={{ aspectRatio: "1", borderRadius: 20, overflow: "hidden", boxShadow: "0 12px 40px rgba(245,158,11,.3)", position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80"
              alt={MOCK.director.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div style={{ position: "absolute", bottom: -12, left: "50%", transform: "translateX(-50%)", padding: "6px 16px", background: "#1A202C", color: "#FBBF24", borderRadius: 99, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(0,0,0,.2)" }}>
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

      {/* ════════ 5. 顧客前後對照（Before/After 4 卡） ════════ */}
      <div style={{ padding: "60px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 12, color: "#D97706", letterSpacing: "0.2em", marginBottom: 8, fontWeight: 600 }}>BEFORE / AFTER</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "#1A202C", margin: 0, letterSpacing: "-0.01em" }}>顧客前後對照</h2>
            <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 10 }}>＊ 案例經顧客同意公開，個人差異效果不同</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {MOCK.beforeAfter.map((b, i) => (
              <div key={i} style={{ background: "#FFFBEB", borderRadius: 12, overflow: "hidden", border: "1px solid #FED7AA", boxShadow: "0 2px 8px rgba(245,158,11,.08)" }}>
                {/* Before/After 並排 */}
                <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#FED7AA" }}>
                  <div style={{ position: "relative", aspectRatio: "1", overflow: "hidden" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.before} alt="Before" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "saturate(.85)" }} />
                    <div style={{ position: "absolute", top: 8, left: 8, padding: "3px 9px", background: "rgba(15,23,42,.78)", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 4, letterSpacing: "0.05em" }}>
                      BEFORE
                    </div>
                  </div>
                  <div style={{ position: "relative", aspectRatio: "1", overflow: "hidden" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.after} alt="After" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <div style={{ position: "absolute", top: 8, left: 8, padding: "3px 9px", background: "#D97706", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 4, letterSpacing: "0.05em" }}>
                      AFTER
                    </div>
                  </div>
                </div>
                {/* 文字資訊 */}
                <div style={{ padding: "14px 14px 16px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", marginBottom: 4 }}>{b.treatment}</div>
                  <div style={{ fontSize: 11, color: "#92400E", marginBottom: 8, fontWeight: 600 }}>{b.duration}</div>
                  <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>{b.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════ 6. Tab 詳細資料區 ════════ */}
      <div style={{ background: "#F8FAFC", borderTop: "1px solid #E2E8F0" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", position: "sticky", top: 60, zIndex: 50 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", gap: 0, overflowX: "auto" }}>
            {[
              { k: "treatment", label: "💉 完整療程列表" },
              { k: "promo", label: "🎁 限時優惠" },
              { k: "doctor", label: "👨‍⚕️ 醫師團隊" },
              { k: "gallery", label: "📸 環境相片" },
              { k: "media", label: "📰 媒體報導" },
              { k: "reviews", label: "💬 客戶好評" },
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
              {[
                "photo-1772831902679-3f41c106d7a2",  // 雷射治療室
                "photo-1778004930342-91a0353fc283",  // cosmetologist
                "photo-1648775507324-b48dd3791fa5",  // 極簡室內
                "photo-1606811971618-4486d14f3f99",  // 診所空間
                "photo-1552693673-1bf958298935",     // 面部療程
                "photo-1713085085470-fba013d67e65",  // facial peel
                "photo-1512290923902-8a9f81dc236c",  // 美容治療
                "photo-1544717304-a2db4a7b16ee",     // spa
              ].map((id, i) => (
                <div key={i} style={{ aspectRatio: "1", borderRadius: 10, overflow: "hidden", background: "#FED7AA" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://images.unsplash.com/${id}?w=600&q=80`}
                    alt={`診所環境 ${i + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
              ))}
            </div>
          )}
          {tab === "media" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {MOCK.mediaReports.map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: "#fff", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                  <div style={{ flexShrink: 0, width: 60, padding: "6px 0", textAlign: "center", background: m.tier === "A" ? "#FEF3C7" : m.tier === "B" ? "#DBEAFE" : "#F3E8FF", color: m.tier === "A" ? "#92400E" : m.tier === "B" ? "#1E40AF" : "#6B21A8", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                    {m.tier} 級
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", marginBottom: 3 }}>{m.title}</div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>
                      <span style={{ color: "#B45309", fontWeight: 600 }}>{m.outlet}</span>
                      <span style={{ margin: "0 8px", color: "#CBD5E0" }}>·</span>
                      {m.date}
                    </div>
                  </div>
                  <button style={{ flexShrink: 0, padding: "6px 14px", background: "#F1F5F9", color: "#475569", border: 0, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    閱讀全文 →
                  </button>
                </div>
              ))}
              <div style={{ marginTop: 8, padding: 12, background: "#FFFBEB", borderRadius: 6, fontSize: 11, color: "#92400E", lineHeight: 1.6 }}>
                ⓘ 媒體權威分級依 360 AI 評分規則：A 級主流（蘋果、聯合、TVBS 等）/ B 級網路（ETtoday、Yahoo 等）/ C 級醫美專業
              </div>
            </div>
          )}
          {tab === "reviews" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {MOCK.testimonials.map((t, i) => (
                <div key={i} style={{ padding: 22, background: "#FFFBEB", borderRadius: 12, border: "1px solid #FED7AA" }}>
                  <div style={{ fontSize: 18, color: "#F59E0B", marginBottom: 10 }}>{"★".repeat(t.rating)}</div>
                  <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.8, marginBottom: 14, minHeight: 56 }}>
                    &ldquo;{t.text}&rdquo;
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px dashed #FED7AA" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FBBF24", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{t.initial}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1A202C" }}>{t.name}</div>
                    </div>
                    <div style={{ fontSize: 10, color: "#92400E", padding: "3px 8px", background: "#FEF3C7", borderRadius: 4, fontWeight: 600 }}>
                      {t.treatment}
                    </div>
                  </div>
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
