"use client";
import { useEffect, useState, useCallback, Fragment } from "react";

interface Penalty {
  id: number;
  target_id: string;
  clinic_name: string | null;
  source: string;
  source_url: string;
  penalty_date: string | null;
  agency: string | null;
  violation_item: string | null;
  violation_item_plain: string | null;
  law_article: string | null;
  fine_amount: number;
  penalty_type: string | null;
  severity: "severe" | "medium" | "minor";
  is_major: boolean;
  status: "active" | "pending" | "hidden";
  raw_data: any;
  created_at: string | null;
}

interface Stats {
  active: number;
  pending: number;
  hidden: number;
  severe: number;
  medium: number;
  minor: number;
  clinics_affected: number;
}

const API = process.env.NEXT_PUBLIC_API_URL || "";

const SEVERITY_LABEL: Record<string, string> = { severe: "🔴 重大", medium: "🟡 中度", minor: "🟢 輕微" };
const SEVERITY_BG: Record<string, string> = { severe: "#FFF5F5", medium: "#FFFAF0", minor: "#F0FFF4" };
const SEVERITY_COLOR: Record<string, string> = { severe: "#C53030", medium: "#C05621", minor: "#2F855A" };
const STATUS_LABEL: Record<string, string> = { active: "已上架", pending: "待審核", hidden: "已隱藏" };
const STATUS_COLOR: Record<string, string> = { active: "#38A169", pending: "#ED8936", hidden: "#A0AEC0" };
const SOURCE_LABEL: Record<string, string> = {
  news: "新聞媒體",
  mohw: "衛福部",
  taipei: "北市衛生局",
  newtaipei: "新北衛生局",
  taoyuan: "桃園衛生局",
  taichung: "台中衛生局",
  tainan: "台南衛生局",
  kaohsiung: "高雄衛生局",
  ftc: "公平交易委員會",
};

export default function PenaltiesPage() {
  const [items, setItems] = useState<Penalty[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [total, setTotal] = useState(0);

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || "" : "";
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const loadStats = useCallback(() => {
    fetch(`${API}/api/admin/penalties/stats`, { headers })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadList = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (statusFilter) params.set("status", statusFilter);
    if (severityFilter) params.set("severity", severityFilter);
    if (sourceFilter) params.set("source", sourceFilter);
    fetch(`${API}/api/admin/penalties?${params}`, { headers })
      .then((r) => r.json())
      .then((d) => {
        setItems(Array.isArray(d.items) ? d.items : []);
        setTotal(d.total || 0);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, severityFilter, sourceFilter, token]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadList(); }, [loadList]);

  async function approve(id: number) {
    await fetch(`${API}/api/admin/penalties/${id}`, {
      method: "PATCH", headers, body: JSON.stringify({ status: "active" }),
    });
    loadList(); loadStats();
  }

  async function hide(id: number) {
    if (!confirm("確認隱藏此筆處分紀錄？前台將不再顯示")) return;
    await fetch(`${API}/api/admin/penalties/${id}`, { method: "DELETE", headers });
    loadList(); loadStats();
  }

  async function setSeverity(id: number, severity: string) {
    await fetch(`${API}/api/admin/penalties/${id}`, {
      method: "PATCH", headers, body: JSON.stringify({ severity }),
    });
    loadList(); loadStats();
  }

  async function runCrawler() {
    if (!confirm("確認啟動新聞稿爬蟲？將消耗 Gemini API 額度（約 $4-8 USD）")) return;
    setRunning(true);
    const r = await fetch(`${API}/api/admin/penalties/run-crawler?source=news`, {
      method: "POST", headers,
    });
    const d = await r.json();
    alert(d.message || "爬蟲已啟動");
    setRunning(false);
  }

  return (
    <div>
      {/* 統計卡 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="已上架" value={stats?.active ?? "—"} color="#38A169" />
        <StatCard label="待審核" value={stats?.pending ?? "—"} color="#ED8936" />
        <StatCard label="重大違規" value={stats?.severe ?? "—"} color="#C53030" />
        <StatCard label="影響診所" value={stats?.clinics_affected ?? "—"} color="#2B6CB0" />
      </div>

      {/* 觸發爬蟲 */}
      <div style={{ background: "#fff", padding: 16, borderRadius: 10, marginBottom: 16, border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1A202C" }}>新聞稿聚合爬蟲</div>
          <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>抓 Google News 7 組關鍵字 + Gemini 提取 → 進入待審核佇列</div>
        </div>
        <button
          onClick={runCrawler}
          disabled={running}
          style={{ padding: "10px 18px", background: running ? "#A0AEC0" : "#2B6CB0", color: "#fff", border: 0, borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: running ? "not-allowed" : "pointer" }}
        >
          {running ? "啟動中…" : "🕷️ 觸發爬蟲"}
        </button>
      </div>

      {/* 篩選 */}
      <div style={{ background: "#fff", padding: 12, borderRadius: 10, marginBottom: 12, border: "1px solid #E2E8F0", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <FilterTabs
          label="狀態"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { v: "", label: "全部" },
            { v: "pending", label: "待審核" },
            { v: "active", label: "已上架" },
            { v: "hidden", label: "已隱藏" },
          ]}
        />
        <FilterTabs
          label="嚴重度"
          value={severityFilter}
          onChange={setSeverityFilter}
          options={[
            { v: "", label: "全部" },
            { v: "severe", label: "🔴 重大" },
            { v: "medium", label: "🟡 中度" },
            { v: "minor", label: "🟢 輕微" },
          ]}
        />
        <FilterTabs
          label="來源"
          value={sourceFilter}
          onChange={setSourceFilter}
          options={[
            { v: "", label: "全部" },
            { v: "news", label: "新聞" },
          ]}
        />
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#718096", alignSelf: "center" }}>
          共 {total} 筆
        </div>
      </div>

      {/* 列表 */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#A0AEC0" }}>載入中…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#A0AEC0" }}>無資料</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F7FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <Th>嚴重度</Th>
                <Th>診所</Th>
                <Th>違規事實</Th>
                <Th>罰款</Th>
                <Th>處分日</Th>
                <Th>來源</Th>
                <Th>狀態</Th>
                <Th>操作</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <Fragment key={p.id}>
                  <tr
                    style={{ borderBottom: "1px solid #F0F0F0", cursor: "pointer", background: expanded === p.id ? "#F7FAFC" : undefined }}
                    onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                  >
                    <Td>
                      <span style={{
                        padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                        background: SEVERITY_BG[p.severity], color: SEVERITY_COLOR[p.severity],
                      }}>
                        {SEVERITY_LABEL[p.severity]}
                        {p.is_major && <span style={{ marginLeft: 4 }}>★永久</span>}
                      </span>
                    </Td>
                    <Td>{p.clinic_name || <span style={{ color: "#A0AEC0" }}>未匹配</span>}</Td>
                    <Td>
                      <div style={{ maxWidth: 280 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.violation_item_plain || p.violation_item || "—"}
                        </div>
                        {p.law_article && <div style={{ fontSize: 11, color: "#A0AEC0" }}>{p.law_article}</div>}
                      </div>
                    </Td>
                    <Td>{p.fine_amount > 0 ? `NT$ ${p.fine_amount.toLocaleString()}` : "—"}</Td>
                    <Td>{p.penalty_date || "—"}</Td>
                    <Td><span style={{ fontSize: 11 }}>{SOURCE_LABEL[p.source] || p.source}</span></Td>
                    <Td>
                      <span style={{ color: STATUS_COLOR[p.status], fontWeight: 600, fontSize: 12 }}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </Td>
                    <Td>
                      <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                        {p.status === "pending" && (
                          <button onClick={() => approve(p.id)} style={btnStyle("#38A169")}>核准</button>
                        )}
                        {p.status !== "hidden" && (
                          <button onClick={() => hide(p.id)} style={btnStyle("#E53E3E")}>隱藏</button>
                        )}
                      </div>
                    </Td>
                  </tr>
                  {expanded === p.id && (
                    <tr style={{ background: "#F7FAFC", borderBottom: "1px solid #E2E8F0" }}>
                      <td colSpan={8} style={{ padding: 16 }}>
                        <ExpandedDetail penalty={p} onSetSeverity={(s) => setSeverity(p.id, s)} />
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

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 10, border: "1px solid #E2E8F0" }}>
      <div style={{ fontSize: 11, color: "#718096", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function FilterTabs({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; label: string }[];
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 11, color: "#718096" }}>{label}:</span>
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          style={{
            padding: "5px 12px", border: 0, borderRadius: 6, fontSize: 12, cursor: "pointer",
            background: value === o.v ? "#2B6CB0" : "#EDF2F7",
            color: value === o.v ? "#fff" : "#4A5568",
            fontWeight: value === o.v ? 600 : 400,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ExpandedDetail({ penalty, onSetSeverity }: { penalty: Penalty; onSetSeverity: (s: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <div>
        <Field label="處分機關" value={penalty.agency} />
        <Field label="原始違規事實" value={penalty.violation_item} />
        <Field label="白話翻譯" value={penalty.violation_item_plain} />
        <Field label="違反法條" value={penalty.law_article} />
        <Field label="處分類型" value={penalty.penalty_type} />
      </div>
      <div>
        <Field label="來源連結" value={
          <a href={penalty.source_url} target="_blank" rel="noopener noreferrer" style={{ color: "#2B6CB0", wordBreak: "break-all" }}>
            {penalty.source_url}
          </a>
        } />
        {penalty.raw_data?.news_title && <Field label="新聞標題" value={penalty.raw_data.news_title} />}
        {penalty.raw_data?.news_source && <Field label="新聞來源" value={penalty.raw_data.news_source} />}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: "#718096", marginBottom: 6 }}>調整嚴重度：</div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["severe", "medium", "minor"] as const).map((s) => (
              <button
                key={s}
                onClick={() => onSetSeverity(s)}
                style={{
                  padding: "5px 10px", borderRadius: 5, border: 0, fontSize: 12, cursor: "pointer",
                  background: penalty.severity === s ? SEVERITY_COLOR[s] : "#EDF2F7",
                  color: penalty.severity === s ? "#fff" : "#4A5568",
                }}
              >
                {SEVERITY_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
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

function btnStyle(color: string): React.CSSProperties {
  return {
    padding: "4px 10px", border: 0, borderRadius: 5, fontSize: 11, fontWeight: 500,
    background: color, color: "#fff", cursor: "pointer",
  };
}
