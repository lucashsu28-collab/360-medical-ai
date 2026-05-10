"use client";
import { useEffect, useState, useCallback } from "react";

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

interface Stats {
  active: number; hidden: number;
  domestic: number; korea: number; international: number; tech: number;
}

const API = process.env.NEXT_PUBLIC_API_URL || "";

const CAT: Record<string, { label: string; color: string }> = {
  domestic: { label: "國內", color: "#C53030" },
  korea: { label: "韓國", color: "#7C3AED" },
  international: { label: "國際", color: "#0E7490" },
  tech: { label: "技術", color: "#D97706" },
};

export default function AdminNewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusF, setStatusF] = useState("active");
  const [catF, setCatF] = useState("");
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || "" : "";
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const loadStats = useCallback(() => {
    fetch(`${API}/api/admin/news/stats`, { headers })
      .then((r) => r.json()).then(setStats).catch(() => setStats(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadList = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ limit: "100" });
    if (statusF) p.set("status", statusF);
    if (catF) p.set("category", catF);
    fetch(`${API}/api/admin/news?${p}`, { headers })
      .then((r) => r.json())
      .then((d) => { setItems(d.items || []); setTotal(d.total || 0); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusF, catF, token]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadList(); }, [loadList]);

  async function hide(id: number) {
    if (!confirm("確認隱藏此則新聞？前台不再顯示")) return;
    await fetch(`${API}/api/admin/news/${id}`, { method: "DELETE", headers });
    loadList(); loadStats();
  }

  async function changeCategory(id: number, category: string) {
    await fetch(`${API}/api/admin/news/${id}`, {
      method: "PATCH", headers, body: JSON.stringify({ category }),
    });
    loadList(); loadStats();
  }

  async function runCrawler() {
    if (!confirm("啟動醫美快訊爬蟲？將消耗 Gemini API 額度（估 $5-10 USD）")) return;
    setRunning(true);
    const r = await fetch(`${API}/api/admin/news/run-crawler`, { method: "POST", headers });
    const d = await r.json();
    alert(d.message || "已啟動");
    setRunning(false);
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
        <Stat label="已上架" v={stats?.active ?? "—"} c="#38A169" />
        <Stat label="🇹🇼 國內" v={stats?.domestic ?? "—"} c="#C53030" />
        <Stat label="🇰🇷 韓國" v={stats?.korea ?? "—"} c="#7C3AED" />
        <Stat label="🌐 國際" v={stats?.international ?? "—"} c="#0E7490" />
        <Stat label="🔬 技術" v={stats?.tech ?? "—"} c="#D97706" />
      </div>

      <div style={{ background: "#fff", padding: 16, borderRadius: 10, marginBottom: 12, border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>🗞️ 醫美快訊爬蟲</div>
          <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>Google News 10 組關鍵字 × 4 類（國內/韓國/國際/技術），Gemini 摘要 + 過濾無關</div>
        </div>
        <button onClick={runCrawler} disabled={running}
          style={{ padding: "10px 18px", background: running ? "#A0AEC0" : "#2B6CB0", color: "#fff", border: 0, borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: running ? "not-allowed" : "pointer" }}>
          {running ? "啟動中…" : "🕷️ 觸發爬蟲"}
        </button>
      </div>

      <div style={{ background: "#fff", padding: 12, borderRadius: 10, marginBottom: 12, border: "1px solid #E2E8F0", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Tabs label="狀態" v={statusF} on={setStatusF}
          opt={[{ v: "", l: "全部" }, { v: "active", l: "已上架" }, { v: "hidden", l: "已隱藏" }]} />
        <Tabs label="分類" v={catF} on={setCatF}
          opt={[
            { v: "", l: "全部" },
            { v: "domestic", l: "🇹🇼 國內" },
            { v: "korea", l: "🇰🇷 韓國" },
            { v: "international", l: "🌐 國際" },
            { v: "tech", l: "🔬 技術" },
          ]} />
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#718096", alignSelf: "center" }}>共 {total} 則</div>
      </div>

      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#A0AEC0" }}>載入中…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#A0AEC0" }}>無資料 — 請先觸發爬蟲</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F7FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <Th>分類</Th><Th>標題 / 摘要</Th><Th>來源</Th><Th>發布日</Th><Th>操作</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => {
                const c = CAT[n.category] || CAT.domestic;
                return (
                  <tr key={n.id} style={{ borderBottom: "1px solid #F0F0F0" }}>
                    <Td>
                      <select value={n.category} onChange={(e) => changeCategory(n.id, e.target.value)}
                        style={{ padding: "3px 6px", fontSize: 11, border: "1px solid #E2E8F0", borderRadius: 4, color: c.color, fontWeight: 600 }}>
                        <option value="domestic">🇹🇼 國內</option>
                        <option value="korea">🇰🇷 韓國</option>
                        <option value="international">🌐 國際</option>
                        <option value="tech">🔬 技術</option>
                      </select>
                    </Td>
                    <Td>
                      <div style={{ maxWidth: 480 }}>
                        <a href={n.source_url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 13, color: "#1A202C", fontWeight: 600, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                          {n.title}
                        </a>
                        {n.summary && <div style={{ fontSize: 11, color: "#64748B", marginTop: 3, lineHeight: 1.5 }}>{n.summary}</div>}
                      </div>
                    </Td>
                    <Td>{n.source_name || "—"}</Td>
                    <Td>{n.published_at?.slice(0, 10) || "—"}</Td>
                    <Td>
                      <button onClick={() => hide(n.id)}
                        style={{ padding: "4px 10px", border: 0, borderRadius: 5, background: "#FEE2E2", color: "#B91C1C", fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
                        隱藏
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, v, c }: { label: string; v: any; c: string }) {
  return (
    <div style={{ background: "#fff", padding: 14, borderRadius: 10, border: "1px solid #E2E8F0" }}>
      <div style={{ fontSize: 11, color: "#718096", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c }}>{v}</div>
    </div>
  );
}

function Tabs({ label, v, on, opt }: { label: string; v: string; on: (s: string) => void; opt: { v: string; l: string }[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 11, color: "#718096" }}>{label}:</span>
      {opt.map((o) => (
        <button key={o.v} onClick={() => on(o.v)}
          style={{ padding: "5px 12px", border: 0, borderRadius: 6, fontSize: 12, cursor: "pointer",
            background: v === o.v ? "#2B6CB0" : "#EDF2F7", color: v === o.v ? "#fff" : "#4A5568", fontWeight: v === o.v ? 600 : 400 }}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Th({ children }: { children: any }) {
  return <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#718096", textTransform: "uppercase" }}>{children}</th>;
}
function Td({ children }: { children: any }) {
  return <td style={{ padding: "10px 14px", color: "#1A202C", verticalAlign: "top" }}>{children}</td>;
}
