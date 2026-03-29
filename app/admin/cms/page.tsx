"use client";
import { useEffect, useState, useCallback } from "react";

interface ReviewItem {
  id: number;
  clinic_id: string;
  clinic_name?: string;
  content_type: "promotion" | "treatment" | "doctor" | "gallery";
  title: string;
  preview?: string;
  status: "pending" | "approved" | "rejected";
  violations: string[];
  reviewer_note?: string;
  created_at: string;
}

interface BannedWords {
  words: string[];
}

const API = process.env.NEXT_PUBLIC_API_URL || "";
const STATUS_LABEL: Record<string, string> = {
  pending: "待審核",
  approved: "已通過",
  rejected: "已拒絕",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "#F59E0B",
  approved: "#10B981",
  rejected: "#EF4444",
};

export default function CmsPage() {
  const [tab, setTab] = useState<"reviews" | "banned">("reviews");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("");
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState("");
  const [savingNote, setSavingNote] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<number, string>>({});

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || "" : "";
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const loadReviews = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);
    fetch(`${API}/api/admin/cms/reviews?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [statusFilter, typeFilter, token]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  useEffect(() => {
    if (tab === "banned") {
      fetch(`${API}/api/admin/cms/banned-words`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d: BannedWords) => setBannedWords(d.words ?? []))
        .catch(() => {});
    }
  }, [tab, token]);

  async function approve(id: number) {
    setSavingNote(id);
    await fetch(`${API}/api/admin/cms/reviews/${id}/approve`, { method: "POST", headers });
    setSavingNote(null);
    loadReviews();
  }

  async function reject(id: number) {
    setSavingNote(id);
    await fetch(`${API}/api/admin/cms/reviews/${id}/reject`, {
      method: "POST",
      headers,
      body: JSON.stringify({ note: rejectNote[id] || "" }),
    });
    setSavingNote(null);
    loadReviews();
  }

  async function addBannedWord() {
    if (!newWord.trim()) return;
    const updated = [...bannedWords, newWord.trim()];
    await fetch(`${API}/api/admin/cms/banned-words`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ words: updated }),
    });
    setBannedWords(updated);
    setNewWord("");
  }

  async function removeBannedWord(w: string) {
    const updated = bannedWords.filter((x) => x !== w);
    await fetch(`${API}/api/admin/cms/banned-words`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ words: updated }),
    });
    setBannedWords(updated);
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>CMS 審核流程</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 20 }}>審核診所後台上傳的內容，確保符合醫療廣告法規</p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid #E2E8F0" }}>
        {(["reviews", "banned"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "10px 24px", background: "transparent", border: "none", borderBottom: `2px solid ${tab === t ? "#3B82F6" : "transparent"}`, color: tab === t ? "#3B82F6" : "#64748B", fontSize: 14, fontWeight: tab === t ? 600 : 400, cursor: "pointer", marginBottom: -2 }}>
            {t === "reviews" ? "內容審核" : "禁用詞管理"}
          </button>
        ))}
      </div>

      {tab === "reviews" && (
        <>
          {/* Filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {["", "pending", "approved", "rejected"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid", borderColor: statusFilter === s ? "#3B82F6" : "#E2E8F0", background: statusFilter === s ? "#EFF6FF" : "#fff", color: statusFilter === s ? "#3B82F6" : "#64748B", fontSize: 13, cursor: "pointer" }}>
                {s === "" ? "全部" : STATUS_LABEL[s]}
              </button>
            ))}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, color: "#374151", background: "#fff" }}
            >
              <option value="">全部類型</option>
              <option value="promotion">優惠方案</option>
              <option value="treatment">療程項目</option>
              <option value="doctor">醫師資料</option>
              <option value="gallery">Gallery</option>
            </select>
          </div>

          {loading ? (
            <p style={{ color: "#94A3B8", fontSize: 13 }}>載入中...</p>
          ) : items.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 12, padding: 32, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
              目前沒有{statusFilter ? STATUS_LABEL[statusFilter] : ""}的內容
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {items.map((item) => (
                <div key={item.id} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,.06)", borderLeft: `3px solid ${item.violations.length > 0 ? "#EF4444" : "#E2E8F0"}` }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 11, background: "#F1F5F9", borderRadius: 4, padding: "2px 6px", color: "#64748B", marginRight: 8 }}>
                        {item.content_type}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{item.title}</span>
                      {item.clinic_name && (
                        <span style={{ fontSize: 12, color: "#94A3B8", marginLeft: 8 }}>— {item.clinic_name}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLOR[item.status], whiteSpace: "nowrap" }}>
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>

                  {item.preview && (
                    <p style={{ fontSize: 13, color: "#475569", marginBottom: 8, lineHeight: 1.5 }}>{item.preview}</p>
                  )}

                  {item.violations.length > 0 && (
                    <div style={{ background: "#FEF2F2", borderRadius: 6, padding: "8px 12px", marginBottom: 8 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#DC2626", marginBottom: 4 }}>⚠️ 合規警告</p>
                      {item.violations.map((v, i) => (
                        <p key={i} style={{ fontSize: 12, color: "#DC2626", margin: "2px 0" }}>・{v}</p>
                      ))}
                    </div>
                  )}

                  {item.reviewer_note && (
                    <p style={{ fontSize: 12, color: "#EF4444", marginBottom: 8 }}>拒絕原因：{item.reviewer_note}</p>
                  )}

                  <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12 }}>{new Date(item.created_at).toLocaleString("zh-TW")}</p>

                  {item.status === "pending" && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <button
                        onClick={() => approve(item.id)}
                        disabled={savingNote === item.id}
                        style={{ padding: "6px 16px", background: "#10B981", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: savingNote === item.id ? 0.5 : 1 }}
                      >
                        通過
                      </button>
                      <input
                        placeholder="拒絕原因（可選）"
                        value={rejectNote[item.id] || ""}
                        onChange={(e) => setRejectNote({ ...rejectNote, [item.id]: e.target.value })}
                        style={{ flex: 1, minWidth: 160, padding: "6px 10px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13 }}
                      />
                      <button
                        onClick={() => reject(item.id)}
                        disabled={savingNote === item.id}
                        style={{ padding: "6px 16px", background: "#EF4444", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: savingNote === item.id ? 0.5 : 1 }}
                      >
                        拒絕
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "banned" && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 8 }}>醫療廣告禁用詞</h3>
          <p style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>系統將自動標記包含以下詞彙的內容（來自衛福部醫療廣告管理規範）</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="新增禁用詞..."
              onKeyDown={(e) => e.key === "Enter" && addBannedWord()}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13 }}
            />
            <button onClick={addBannedWord} style={{ padding: "8px 16px", background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              新增
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {bannedWords.map((w) => (
              <span key={w} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, padding: "4px 10px", fontSize: 13, color: "#DC2626" }}>
                {w}
                <button onClick={() => removeBannedWord(w)} style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
              </span>
            ))}
            {bannedWords.length === 0 && <p style={{ fontSize: 13, color: "#94A3B8" }}>尚未設定禁用詞</p>}
          </div>
        </div>
      )}
    </div>
  );
}
