"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface NewsItem {
  id: number;
  source_url: string;
  source_name: string | null;
  category: string;
  title: string;
  summary: string | null;
  cover_image: string | null;
  published_at: string | null;
  ai_keywords: string[];
}

const API = process.env.NEXT_PUBLIC_API_URL || "";

const CATEGORIES = [
  { k: "", label: "全部", icon: "📰", color: "#2B6CB0" },
  { k: "domestic", label: "國內醫美", icon: "🇹🇼", color: "#C53030" },
  { k: "korea", label: "韓國醫美", icon: "🇰🇷", color: "#7C3AED" },
  { k: "international", label: "國際新知", icon: "🌐", color: "#0E7490" },
  { k: "tech", label: "新技術", icon: "🔬", color: "#D97706" },
];

const CATEGORY_LABEL: Record<string, { label: string; color: string; bg: string; emoji: string; gradient: string }> = {
  domestic:      { label: "國內醫美", color: "#C53030", bg: "#FFF5F5", emoji: "🏥", gradient: "linear-gradient(135deg, #FCA5A5 0%, #F87171 50%, #DC2626 100%)" },
  korea:         { label: "韓國醫美", color: "#7C3AED", bg: "#F5F3FF", emoji: "✨", gradient: "linear-gradient(135deg, #C4B5FD 0%, #A78BFA 50%, #7C3AED 100%)" },
  international: { label: "國際新知", color: "#0E7490", bg: "#ECFEFF", emoji: "🌐", gradient: "linear-gradient(135deg, #67E8F9 0%, #22D3EE 50%, #0E7490 100%)" },
  tech:          { label: "新技術", color: "#D97706", bg: "#FFFBEB", emoji: "🔬", gradient: "linear-gradient(135deg, #FDE68A 0%, #FBBF24 50%, #D97706 100%)" },
};

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "60" });
    if (category) params.set("category", category);
    fetch(`${API}/api/news?${params}`)
      .then((r) => r.json())
      .then((d) => { setItems(d.items || []); setTotal(d.total || 0); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 60px" }}>
        {/* 麵包屑 */}
        <nav style={{ fontSize: 12, marginBottom: 14 }}>
          <Link href="/" style={{ color: "#718096", textDecoration: "none" }}>首頁</Link>
          <span style={{ margin: "0 6px" }}>/</span>
          <span style={{ color: "#1A202C" }}>醫美快訊</span>
        </nav>

        {/* 標題 */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1A202C", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
            📰 醫美快訊
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: 0, lineHeight: 1.7 }}>
            自動聚合國內外醫美新聞、韓國最新趨勢、國際醫美技術。每天自動更新。
          </p>
        </div>

        {/* 分類 tab */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.k}
              onClick={() => setCategory(c.k)}
              style={{
                padding: "9px 18px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                background: category === c.k ? c.color : "#fff",
                color: category === c.k ? "#fff" : "#475569",
                boxShadow: category === c.k ? `0 2px 8px ${c.color}40` : "0 1px 2px rgba(0,0,0,.05)",
                border: category === c.k ? "0" : "1px solid #E2E8F0",
              }}
            >
              <span style={{ marginRight: 6 }}>{c.icon}</span>{c.label}
            </button>
          ))}
          <div style={{ marginLeft: "auto", fontSize: 12, color: "#94A3B8", alignSelf: "center", padding: "0 8px" }}>
            共 {total} 則
          </div>
        </div>

        {/* 卡片網格 */}
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "#94A3B8" }}>載入中…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#94A3B8", background: "#fff", borderRadius: 12, border: "1px dashed #CBD5E0" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
            <p style={{ fontSize: 14, margin: 0 }}>暫無資料，爬蟲首次執行後將自動更新</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
            {items.map((n) => (
              <NewsCard key={n.id} news={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NewsCard({ news: n }: { news: NewsItem }) {
  const cat = CATEGORY_LABEL[n.category] || CATEGORY_LABEL.domestic;

  return (
    <a
      href={n.source_url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        background: "#fff",
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid #E2E8F0",
        boxShadow: "0 2px 8px rgba(0,0,0,.04)",
        textDecoration: "none",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      className="news-card"
    >
      {/* 封面（無 cover 時用品牌色漸層 + emoji + 標題首句） */}
      <div style={{ aspectRatio: "16/10", position: "relative", overflow: "hidden", background: n.cover_image ? cat.bg : cat.gradient }}>
        {n.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={n.cover_image} alt={n.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 18, color: "#fff", textAlign: "center" }}>
            <div style={{ fontSize: 44, opacity: 0.88, marginBottom: 8, textShadow: "0 2px 8px rgba(0,0,0,.25)" }}>{cat.emoji}</div>
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4, textShadow: "0 1px 3px rgba(0,0,0,.3)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", maxWidth: "90%" }}>
              {n.title.slice(0, 38)}
            </div>
          </div>
        )}
        <div style={{ position: "absolute", top: 12, left: 12, padding: "4px 10px", background: n.cover_image ? cat.color : "rgba(255,255,255,.95)", color: n.cover_image ? "#fff" : cat.color, fontSize: 11, fontWeight: 700, borderRadius: 6 }}>
          {cat.label}
        </div>
      </div>

      {/* 內容 */}
      <div style={{ padding: 18, flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1A202C", margin: "0 0 8px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {n.title}
        </h3>
        {n.summary && (
          <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.7, margin: "0 0 12px", flex: 1, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {n.summary}
          </p>
        )}

        {/* 關鍵字 */}
        {n.ai_keywords && n.ai_keywords.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
            {n.ai_keywords.slice(0, 4).map((k, i) => (
              <span key={i} style={{ fontSize: 10, color: "#64748B", background: "#F1F5F9", padding: "2px 7px", borderRadius: 99 }}>
                {k}
              </span>
            ))}
          </div>
        )}

        {/* footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #F1F5F9", fontSize: 11, color: "#94A3B8" }}>
          <span style={{ fontWeight: 600 }}>{n.source_name || "新聞"}</span>
          <span>{n.published_at ? n.published_at.slice(0, 10) : "—"}</span>
        </div>
      </div>

      <style>{`
        .news-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,.08) !important;
        }
      `}</style>
    </a>
  );
}
