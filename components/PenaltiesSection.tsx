"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Penalty {
  id: number;
  display_mode: "full" | "summary";
  severity: "severe" | "medium" | "minor";
  is_major: boolean;
  penalty_date: string;
  agency?: string;
  violation_item?: string;
  violation_item_plain?: string;
  law_article?: string;
  fine_amount?: number;
  penalty_type?: string;
  source_url?: string;
  source?: string;
  clinic_responses?: { response_text: string; created_at: string }[];
}

interface PenaltyData {
  clinic_id: string;
  penalty_score: number;
  summary: {
    total_displayed: number;
    full_count: number;
    summary_count: number;
    major_count: number;
    has_record: boolean;
  };
  penalties_full: Penalty[];
  penalties_summary: Penalty[];
}

const API = process.env.NEXT_PUBLIC_API_URL || "";

const SEVERITY_LABEL: Record<string, string> = { severe: "🔴 重大", medium: "🟡 中度", minor: "🟢 輕微" };
const SEVERITY_BG: Record<string, string> = { severe: "#FFF5F5", medium: "#FFFAF0", minor: "#F0FFF4" };
const SEVERITY_COLOR: Record<string, string> = { severe: "#C53030", medium: "#C05621", minor: "#2F855A" };

const SCORE_GRADE = (score: number): { label: string; color: string } => {
  if (score >= 90) return { label: "S 卓越", color: "#2F855A" };
  if (score >= 80) return { label: "A 優良", color: "#38A169" };
  if (score >= 70) return { label: "B 良好", color: "#3182CE" };
  if (score >= 60) return { label: "C 中性", color: "#718096" };
  if (score >= 50) return { label: "D 普通", color: "#ED8936" };
  return { label: "E 警示", color: "#C53030" };
};

export default function PenaltiesSection({ clinicId }: { clinicId: string }) {
  const [data, setData] = useState<PenaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/clinics/${clinicId}/penalties`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [clinicId]);

  if (loading) {
    return (
      <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A202C", marginBottom: 12 }}>稽查違規紀錄</h2>
        <p style={{ fontSize: 13, color: "#A0AEC0" }}>載入中…</p>
      </section>
    );
  }

  if (!data) return null;

  const grade = SCORE_GRADE(data.penalty_score);

  // 無紀錄顯示
  if (!data.summary.has_record) {
    return (
      <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A202C", margin: 0 }}>稽查違規紀錄</h2>
          <Link href="/rules/penalty" style={{ fontSize: 12, color: "#2B6CB0", textDecoration: "none" }}>
            評分規則 →
          </Link>
        </div>
        <div style={{ background: "#F0FFF4", border: "1px solid #9AE6B4", borderRadius: 10, padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#2F855A", margin: 0 }}>目前無公開違規紀錄</p>
          <p style={{ fontSize: 12, color: "#718096", marginTop: 6, lineHeight: 1.6 }}>
            本平台從新聞媒體報導與政府公開資料聚合，
            <br />
            「無公開紀錄」不等同「絕無違規」，僅代表查無公開資訊
          </p>
        </div>
      </section>
    );
  }

  return (
    <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A202C", margin: 0 }}>稽查違規紀錄</h2>
        <Link href="/rules/penalty" style={{ fontSize: 12, color: "#2B6CB0", textDecoration: "none" }}>
          評分規則 →
        </Link>
      </div>

      {/* 評分卡 */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", padding: 16, background: "#F7FAFC", borderRadius: 10, marginBottom: 16 }}>
        <div style={{ textAlign: "center", paddingRight: 16, borderRight: "1px solid #E2E8F0" }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: grade.color }}>{data.penalty_score}</div>
          <div style={{ fontSize: 11, color: "#718096" }}>分</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: grade.color, marginBottom: 4 }}>{grade.label}</div>
          <div style={{ fontSize: 12, color: "#718096", lineHeight: 1.6 }}>
            近 3 年 {data.summary.full_count} 筆完整紀錄
            {data.summary.summary_count > 0 && ` · 3-5 年 ${data.summary.summary_count} 筆摘要`}
            {data.summary.major_count > 0 && ` · ${data.summary.major_count} 筆重大違規（永久顯示）`}
          </div>
        </div>
      </div>

      {/* 完整顯示清單 */}
      {data.penalties_full.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.penalties_full.map((p) => (
            <PenaltyCard key={p.id} penalty={p} />
          ))}
        </div>
      )}

      {/* 3-5 年摘要 */}
      {data.penalties_summary.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #E2E8F0" }}>
          <button
            onClick={() => setShowSummary((v) => !v)}
            style={{ background: "transparent", border: 0, fontSize: 13, color: "#2B6CB0", cursor: "pointer", padding: 0 }}
          >
            {showSummary ? "▼" : "▶"} 3-5 年前另有 {data.penalties_summary.length} 筆處分摘要
          </button>
          {showSummary && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {data.penalties_summary.map((p) => (
                <div key={p.id} style={{ fontSize: 12, color: "#718096", padding: "6px 12px", background: "#F7FAFC", borderRadius: 6 }}>
                  {p.penalty_date} · {SEVERITY_LABEL[p.severity]}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 資料來源聲明 */}
      <p style={{ fontSize: 11, color: "#A0AEC0", borderTop: "1px solid #E2E8F0", paddingTop: 12, marginTop: 16, lineHeight: 1.6 }}>
        本頁資料來自政府公開資料與新聞媒體報導，內容以原始公告為準。
        診所對處分內容若有異議，可透過診所後台提出申訴。
      </p>
    </section>
  );
}

function PenaltyCard({ penalty }: { penalty: Penalty }) {
  const sevColor = SEVERITY_COLOR[penalty.severity];
  const sevBg = SEVERITY_BG[penalty.severity];

  return (
    <div style={{ border: `1px solid ${sevColor}30`, borderLeft: `3px solid ${sevColor}`, borderRadius: 8, padding: 14, background: sevBg + "40" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: sevColor, padding: "2px 8px", background: sevBg, borderRadius: 4 }}>
          {SEVERITY_LABEL[penalty.severity]}
          {penalty.is_major && <span style={{ marginLeft: 4 }}>★永久</span>}
        </span>
        <span style={{ fontSize: 12, color: "#4A5568" }}>{penalty.penalty_date}</span>
        {penalty.agency && <span style={{ fontSize: 12, color: "#718096" }}>· {penalty.agency}</span>}
      </div>

      <div style={{ fontSize: 13, color: "#1A202C", lineHeight: 1.6, marginBottom: 4 }}>
        {penalty.violation_item_plain || penalty.violation_item || "—"}
      </div>

      <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#4A5568", flexWrap: "wrap", marginTop: 6 }}>
        {penalty.law_article && <span>📜 {penalty.law_article}</span>}
        {penalty.penalty_type && <span>⚖️ {penalty.penalty_type}</span>}
        {(penalty.fine_amount ?? 0) > 0 && (
          <span style={{ fontWeight: 600 }}>💰 NT$ {penalty.fine_amount!.toLocaleString()}</span>
        )}
      </div>

      {/* 診所改善說明 */}
      {(penalty.clinic_responses?.length ?? 0) > 0 && (
        <div style={{ marginTop: 10, padding: 10, background: "#EBF8FF", borderRadius: 6, fontSize: 12, color: "#2C5282" }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>診所回應：</div>
          {penalty.clinic_responses!.map((r, i) => (
            <div key={i} style={{ lineHeight: 1.6 }}>{r.response_text}</div>
          ))}
        </div>
      )}

      {penalty.source_url && (
        <a
          href={penalty.source_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11, color: "#2B6CB0", textDecoration: "none", marginTop: 8, display: "inline-block" }}
        >
          原始公告 →
        </a>
      )}
    </div>
  );
}
