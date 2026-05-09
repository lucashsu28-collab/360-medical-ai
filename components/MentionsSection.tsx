"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Mention {
  id: number;
  source_name: string | null;
  source_url: string;
  title: string | null;
  ai_summary: string | null;
  published_at: string | null;
  sentiment: string;
  is_advertorial: boolean;
  keywords: string[];
  contribution_score: number | null;
  authority_weight: number | null;
}

interface MentionsData {
  clinic_id: string;
  source_type: "news" | "social";
  score: number;
  grade: string;
  grade_label: string;
  summary: {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    advertorial: number;
    has_record: boolean;
  };
  mentions: Mention[];
}

const API = process.env.NEXT_PUBLIC_API_URL || "";

const SENTIMENT_BG: Record<string, string> = {
  positive_strong: "#F0FFF4", positive: "#F0FFF4",
  neutral: "#F7FAFC",
  negative: "#FFFAF0", negative_strong: "#FFF5F5",
};
const SENTIMENT_COLOR: Record<string, string> = {
  positive_strong: "#22543D", positive: "#2F855A",
  neutral: "#718096",
  negative: "#C05621", negative_strong: "#C53030",
};
const SENTIMENT_LABEL: Record<string, string> = {
  positive_strong: "🌟 強正", positive: "👍 正面",
  neutral: "➖ 中性",
  negative: "👎 負面", negative_strong: "🔴 強負",
};

const GRADE_COLOR: Record<string, string> = {
  S: "#2F855A", A: "#38A169", B: "#3182CE", C: "#718096", D: "#ED8936", E: "#C53030",
};

interface Props {
  clinicId: string;
  sourceType?: "news" | "social";
  title?: string;
}

export default function MentionsSection({ clinicId, sourceType = "news", title }: Props) {
  const [data, setData] = useState<MentionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const sectionTitle = title || (sourceType === "news" ? "網路媒體口碑" : "社群口碑");

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/clinics/${clinicId}/mentions?source_type=${sourceType}&limit=20`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [clinicId, sourceType]);

  if (loading) {
    return (
      <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A202C", marginBottom: 12 }}>{sectionTitle}</h2>
        <p style={{ fontSize: 13, color: "#A0AEC0" }}>載入中…</p>
      </section>
    );
  }
  if (!data) return null;

  const visibleMentions = showAll ? data.mentions : data.mentions.slice(0, 5);

  return (
    <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A202C", margin: 0 }}>{sectionTitle}</h2>
        <Link href="/rules/reputation" style={{ fontSize: 12, color: "#2B6CB0", textDecoration: "none" }}>評分規則 →</Link>
      </div>

      {/* 評分卡 */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", padding: 16, background: "#F7FAFC", borderRadius: 10, marginBottom: data.summary.has_record ? 16 : 0 }}>
        <div style={{ textAlign: "center", paddingRight: 16, borderRight: "1px solid #E2E8F0" }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: GRADE_COLOR[data.grade] || "#718096" }}>{data.score}</div>
          <div style={{ fontSize: 11, color: "#718096" }}>分</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: GRADE_COLOR[data.grade], marginBottom: 4 }}>{data.grade_label}</div>
          <div style={{ fontSize: 12, color: "#718096" }}>
            {data.summary.has_record ? (
              <>
                近 12 個月 {data.summary.total} 則提及
                {data.summary.positive > 0 && ` · 正面 ${data.summary.positive}`}
                {data.summary.negative > 0 && ` · 負面 ${data.summary.negative}`}
                {data.summary.advertorial > 0 && ` · 業配 ${data.summary.advertorial}`}
              </>
            ) : (
              "目前無相關提及（基準分 60）"
            )}
          </div>
        </div>
      </div>

      {/* 提及列表 */}
      {data.summary.has_record && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {visibleMentions.map((m) => (
              <MentionCard key={m.id} mention={m} />
            ))}
          </div>

          {data.mentions.length > 5 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              style={{ marginTop: 12, background: "transparent", border: 0, fontSize: 13, color: "#2B6CB0", cursor: "pointer", padding: 0 }}
            >
              {showAll ? "▲ 收起" : `▼ 顯示全部 ${data.mentions.length} 則`}
            </button>
          )}

          <p style={{ fontSize: 11, color: "#A0AEC0", borderTop: "1px solid #E2E8F0", paddingTop: 12, marginTop: 16, lineHeight: 1.6 }}>
            本平台從 Google News 聚合主流媒體 + 醫美專業媒體報導，
            業配辨識由 AI + 關鍵字雙重判定，仍可能有誤判。診所可透過後台對單篇提出申訴。
          </p>
        </>
      )}
    </section>
  );
}

function MentionCard({ mention: m }: { mention: Mention }) {
  const color = SENTIMENT_COLOR[m.sentiment] || "#718096";
  const bg = SENTIMENT_BG[m.sentiment] || "#F7FAFC";

  return (
    <div style={{ border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`, borderRadius: 8, padding: 12, background: bg + "60" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color, padding: "2px 8px", background: bg, borderRadius: 4 }}>
          {SENTIMENT_LABEL[m.sentiment] || m.sentiment}
        </span>
        {m.is_advertorial && (
          <span style={{ fontSize: 10, fontWeight: 600, color: "#D69E2E", padding: "2px 6px", background: "#FEF3C7", borderRadius: 4 }}>
            🏷️ 業配（已折扣）
          </span>
        )}
        {m.source_name && <span style={{ fontSize: 11, color: "#4A5568" }}>{m.source_name}</span>}
        {m.published_at && <span style={{ fontSize: 11, color: "#A0AEC0" }}>{m.published_at.slice(0, 10)}</span>}
      </div>

      {m.title && (
        <a href={m.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#1A202C", textDecoration: "none", fontWeight: 600, lineHeight: 1.5, display: "block", marginBottom: 4 }}>
          {m.title}
        </a>
      )}
      {m.ai_summary && <div style={{ fontSize: 12, color: "#4A5568", lineHeight: 1.6 }}>{m.ai_summary}</div>}

      {(m.keywords?.length ?? 0) > 0 && (
        <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
          {m.keywords.slice(0, 4).map((k, i) => (
            <span key={i} style={{ fontSize: 10, color: "#718096", background: "#EDF2F7", padding: "1px 6px", borderRadius: 99 }}>{k}</span>
          ))}
        </div>
      )}
    </div>
  );
}
