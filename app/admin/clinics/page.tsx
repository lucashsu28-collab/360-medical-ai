"use client";

import { useEffect, useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const PAGE_SIZE = 20;

interface Clinic {
  id: string;
  name: string;
  address?: string;
  google_rating?: number | null;
  score_breakdown?: { judicial?: number; legal?: number };
  dispute_count?: number;
  legal_score?: number;
  custom_note?: string;
}

interface EditModal {
  clinic: Clinic;
  note: string;
  saving: boolean;
}

export default function AdminClinicsPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<EditModal | null>(null);

  const fetchClinics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        ...(query ? { search: query } : {}),
      });
      const res = await fetch(`${API_URL}/api/clinics?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClinics(data.clinics ?? []);
        setTotal(data.total ?? data.clinics?.length ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const cityFromAddress = (addr?: string) => {
    if (!addr) return "—";
    const m = addr.match(/^(.*?[市縣])/);
    return m ? m[1] : addr.slice(0, 3);
  };

  const openEdit = (clinic: Clinic) => {
    setModal({ clinic, note: clinic.custom_note ?? "", saving: false });
  };

  const saveNote = async () => {
    if (!modal) return;
    setModal((m) => m && { ...m, saving: true });
    try {
      await fetch(`${API_URL}/api/admin/clinics/${modal.clinic.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_note: modal.note }),
      });
      setModal(null);
      fetchClinics();
    } catch {
      setModal((m) => m && { ...m, saving: false });
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>
        診所資料管理
      </h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 20 }}>
        共 {total} 家診所
      </p>

      {/* 搜尋 */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setQuery(search);
              setPage(1);
            }
          }}
          placeholder="搜尋診所名稱或地址"
          style={{
            flex: 1,
            maxWidth: 360,
            padding: "9px 14px",
            border: "1px solid #E2E8F0",
            borderRadius: 8,
            fontSize: 14,
            outline: "none",
            background: "#fff",
          }}
        />
        <button
          onClick={() => { setQuery(search); setPage(1); }}
          style={{
            padding: "9px 20px",
            background: "#3B82F6",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          搜尋
        </button>
        {query && (
          <button
            onClick={() => { setSearch(""); setQuery(""); setPage(1); }}
            style={{
              padding: "9px 14px",
              background: "#F1F5F9",
              border: "none",
              borderRadius: 8,
              color: "#475569",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            清除
          </button>
        )}
      </div>

      {/* 表格 */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: "#F8FAFC" }}>
            <tr>
              {["#", "診所名稱", "縣市", "Google評分", "司法案件", "合法登記", "操作"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 14px",
                    textAlign: "left",
                    color: "#64748B",
                    fontWeight: 600,
                    borderBottom: "1px solid #E2E8F0",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#94A3B8" }}>
                  載入中…
                </td>
              </tr>
            ) : clinics.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#94A3B8" }}>
                  找不到診所
                </td>
              </tr>
            ) : (
              clinics.map((c, i) => {
                const judicialScore = c.score_breakdown?.judicial ?? null;
                const legalScore = c.score_breakdown?.legal ?? c.legal_score ?? null;
                return (
                  <tr
                    key={c.id}
                    style={{ borderBottom: "1px solid #F1F5F9" }}
                  >
                    <td style={{ padding: "10px 14px", color: "#94A3B8" }}>
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#0F172A", fontWeight: 500 }}>
                      {c.name}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#475569" }}>
                      {cityFromAddress(c.address)}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#475569" }}>
                      {c.google_rating != null ? `⭐ ${c.google_rating}` : "—"}
                    </td>
                    <td style={{ padding: "10px 14px", color: judicialScore != null && judicialScore < 7 ? "#EF4444" : "#475569" }}>
                      {judicialScore != null ? `${judicialScore}分` : "—"}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#475569" }}>
                      {legalScore != null ? `${legalScore}分` : "—"}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <a
                          href={`/clinics/${c.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: "4px 10px",
                            background: "#EFF6FF",
                            color: "#3B82F6",
                            borderRadius: 6,
                            fontSize: 12,
                            textDecoration: "none",
                            fontWeight: 500,
                          }}
                        >
                          查看
                        </a>
                        <button
                          onClick={() => openEdit(c)}
                          style={{
                            padding: "4px 10px",
                            background: "#F0FDF4",
                            color: "#16A34A",
                            border: "none",
                            borderRadius: 6,
                            fontSize: 12,
                            cursor: "pointer",
                            fontWeight: 500,
                          }}
                        >
                          編輯
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 分頁 */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            style={{
              padding: "6px 16px",
              background: page <= 1 ? "#F1F5F9" : "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              cursor: page <= 1 ? "not-allowed" : "pointer",
              color: page <= 1 ? "#94A3B8" : "#475569",
              fontSize: 13,
            }}
          >
            上一頁
          </button>
          <span style={{ display: "flex", alignItems: "center", fontSize: 13, color: "#475569" }}>
            第 {page} / {totalPages} 頁
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{
              padding: "6px 16px",
              background: page >= totalPages ? "#F1F5F9" : "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              cursor: page >= totalPages ? "not-allowed" : "pointer",
              color: page >= totalPages ? "#94A3B8" : "#475569",
              fontSize: 13,
            }}
          >
            下一頁
          </button>
        </div>
      )}

      {/* 編輯 Modal */}
      {modal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 28,
              width: 440,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
              編輯診所備註
            </h3>
            <p style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>
              {modal.clinic.name}
            </p>
            <label style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 6 }}>
              custom_note
            </label>
            <textarea
              value={modal.note}
              onChange={(e) => setModal((m) => m && { ...m, note: e.target.value })}
              rows={4}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                fontSize: 13,
                resize: "vertical",
                boxSizing: "border-box",
                outline: "none",
              }}
              placeholder="填入備註（內部管理用）"
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button
                onClick={() => setModal(null)}
                style={{
                  padding: "8px 16px",
                  background: "#F1F5F9",
                  border: "none",
                  borderRadius: 8,
                  color: "#475569",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                取消
              </button>
              <button
                onClick={saveNote}
                disabled={modal.saving}
                style={{
                  padding: "8px 20px",
                  background: "#3B82F6",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: modal.saving ? "not-allowed" : "pointer",
                }}
              >
                {modal.saving ? "儲存中…" : "儲存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
