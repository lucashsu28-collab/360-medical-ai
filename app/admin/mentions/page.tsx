"use client";
import { useEffect, useState, useCallback, Fragment } from "react";

interface Mention {
  id: number;
  target_id: string;
  clinic_name: string | null;
  source_type: string;
  source_name: string | null;
  source_url: string;
  title: string | null;
  content: string;
  published_at: string | null;
  sentiment: string;
  sentiment_score: number;
  authority_weight: number;
  is_advertorial: boolean;
  ad_confidence: number | null;
  ai_summary: string | null;
  keywords: string[];
  contribution_score: number | null;
  status: string;
}

interface Stats {
  active: number; pending: number; hidden: number;
  positive: number; neutral: number; negative: number;
  advertorial: number; clinics_covered: number;
}

const API = process.env.NEXT_PUBLIC_API_URL || "";

const SENTIMENT_LABEL: Record<string, string> = {
  positive_strong: "🌟 強正", positive: "👍 正面",
  neutral: "➖ 中性",
  negative: "👎 負面", negative_strong: "🔴 強負",
};
const SENTIMENT_COLOR: Record<string, string> = {
  positive_strong: "#22543D", positive: "#2F855A",
  neutral: "#718096",
  negative: "#C05621", negative_strong: "#C53030",
};
const STATUS_LABEL: Record<string, string> = { active: "已上架", pending: "待審核", hidden: "已隱藏" };

export default function MentionsPage() {
  const [items, setItems] = useState<Mention[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusFilter, setStatusFilter] = useState("active");
  const [sentimentFilter, setSentimentFilter] = useState("");
  const [adFilter, setAdFilter] = useState("");  // "" / "true" / "false"
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [total, setTotal] = useState(0);

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || "" : "";
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const loadStats = useCallback(() => {
    fetch(`${API}/api/admin/mentions/stats`, { headers })
      .then((r) => r.json()).then(setStats).catch(() => setStats(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadList = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ limit: "100" });
    if (statusFilter) p.set("status", statusFilter);
    if (sentimentFilter) p.set("sentiment", sentimentFilter);
    if (adFilter) p.set("is_advertorial", adFilter);
    fetch(`${API}/api/admin/mentions?${p}`, { headers })
      .then((r) => r.json())
      .then((d) => { setItems(d.items || []); setTotal(d.total || 0); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sentimentFilter, adFilter, token]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadList(); }, [loadList]);

  async function patchMention(id: number, data: any) {
    await fetch(`${API}/api/admin/mentions/${id}`, {
      method: "PATCH", headers, body: JSON.stringify(data),
    });
    loadList(); loadStats();
  }

  async function hide(id: number) {
    if (!confirm("確認隱藏此筆？")) return;
    await fetch(`${API}/api/admin/mentions/${id}`, { method: "DELETE", headers });
    loadList(); loadStats();
  }

  async function runCrawler() {
    if (!confirm("啟動口碑爬蟲？將消耗 Gemini API 額度（估 $5-15 USD）")) return;
    setRunning(true);
    const r = await fetch(`${API}/api/admin/mentions/run-crawler?source=news`, {
      method: "POST", headers,
    });
    const d = await r.json();
    alert(d.message || "已啟動");
    setRunning(false);
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <Stat label="正面提及" value={stats?.positive ?? "—"} color="#2F855A" />
        <Stat label="負面提及" value={stats?.negative ?? "—"} color="#C53030" />
        <Stat label="業配文" value={stats?.advertorial ?? "—"} color="#D69E2E" />
        <Stat label="覆蓋診所" value={stats?.clinics_covered ?? "—"} color="#2B6CB0" />
      </div>

      <div style={{ background: "#fff", padding: 16, borderRadius: 10, marginBottom: 12, border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>網路媒體口碑爬蟲</div>
          <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>抓 Google News 8 組醫美關鍵字 + Gemini 提取 + 業配辨識</div>
        </div>
        <button onClick={runCrawler} disabled={running}
          style={{ padding: "10px 18px", background: running ? "#A0AEC0" : "#2B6CB0", color: "#fff", border: 0, borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: running ? "not-allowed" : "pointer" }}>
          {running ? "啟動中…" : "🕷️ 觸發爬蟲"}
        </button>
      </div>

      <div style={{ background: "#fff", padding: 12, borderRadius: 10, marginBottom: 12, border: "1px solid #E2E8F0", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Tabs label="狀態" value={statusFilter} onChange={setStatusFilter}
          options={[{ v: "", label: "全部" }, { v: "active", label: "已上架" }, { v: "pending", label: "待審核" }, { v: "hidden", label: "已隱藏" }]} />
        <Tabs label="情緒" value={sentimentFilter} onChange={setSentimentFilter}
          options={[
            { v: "", label: "全部" },
            { v: "positive_strong", label: "🌟 強正" },
            { v: "positive", label: "👍 正面" },
            { v: "neutral", label: "➖ 中性" },
            { v: "negative", label: "👎 負面" },
            { v: "negative_strong", label: "🔴 強負" },
          ]} />
        <Tabs label="業配" value={adFilter} onChange={setAdFilter}
          options={[{ v: "", label: "全部" }, { v: "true", label: "業配文" }, { v: "false", label: "純編輯" }]} />
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#718096", alignSelf: "center" }}>共 {total} 筆</div>
      </div>

      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#A0AEC0" }}>載入中…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#A0AEC0" }}>無資料</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F7FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <Th>情緒</Th><Th>診所</Th><Th>標題</Th><Th>來源</Th><Th>發布日</Th><Th>貢獻</Th><Th>業配</Th><Th>操作</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <Fragment key={m.id}>
                  <tr style={{ borderBottom: "1px solid #F0F0F0", cursor: "pointer", background: expanded === m.id ? "#F7FAFC" : undefined }}
                    onClick={() => setExpanded(expanded === m.id ? null : m.id)}>
                    <Td><span style={{ fontSize: 11, color: SENTIMENT_COLOR[m.sentiment], fontWeight: 600 }}>{SENTIMENT_LABEL[m.sentiment] || m.sentiment}</span></Td>
                    <Td>{m.clinic_name || <span style={{ color: "#A0AEC0" }}>—</span>}</Td>
                    <Td>
                      <div style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</div>
                      {m.ai_summary && <div style={{ fontSize: 11, color: "#A0AEC0", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.ai_summary}</div>}
                    </Td>
                    <Td>
                      <div style={{ fontSize: 11 }}>{m.source_name || "—"}</div>
                      <div style={{ fontSize: 10, color: "#A0AEC0" }}>權威 ×{m.authority_weight?.toFixed(1)}</div>
                    </Td>
                    <Td>{m.published_at?.slice(0, 10) || "—"}</Td>
                    <Td>{m.contribution_score != null ? (m.contribution_score > 0 ? `+${m.contribution_score}` : `${m.contribution_score}`) : "—"}</Td>
                    <Td>{m.is_advertorial ? <span style={{ color: "#D69E2E" }}>🏷️ 業配</span> : <span style={{ color: "#A0AEC0" }}>—</span>}</Td>
                    <Td>
                      <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                        {m.status === "pending" && <button onClick={() => patchMention(m.id, { status: "active" })} style={btn("#38A169")}>核准</button>}
                        {m.status !== "hidden" && <button onClick={() => hide(m.id)} style={btn("#E53E3E")}>隱藏</button>}
                        <button onClick={() => patchMention(m.id, { is_advertorial: !m.is_advertorial })} style={btn("#D69E2E")}>{m.is_advertorial ? "取消業配" : "標業配"}</button>
                      </div>
                    </Td>
                  </tr>
                  {expanded === m.id && (
                    <tr style={{ background: "#F7FAFC", borderBottom: "1px solid #E2E8F0" }}>
                      <td colSpan={8} style={{ padding: 16 }}>
                        <Detail mention={m} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 10, border: "1px solid #E2E8F0" }}>
      <div style={{ fontSize: 11, color: "#718096", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function Tabs({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; label: string }[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 11, color: "#718096" }}>{label}:</span>
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)}
          style={{ padding: "5px 12px", border: 0, borderRadius: 6, fontSize: 12, cursor: "pointer",
            background: value === o.v ? "#2B6CB0" : "#EDF2F7",
            color: value === o.v ? "#fff" : "#4A5568",
            fontWeight: value === o.v ? 600 : 400 }}>{o.label}</button>
      ))}
    </div>
  );
}

function Detail({ mention }: { mention: Mention }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, fontSize: 13 }}>
      <div>
        <Field label="完整內容" value={mention.content} />
        <Field label="關鍵字" value={mention.keywords?.join(", ")} />
        <Field label="AI 摘要" value={mention.ai_summary} />
      </div>
      <div>
        <Field label="來源連結" value={
          <a href={mention.source_url} target="_blank" rel="noopener noreferrer" style={{ color: "#2B6CB0", wordBreak: "break-all" }}>{mention.source_url}</a>
        } />
        <Field label="情緒分數" value={mention.sentiment_score?.toString()} />
        <Field label="業配信心" value={mention.ad_confidence?.toFixed(2)} />
        <Field label="貢獻值" value={mention.contribution_score?.toString()} />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 11, color: "#718096" }}>{label}</div>
      <div style={{ fontSize: 13, color: "#1A202C" }}>{value || <span style={{ color: "#A0AEC0" }}>—</span>}</div>
    </div>
  );
}

function Th({ children }: { children: any }) {
  return <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#718096", textTransform: "uppercase" }}>{children}</th>;
}
function Td({ children }: { children: any }) {
  return <td style={{ padding: "10px 14px", color: "#1A202C" }}>{children}</td>;
}
function btn(color: string): React.CSSProperties {
  return { padding: "4px 10px", border: 0, borderRadius: 5, fontSize: 11, fontWeight: 500, background: color, color: "#fff", cursor: "pointer" };
}
