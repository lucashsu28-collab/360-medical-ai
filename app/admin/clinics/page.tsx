"use client";

import { useEffect, useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const PAGE_SIZE = 20;

const CITIES = ["臺北市","新北市","桃園市","臺中市","臺南市","高雄市","基隆市","新竹市","嘉義市","新竹縣","苗栗縣","彰化縣","南投縣","雲林縣","嘉義縣","屏東縣","宜蘭縣","花蓮縣","臺東縣","澎湖縣","金門縣","連江縣"];

interface ScoreBreakdown {
  google?: number;
  judicial?: number;
  legal?: number;
  penalty?: number;
  media?: number;
}

interface Clinic {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  category?: string;
  google_rating?: number | null;
  google_rating_score?: number;
  judicial_score?: number;
  legal_score?: number;
  score_breakdown?: ScoreBreakdown;
  dispute_count?: number;
  custom_note?: string;
  has_account?: boolean;
}

function calcTotal(c: Clinic): number {
  const sb = c.score_breakdown || {};
  return (
    (c.google_rating_score ?? sb.google ?? 0) +
    (c.judicial_score ?? sb.judicial ?? 0) +
    (c.legal_score ?? sb.legal ?? 0) +
    (sb.penalty ?? 20) +
    (sb.media ?? 20)
  );
}

function cityFromAddress(addr?: string) {
  if (!addr) return "—";
  const m = addr.match(/^(.*?[市縣])/);
  return m ? m[1] : addr.slice(0, 3);
}

function ScoreTag({ score }: { score: number | null | undefined }) {
  if (score == null) return <span style={{ color: "#94A3B8" }}>—</span>;
  const color = score >= 8 ? "#16A34A" : score >= 5 ? "#D97706" : "#DC2626";
  return <span style={{ color, fontWeight: 600 }}>{score}分</span>;
}

export default function AdminClinicsPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [minScore, setMinScore] = useState("");
  const [page, setPage] = useState(1);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Clinic | null>(null);
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [accountModal, setAccountModal] = useState<Clinic | null>(null);
  const [accountForm, setAccountForm] = useState({ email: "", password: "" });
  const [accountMsg, setAccountMsg] = useState("");

  const fetchClinics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
      });
      if (query) params.set("search", query);
      if (city) params.set("city", city);
      if (minScore) params.set("min_score", minScore);
      const res = await fetch(`${API_URL}/api/clinics?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClinics(data.clinics ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, query, city, minScore]);

  useEffect(() => { fetchClinics(); }, [fetchClinics]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const openDetail = (c: Clinic) => {
    setDetail(c);
    setEditNote(c.custom_note ?? "");
  };

  const saveNote = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/admin/clinics/${detail.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_note: editNote }),
      });
      setDetail(null);
      fetchClinics();
    } finally {
      setSaving(false);
    }
  };

  const handleEnterPortal = (clinicId: string) => {
    const adminToken = localStorage.getItem("admin_token") || "authenticated";
    window.open(`/portal/${clinicId}?admin_bypass=${adminToken}`, "_blank");
  };

  const createAccount = async () => {
    if (!accountModal || !accountForm.email || !accountForm.password) return;
    setAccountMsg("");
    const token = localStorage.getItem("admin_token") || "";
    try {
      const res = await fetch(`${API_URL}/api/admin/cms/clinic-accounts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ clinic_id: accountModal.id, email: accountForm.email, password: accountForm.password }),
      });
      const d = await res.json();
      if (res.ok) {
        setAccountMsg("帳號建立成功！");
        setTimeout(() => { setAccountModal(null); setAccountMsg(""); setAccountForm({ email: "", password: "" }); }, 1500);
      } else {
        setAccountMsg(d.detail || "建立失敗");
      }
    } catch {
      setAccountMsg("連線失敗");
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
        全台診所資料管理
      </h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 20 }}>
        共 {total} 家診所
      </p>

      {/* 篩選列 */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { setQuery(search); setPage(1); } }}
          placeholder="搜尋診所名稱或地址"
          style={{ flex: 1, minWidth: 180, maxWidth: 280, padding: "9px 14px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, outline: "none" }}
        />
        <select
          value={city}
          onChange={(e) => { setCity(e.target.value); setPage(1); }}
          style={{ padding: "9px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, background: "#fff", cursor: "pointer" }}
        >
          <option value="">全部縣市</option>
          {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={minScore}
          onChange={(e) => { setMinScore(e.target.value); setPage(1); }}
          style={{ padding: "9px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, background: "#fff", cursor: "pointer" }}
        >
          <option value="">全部分數</option>
          <option value="30">總分 30+</option>
          <option value="25">總分 25+</option>
          <option value="20">總分 20+</option>
          <option value="15">總分 15+</option>
        </select>
        <button
          onClick={() => { setQuery(search); setPage(1); }}
          style={{ padding: "9px 20px", background: "#3B82F6", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, cursor: "pointer" }}
        >
          搜尋
        </button>
        <button
          onClick={async () => {
            if (!confirm("同步 Google 商家照片？\n• 每次處理 30 筆診所\n• 約 60 秒等待\n• 估計成本 $0.7-1 USD/次\n• 可重複觸發直到全部完成")) return;
            const r = await fetch(`${API_URL}/api/admin/clinics/sync-google-photos?batch_size=30`, { method: "POST" });
            const d = await r.json();
            alert(d.message || "完成");
            fetchClinics();
          }}
          style={{ padding: "9px 16px", background: "#7C3AED", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          📷 同步 Google 照片
        </button>
        {(query || city || minScore) && (
          <button
            onClick={() => { setSearch(""); setQuery(""); setCity(""); setMinScore(""); setPage(1); }}
            style={{ padding: "9px 14px", background: "#F1F5F9", border: "none", borderRadius: 8, color: "#475569", fontSize: 13, cursor: "pointer" }}
          >
            清除
          </button>
        )}
      </div>

      {/* 表格 */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: "#F8FAFC" }}>
            <tr>
              {["#","診所名稱","縣市","Google評分","司法案件","合法登記","稽查違規","媒體口碑","總分","操作"].map((h) => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#64748B", fontWeight: 600, borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ padding: 32, textAlign: "center", color: "#94A3B8" }}>載入中...</td></tr>
            ) : clinics.length === 0 ? (
              <tr><td colSpan={10} style={{ padding: 32, textAlign: "center", color: "#94A3B8" }}>沒有符合的診所</td></tr>
            ) : clinics.map((c, i) => {
              const sb = c.score_breakdown || {};
              const googleScore = c.google_rating_score ?? sb.google ?? null;
              const judicialScore = c.judicial_score ?? sb.judicial ?? null;
              const legalScore = c.legal_score ?? sb.legal ?? null;
              const tot = calcTotal(c);
              return (
                <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "10px 14px", color: "#94A3B8" }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <button
                      onClick={() => openDetail(c)}
                      style={{ background: "none", border: "none", color: "#1D4ED8", fontWeight: 600, fontSize: 13, cursor: "pointer", textAlign: "left", padding: 0 }}
                    >
                      {c.name}
                    </button>
                  </td>
                  <td style={{ padding: "10px 14px", color: "#475569" }}>{cityFromAddress(c.address)}</td>
                  <td style={{ padding: "10px 14px" }}><ScoreTag score={googleScore} /></td>
                  <td style={{ padding: "10px 14px" }}><ScoreTag score={judicialScore} /></td>
                  <td style={{ padding: "10px 14px" }}><ScoreTag score={legalScore} /></td>
                  <td style={{ padding: "10px 14px" }}><ScoreTag score={sb.penalty ?? null} /></td>
                  <td style={{ padding: "10px 14px" }}><ScoreTag score={sb.media ?? null} /></td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontWeight: 700, color: tot >= 30 ? "#16A34A" : tot >= 20 ? "#D97706" : "#DC2626" }}>
                      {tot.toFixed(0)}分
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <a href={`/clinics/${c.id}`} target="_blank" rel="noopener noreferrer"
                        style={{ padding: "4px 10px", background: "#EFF6FF", color: "#3B82F6", borderRadius: 6, fontSize: 12, textDecoration: "none", fontWeight: 500 }}>
                        前台
                      </a>
                      <button onClick={() => openDetail(c)}
                        style={{ padding: "4px 10px", background: "#F0FDF4", color: "#16A34A", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                        詳細
                      </button>
                      {c.has_account ? (
                        <button onClick={() => handleEnterPortal(c.id)}
                          style={{ padding: "4px 10px", background: "#F5F3FF", color: "#7C3AED", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                          進入後台 →
                        </button>
                      ) : (
                        <button onClick={() => { setAccountModal(c); setAccountForm({ email: "", password: "" }); setAccountMsg(""); }}
                          style={{ padding: "4px 10px", background: "#FEF3C7", color: "#D97706", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                          建立帳號
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 分頁 */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            style={{ padding: "6px 16px", background: page <= 1 ? "#F1F5F9" : "#fff", border: "1px solid #E2E8F0", borderRadius: 8, cursor: page <= 1 ? "not-allowed" : "pointer", color: page <= 1 ? "#94A3B8" : "#475569", fontSize: 13 }}>
            上一頁
          </button>
          <span style={{ display: "flex", alignItems: "center", fontSize: 13, color: "#475569" }}>
            第 {page} / {totalPages} 頁
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
            style={{ padding: "6px 16px", background: page >= totalPages ? "#F1F5F9" : "#fff", border: "1px solid #E2E8F0", borderRadius: 8, cursor: page >= totalPages ? "not-allowed" : "pointer", color: page >= totalPages ? "#94A3B8" : "#475569", fontSize: 13 }}>
            下一頁
          </button>
        </div>
      )}

      {/* 詳細頁 Modal */}
      {detail && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
          onClick={(e) => e.target === e.currentTarget && setDetail(null)}
        >
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 520, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0 }}>{detail.name}</h2>
                <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>{detail.address || "—"}</p>
                {detail.phone && <p style={{ fontSize: 13, color: "#64748B", margin: "2px 0 0" }}>📞 {detail.phone}</p>}
              </div>
              <button onClick={() => setDetail(null)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94A3B8" }}>✕</button>
            </div>

            {/* 各維度分數 */}
            <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 12 }}>各維度分數</p>
              {([
                ["⭐ Google 評分", detail.google_rating_score ?? detail.score_breakdown?.google],
                ["⚖️ 司法案件", detail.judicial_score ?? detail.score_breakdown?.judicial],
                ["🏛️ 合法登記", detail.legal_score ?? detail.score_breakdown?.legal],
                ["⚠️ 稽查違規", detail.score_breakdown?.penalty],
                ["📰 媒體口碑", detail.score_breakdown?.media],
              ] as [string, number | undefined][]).map(([label, score]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #E2E8F0" }}>
                  <span style={{ fontSize: 13, color: "#475569" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: score != null ? (score >= 7 ? "#16A34A" : score >= 4 ? "#D97706" : "#DC2626") : "#94A3B8" }}>
                    {score != null ? `${score}分` : "待補"}
                  </span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>總分</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1D4ED8" }}>{calcTotal(detail).toFixed(0)}分</span>
              </div>
            </div>

            {/* 備註 */}
            <label style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: 500 }}>管理備註</label>
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              rows={3}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box", outline: "none" }}
              placeholder="內部備註（不對外顯示）"
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 16 }}>
              <a href={`/clinics/${detail.id}`} target="_blank" rel="noopener noreferrer"
                style={{ padding: "9px 18px", background: "#EFF6FF", color: "#3B82F6", borderRadius: 8, fontSize: 13, textDecoration: "none", fontWeight: 500 }}>
                查看前台頁面 →
              </a>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setDetail(null)}
                  style={{ padding: "9px 16px", background: "#F1F5F9", border: "none", borderRadius: 8, color: "#475569", fontSize: 13, cursor: "pointer" }}>
                  取消
                </button>
                <button onClick={saveNote} disabled={saving}
                  style={{ padding: "9px 20px", background: "#3B82F6", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "儲存中..." : "儲存備註"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 建立後台帳號 Modal */}
      {accountModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>建立後台帳號</h3>
              <button onClick={() => setAccountModal(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94A3B8" }}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>為「{accountModal.name}」建立診所後台登入帳號</p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Email *</label>
              <input
                type="email"
                required
                value={accountForm.email}
                onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                placeholder="clinic@example.com"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>密碼 *</label>
              <input
                type="text"
                required
                value={accountForm.password}
                onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                placeholder="至少8碼"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
              />
            </div>
            {accountMsg && (
              <p style={{ fontSize: 13, color: accountMsg.includes("成功") ? "#10B981" : "#EF4444", marginBottom: 12 }}>{accountMsg}</p>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setAccountModal(null)} style={{ padding: "9px 16px", background: "#F1F5F9", border: "none", borderRadius: 8, color: "#475569", fontSize: 13, cursor: "pointer" }}>取消</button>
              <button onClick={createAccount} style={{ padding: "9px 20px", background: "#F59E0B", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>建立帳號</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
