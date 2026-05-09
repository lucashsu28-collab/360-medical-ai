"use client";
import { useEffect, useState } from "react";

interface TrendPoint {
  date: string;
  news_score: number | null;
  penalty_score: number | null;
}

interface TrendData {
  clinic_id: string;
  days: number;
  points: TrendPoint[];
  has_data: boolean;
}

const API = process.env.NEXT_PUBLIC_API_URL || "";

const SERIES_CONFIG = [
  { key: "news_score" as const, label: "📰 媒體口碑", color: "#3182CE" },
  { key: "penalty_score" as const, label: "⚠️ 稽查違規", color: "#ED8936" },
];

export default function ReputationTrendChart({ clinicId }: { clinicId: string }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/clinics/${clinicId}/reputation/trend?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [clinicId, days]);

  if (loading) {
    return (
      <section style={cardStyle}>
        <h2 style={titleStyle}>聲譽趨勢</h2>
        <p style={{ fontSize: 13, color: "#A0AEC0" }}>載入中…</p>
      </section>
    );
  }
  if (!data?.has_data) {
    return (
      <section style={cardStyle}>
        <h2 style={titleStyle}>聲譽趨勢</h2>
        <p style={{ fontSize: 13, color: "#A0AEC0", padding: "20px 0" }}>
          目前尚無趨勢資料（每週日重算後累積）
        </p>
      </section>
    );
  }

  const W = 600;
  const H = 200;
  const PADDING = { top: 10, right: 12, bottom: 24, left: 30 };
  const innerW = W - PADDING.left - PADDING.right;
  const innerH = H - PADDING.top - PADDING.bottom;

  const points = data.points;
  const xStep = points.length > 1 ? innerW / (points.length - 1) : 0;

  const yToPx = (score: number | null) => {
    if (score == null) return null;
    return PADDING.top + innerH - (score / 100) * innerH;
  };

  return (
    <section style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={titleStyle}>聲譽趨勢</h2>
        <div style={{ display: "flex", gap: 6 }}>
          {[30, 90, 180].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: "4px 12px", border: 0, borderRadius: 5, fontSize: 12, cursor: "pointer",
                background: days === d ? "#2B6CB0" : "#EDF2F7",
                color: days === d ? "#fff" : "#4A5568",
                fontWeight: days === d ? 600 : 400,
              }}
            >
              {d} 天
            </button>
          ))}
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        {/* 背景格線 */}
        {[0, 25, 50, 75, 100].map((y) => {
          const yPx = PADDING.top + innerH - (y / 100) * innerH;
          return (
            <g key={y}>
              <line x1={PADDING.left} y1={yPx} x2={W - PADDING.right} y2={yPx} stroke="#E2E8F0" strokeDasharray="2 3" />
              <text x={PADDING.left - 4} y={yPx + 3} fontSize={10} fill="#A0AEC0" textAnchor="end">{y}</text>
            </g>
          );
        })}

        {/* 三條線 */}
        {SERIES_CONFIG.map((cfg) => {
          let path = "";
          let started = false;
          points.forEach((p, i) => {
            const yPx = yToPx(p[cfg.key]);
            if (yPx == null) return;
            const xPx = PADDING.left + i * xStep;
            path += `${started ? " L" : "M"} ${xPx} ${yPx}`;
            started = true;
          });
          return (
            <g key={cfg.key}>
              <path d={path} stroke={cfg.color} strokeWidth={2} fill="none" />
              {points.map((p, i) => {
                const yPx = yToPx(p[cfg.key]);
                if (yPx == null) return null;
                return <circle key={i} cx={PADDING.left + i * xStep} cy={yPx} r={2.5} fill={cfg.color} />;
              })}
            </g>
          );
        })}

        {/* X 軸日期標籤（首/末） */}
        {points.length > 0 && (
          <>
            <text x={PADDING.left} y={H - 6} fontSize={10} fill="#718096">{points[0].date.slice(5)}</text>
            <text x={W - PADDING.right} y={H - 6} fontSize={10} fill="#718096" textAnchor="end">
              {points[points.length - 1].date.slice(5)}
            </text>
          </>
        )}
      </svg>

      {/* 圖例 */}
      <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
        {SERIES_CONFIG.map((cfg) => (
          <div key={cfg.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4A5568" }}>
            <span style={{ display: "inline-block", width: 10, height: 10, background: cfg.color, borderRadius: "50%" }} />
            {cfg.label}
          </div>
        ))}
      </div>
    </section>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24,
};
const titleStyle: React.CSSProperties = {
  fontSize: 16, fontWeight: 700, color: "#1A202C", margin: 0,
};
