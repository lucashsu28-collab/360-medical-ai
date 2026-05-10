"use client";
import { useEffect, useState } from "react";
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
}

const API = process.env.NEXT_PUBLIC_API_URL || "";

const CAT: Record<string, { label: string; color: string; bg: string; emoji: string; gradient: string }> = {
  domestic:      { label: "🇹🇼 國內", color: "#C53030", bg: "#FFF5F5", emoji: "🏥", gradient: "linear-gradient(135deg, #FCA5A5 0%, #F87171 50%, #DC2626 100%)" },
  korea:         { label: "🇰🇷 韓國", color: "#7C3AED", bg: "#F5F3FF", emoji: "✨", gradient: "linear-gradient(135deg, #C4B5FD 0%, #A78BFA 50%, #7C3AED 100%)" },
  international: { label: "🌐 國際", color: "#0E7490", bg: "#ECFEFF", emoji: "🌐", gradient: "linear-gradient(135deg, #67E8F9 0%, #22D3EE 50%, #0E7490 100%)" },
  tech:          { label: "🔬 技術", color: "#D97706", bg: "#FFFBEB", emoji: "🔬", gradient: "linear-gradient(135deg, #FDE68A 0%, #FBBF24 50%, #D97706 100%)" },
};

export default function FeaturedNews() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/news?limit=6`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  // 沒資料就不顯示這個區塊（避免空板面）
  if (!loading && items.length === 0) return null;

  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "8px 24px 32px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1A202C", margin: 0, letterSpacing: "-0.01em" }}>
            🗞️ 精選快訊
          </h2>
          <p style={{ fontSize: 12, color: "#718096", margin: "4px 0 0" }}>每天 08:00 自動更新國內外醫美新聞</p>
        </div>
        <Link href="/news" style={{ fontSize: 13, color: "#2B6CB0", textDecoration: "none", fontWeight: 600 }}>
          查看全部 →
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#A0AEC0", fontSize: 13 }}>載入中…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {items.slice(0, 6).map((n) => (
            <NewsCard key={n.id} news={n} />
          ))}
        </div>
      )}
    </section>
  );
}

function NewsCard({ news: n }: { news: NewsItem }) {
  const c = CAT[n.category] || CAT.domestic;
  return (
    <a
      href={n.source_url}
      target="_blank"
      rel="noopener noreferrer"
      className="featured-news-card"
      style={{
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        overflow: "hidden",
        textDecoration: "none",
        boxShadow: "0 1px 3px rgba(0,0,0,.04)",
        transition: "transform 0.15s, box-shadow 0.15s",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 縮圖（無 cover 時用品牌色漸層 + emoji + 標題首句作 fallback） */}
      <div style={{ aspectRatio: "16/9", position: "relative", overflow: "hidden", background: n.cover_image ? c.bg : c.gradient }}>
        {n.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={n.cover_image} alt={n.title} loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, color: "#fff", textAlign: "center" }}>
            <div style={{ fontSize: 36, opacity: 0.85, marginBottom: 6, textShadow: "0 2px 6px rgba(0,0,0,.2)" }}>{c.emoji}</div>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, textShadow: "0 1px 3px rgba(0,0,0,.25)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", maxWidth: "90%" }}>
              {n.title.slice(0, 36)}
            </div>
          </div>
        )}
        <div style={{ position: "absolute", top: 10, left: 10, padding: "3px 9px", background: n.cover_image ? c.color : "rgba(255,255,255,.95)", color: n.cover_image ? "#fff" : c.color, fontSize: 10, fontWeight: 700, borderRadius: 5 }}>
          {c.label}
        </div>
      </div>
      {/* 文字 */}
      <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", margin: "0 0 6px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {n.title}
        </h3>
        {n.summary && (
          <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6, margin: "0 0 10px", flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {n.summary}
          </p>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94A3B8", paddingTop: 8, borderTop: "1px solid #F1F5F9" }}>
          <span style={{ fontWeight: 600 }}>{n.source_name || "新聞"}</span>
          <span>{n.published_at ? n.published_at.slice(0, 10) : "—"}</span>
        </div>
      </div>
      <style>{`
        .featured-news-card:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,.08) !important; }
        @media (max-width: 768px) {
          section[style*="精選快訊"] [style*="grid-template-columns: repeat(3, 1fr)"] { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </a>
  );
}
