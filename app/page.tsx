import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import FeaturedNews from "@/components/FeaturedNews";

const LINE_CTA_URL = "https://lin.ee/6sTCRzm";

const STATS = [
  { value: "1,567家", label: "診所" },
  { value: "13,600+", label: "則評論" },
  { value: "5維度", label: "AI評鑑" },
  { value: "24,321筆", label: "健保署資料" },
];

const TRUST_ITEMS = [
  { dot: "#2B6CB0", text: "司法院裁判書即時查詢" },
  { dot: "#38A169", text: "衛福部健保署官方資料" },
  { dot: "#ED8936", text: "Google Maps 真實評論" },
  { dot: "#805AD5", text: "AI五維度自動評鑑" },
];

const TREATMENT_TILES = [
  { href: "/treatments?category=injection", label: "微整形注射", sub: "玻尿酸・肉毒・晶亮瓷", icon: "💉", bg: "#FFF5F5", iconBg: "#FED7D7" },
  { href: "/treatments?category=laser",     label: "雷射光療",   sub: "淡斑・縮毛孔・美白",   icon: "✨", bg: "#EBF8FF", iconBg: "#BEE3F8" },
  { href: "/treatments?category=surgery",   label: "外科手術",   sub: "雙眼皮・隆鼻・拉皮",   icon: "🔬", bg: "#FAF5FF", iconBg: "#E9D8FD" },
  { href: "/treatments?category=skin",      label: "皮膚管理",   sub: "保濕・痘疤・敏感修護", icon: "🌿", bg: "#F0FFF4", iconBg: "#9AE6B4" },
  { href: "/treatments?category=antiaging", label: "抗老緊緻",   sub: "電波・音波・拉提",     icon: "⚡", bg: "#FFFAF0", iconBg: "#FBD38D" },
  { href: "/treatments?category=hair",      label: "除毛療程",   sub: "全身・臉部・腋下",     icon: "🪒", bg: "#F0FFF4", iconBg: "#C6F6D5" },
  { href: "/treatments?category=scar",      label: "痘疤修復",   sub: "凹疤・色素・坑疤",     icon: "🌸", bg: "#FFF5F5", iconBg: "#FED7D7" },
  { href: "/treatments?category=body",      label: "體雕塑形",   sub: "冷凍・超音波・雕塑",   icon: "💪", bg: "#EBF8FF", iconBg: "#90CDF4" },
];

const SCORE_DIMS = [
  { label: "司法糾紛",  color: "#E53E3E" },
  { label: "Google評分", color: "#2B6CB0" },
  { label: "合法登記",  color: "#38A169" },
  { label: "稽查違規",  color: "#C53030" },
  { label: "媒體口碑",  color: "#ED8936" },
];

const FAQ_PILLS = [
  "玻尿酸費用多少？", "皮秒雷射安全嗎？", "如何挑選可信診所？", "醫美術前注意事項", "術後護理怎麼做？",
];

export default function Home() {
  return (
    <div style={{ background: "#FAFAF8", minHeight: "100vh" }}>

      {/* ── Hero ── */}
      <section style={{ background: "#fff", padding: "72px 24px 60px", textAlign: "center", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <p style={{ fontSize: 13, color: "#718096", lineHeight: 1.7, margin: "0 0 20px" }}>
            司法紀錄・合法登記・真實口碑<br />
            輸入診所名稱，立刻看到你不知道的事。
          </p>
          <h1 style={{ fontSize: 40, fontWeight: 700, color: "#1A202C", letterSpacing: "2px", lineHeight: 1.2, margin: "0 0 10px" }}>
            醫美 AI 大調查
          </h1>
          <p style={{ fontSize: 22, fontWeight: 500, color: "#2B6CB0", letterSpacing: "4px", margin: "0 0 32px" }}>
            美麗不踩雷
          </p>
          <div style={{ maxWidth: 540, margin: "0 auto 36px" }}>
            <SearchBox searchPath="/clinics" placeholder="輸入診所名稱（例：愛爾麗）、醫師、或療程…" />
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            {STATS.map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#2B6CB0" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Bar ── */}
      <section style={{ background: "#F7FAFC", borderBottom: "1px solid #E2E8F0", padding: "14px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
          {TRUST_ITEMS.map((t) => (
            <div key={t.text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.dot, display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#4A5568" }}>{t.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Treatment Tiles ── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1A202C", margin: 0 }}>依療程搜尋</h2>
          <Link href="/treatments" style={{ fontSize: 13, color: "#2B6CB0", textDecoration: "none", fontWeight: 500 }}>查詢更多 →</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {TREATMENT_TILES.map((t) => (
            <Link key={t.href} href={t.href} style={{ background: t.bg, borderRadius: 10, padding: "16px 14px", textDecoration: "none", display: "flex", alignItems: "center", gap: 12, border: "1px solid #E2E8F0" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: t.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                {t.icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1A202C" }}>{t.label}</div>
                <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>{t.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 精選快訊（八格卡片，4 欄，自動聚合） ── */}
      <FeaturedNews />

      {/* ── About + Score ── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A202C", marginBottom: 12 }}>關於我們</h2>
          <p style={{ fontSize: 14, color: "#4A5568", lineHeight: 1.8, marginBottom: 20 }}>
            360醫療AI大調查是台灣首個以 AI 五維度系統性評鑑醫美診所的平台。我們整合司法院裁判書、衛福部官方資料、Google Maps 評論、政府稽查違規公告與主流媒體口碑，為消費者提供客觀透明的參考依據。
          </p>
          <Link href="/about" style={{ fontSize: 13, color: "#2B6CB0", textDecoration: "none", fontWeight: 600 }}>了解更多 →</Link>
        </div>
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A202C", marginBottom: 16 }}>如何評鑑</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {SCORE_DIMS.map((d) => (
              <div key={d.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: "#4A5568" }}>{d.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: d.color }}>20分</span>
                </div>
                <div style={{ height: 6, background: "#E2E8F0", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: "100%", height: "100%", background: d.color, borderRadius: 99, opacity: 0.75 }} />
                </div>
              </div>
            ))}
          </div>
          <Link href="/scoring" style={{ display: "inline-block", marginTop: 16, fontSize: 13, color: "#2B6CB0", textDecoration: "none", fontWeight: 600 }}>查看評分標準 →</Link>
        </div>
      </section>

      {/* ── FAQ Strip ── */}
      <section style={{ background: "#fff", borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0", padding: "20px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", flexShrink: 0 }}>熱門問題</div>
          <div style={{ display: "flex", gap: 8, flex: 1, flexWrap: "wrap" }}>
            {FAQ_PILLS.map((q) => (
              <Link key={q} href={`/faq?q=${encodeURIComponent(q)}`} style={{ padding: "6px 14px", background: "#F7FAFC", border: "1px solid #E2E8F0", borderRadius: 999, fontSize: 12, color: "#4A5568", textDecoration: "none" }}>
                {q}
              </Link>
            ))}
          </div>
          <Link href="/faq" style={{ fontSize: 13, color: "#2B6CB0", textDecoration: "none", fontWeight: 500, whiteSpace: "nowrap" }}>查看所有問題 →</Link>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section style={{ background: "#2B6CB0", padding: "56px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", margin: "0 0 10px" }}>找到您信任的醫美診所</h2>
        <p style={{ fontSize: 14, color: "#BEE3F8", margin: "0 0 28px" }}>904家診所完整評鑑報告，讓您做出最安心的選擇</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Link href="/clinics" style={{ padding: "12px 32px", background: "#fff", color: "#2B6CB0", borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
            開始查詢
          </Link>
          <a href={LINE_CTA_URL} target="_blank" rel="noopener noreferrer" style={{ padding: "12px 32px", background: "transparent", color: "#fff", borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: "none", border: "2px solid rgba(255,255,255,.5)" }}>
            LINE 免費諮詢
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#F7FAFC", borderTop: "1px solid #E2E8F0", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <p style={{ fontSize: 11, color: "#A0AEC0", margin: 0 }}>© 360醫療AI大調查 · 評鑑分數由系統自動計算，不接受購買或修改</p>
        <span style={{ background: "#F0FFF4", border: "1px solid #9AE6B4", borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "#38A169" }}>✅ 系統運作中</span>
      </footer>
    </div>
  );
}
