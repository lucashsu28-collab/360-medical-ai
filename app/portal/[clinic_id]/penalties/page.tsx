"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPortalToken } from "@/app/portal/utils";

interface Response {
  id: number;
  response_text: string;
  status: "pending" | "approved" | "rejected";
  created_at: string | null;
  reviewed_at: string | null;
}

interface Penalty {
  id: number;
  severity: "severe" | "medium" | "minor";
  is_major: boolean;
  penalty_date: string | null;
  agency: string | null;
  violation_item: string | null;
  violation_item_plain: string | null;
  law_article: string | null;
  fine_amount: number;
  penalty_type: string | null;
  source: string;
  source_url: string;
  status: "active" | "pending" | "hidden";
  responses: Response[];
}

const API = process.env.NEXT_PUBLIC_API_URL || "";

const SEVERITY_LABEL: Record<string, string> = { severe: "🔴 重大", medium: "🟡 中度", minor: "🟢 輕微" };
const SEVERITY_BG: Record<string, string> = { severe: "#FFF5F5", medium: "#FFFAF0", minor: "#F0FFF4" };
const SEVERITY_COLOR: Record<string, string> = { severe: "#C53030", medium: "#C05621", minor: "#2F855A" };

const STATUS_LABEL: Record<string, string> = { active: "已上架", pending: "審核中", hidden: "已隱藏" };
const RESP_LABEL: Record<string, string> = { pending: "審核中", approved: "已上架", rejected: "未通過" };
const RESP_COLOR: Record<string, string> = { pending: "#C05621", approved: "#2F855A", rejected: "#C53030" };

export default function PortalPenaltiesPage() {
  const params = useParams();
  const clinicId = params?.clinic_id as string;
  const [items, setItems] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    const token = getPortalToken();
    fetch(`${API}/api/portal/${clinicId}/penalties`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d.items) ? d.items : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [clinicId]);

  useEffect(() => { load(); }, [load]);

  async function submitResponse(penaltyId: number) {
    const text = (drafts[penaltyId] || "").trim();
    if (!text) { alert("請輸入改善說明"); return; }
    if (text.length > 200) { alert("改善說明不可超過 200 字"); return; }

    setSubmitting(penaltyId);
    const token = getPortalToken();
    const r = await fetch(`${API}/api/portal/${clinicId}/penalties/${penaltyId}/responses`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ response_text: text }),
    });
    setSubmitting(null);
    if (r.ok) {
      const d = await r.json();
      alert(d.message || "已送出");
      setDrafts((prev) => ({ ...prev, [penaltyId]: "" }));
      load();
    } else {
      alert("送出失敗");
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>稽查違規紀錄</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 16 }}>
        本頁列出本平台聚合到的本診所相關處分紀錄，可針對每一筆提出改善說明（≤ 200 字）
      </p>

      <div style={{ background: "#FFFAF0", border: "1px solid #F6AD55", borderRadius: 10, padding: 14, marginBottom: 24, fontSize: 13, color: "#744210", lineHeight: 1.7 }}>
        💡 改善說明審核時間 5 個工作天，審核通過後會顯示在診所詳細頁的處分紀錄下方，
        標示為「診所回應」。如對處分內容有重大爭議（資料錯誤），請另透過 <Link href="/partnership" style={{ color: "#2B6CB0", fontWeight: 600 }}>聯繫平台</Link> 提出。
      </div>

      {loading ? (
        <p style={{ color: "#94A3B8", fontSize: 13 }}>載入中…</p>
      ) : items.length === 0 ? (
        <div style={{ background: "#F0FFF4", border: "1px solid #9AE6B4", borderRadius: 10, padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>✓</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#2F855A", margin: 0 }}>本診所目前無處分紀錄</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {items.map((p) => (
            <PenaltyItem
              key={p.id}
              penalty={p}
              draft={drafts[p.id] || ""}
              onDraftChange={(v) => setDrafts((prev) => ({ ...prev, [p.id]: v }))}
              onSubmit={() => submitResponse(p.id)}
              submitting={submitting === p.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PenaltyItem({
  penalty: p, draft, onDraftChange, onSubmit, submitting,
}: {
  penalty: Penalty;
  draft: string;
  onDraftChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const sevColor = SEVERITY_COLOR[p.severity];
  const sevBg = SEVERITY_BG[p.severity];

  return (
    <div style={{ background: "#fff", border: `1px solid ${sevColor}30`, borderLeft: `4px solid ${sevColor}`, borderRadius: 10, padding: 16 }}>
      {/* 標題列 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: sevColor, padding: "3px 9px", background: sevBg, borderRadius: 5 }}>
          {SEVERITY_LABEL[p.severity]}
          {p.is_major && <span style={{ marginLeft: 4 }}>★永久顯示</span>}
        </span>
        <span style={{ fontSize: 12, color: "#0F172A", fontWeight: 600 }}>{p.penalty_date}</span>
        {p.agency && <span style={{ fontSize: 12, color: "#64748B" }}>· {p.agency}</span>}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#64748B", padding: "2px 8px", background: "#F1F5F9", borderRadius: 4 }}>
          狀態：{STATUS_LABEL[p.status]}
        </span>
      </div>

      <div style={{ fontSize: 14, color: "#0F172A", lineHeight: 1.7, marginBottom: 8 }}>
        {p.violation_item_plain || p.violation_item || "—"}
      </div>

      <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#475569", flexWrap: "wrap", marginBottom: 12 }}>
        {p.law_article && <span>📜 {p.law_article}</span>}
        {p.penalty_type && <span>⚖️ {p.penalty_type}</span>}
        {p.fine_amount > 0 && <span style={{ fontWeight: 600 }}>💰 NT$ {p.fine_amount.toLocaleString()}</span>}
        {p.source_url && (
          <a href={p.source_url} target="_blank" rel="noopener noreferrer" style={{ color: "#2B6CB0", textDecoration: "none" }}>
            原始公告 →
          </a>
        )}
      </div>

      {/* 已提交的回應 */}
      {p.responses.length > 0 && (
        <div style={{ marginBottom: 12, padding: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6 }}>已提交的改善說明</div>
          {p.responses.map((r) => (
            <div key={r.id} style={{ marginBottom: 6, paddingBottom: 6, borderBottom: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 12, color: "#0F172A", lineHeight: 1.6, marginBottom: 2 }}>{r.response_text}</div>
              <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#94A3B8" }}>
                <span style={{ color: RESP_COLOR[r.status], fontWeight: 600 }}>● {RESP_LABEL[r.status]}</span>
                {r.created_at && <span>· 提交於 {r.created_at.slice(0, 10)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新增回應 */}
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>提交改善說明（≤ 200 字）</div>
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value.slice(0, 200))}
          placeholder="例：本診所已於 2024/05 改善溝通流程，新增術前同意書..."
          style={{
            width: "100%", minHeight: 70, padding: 10, fontSize: 13, lineHeight: 1.6,
            border: "1px solid #E2E8F0", borderRadius: 6, resize: "vertical",
            fontFamily: "inherit", boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <span style={{ fontSize: 11, color: "#94A3B8" }}>{draft.length}/200 字</span>
          <button
            onClick={onSubmit}
            disabled={submitting || !draft.trim()}
            style={{
              padding: "6px 16px", border: 0, borderRadius: 6,
              background: submitting || !draft.trim() ? "#CBD5E1" : "#2B6CB0",
              color: "#fff", fontSize: 12, fontWeight: 600,
              cursor: submitting || !draft.trim() ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "送出中…" : "送出說明"}
          </button>
        </div>
      </div>
    </div>
  );
}
