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

const API = process.env.NEXT_PUBLIC_API_URL || "";
const STATUS_LABEL: Record<string, string> = { pending: "待審核", approved: "已通過", rejected: "已退回" };
const STATUS_COLOR: Record<string, string> = { pending: "#ED8936", approved: "#38A169", rejected: "#E53E3E" };
const STATUS_BG: Record<string, string> = { pending: "#FFF5E6", approved: "#F0FFF4", rejected: "#FFF5F5" };
const TYPE_LABEL: Record<string, string> = { promotion: "優惠方案", treatment: "療程項目", doctor: "醫師資料", gallery: "Gallery" };
const DEFAULT_BANNED = ["保證", "絕對", "100%", "最好", "第一", "神奇", "永久", "完全根治"];

export default function CmsPage() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("");
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannedWords, setBannedWords] = useState<string[]>(DEFAULT_BANNED);
  const [newWord, setNewWord] = useState("");
  const [savingNote, setSavingNote] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<number, string>>({});
  const [showBanned, setShowBanned] = useState(false);
  const [rejectModalId, setRejectModalId] = useState<number | null>(null);

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
    fetch(`${API}/api/admin/cms/banned-words`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.words?.length) setBannedWords(d.words); })
      .catch(() => {});
  }, [token]);

  async function approve(id: number) {
    setSavingNote(id);
    await fetch(`${API}/api/admin/cms/reviews/${id}/approve`, { method: "POST", headers });
    setSavingNote(null);
    loadReviews();
  }

  async function reject(id: number) {
    setSavingNote(id);
    await fetch(`${API}/api/admin/cms/reviews/${id}/reject`, {
      method: "POST", headers,
      body: JSON.stringify({ note: rejectNote[id] || "" }),
    });
    setSavingNote(null);
    setRejectModalId(null);
    loadReviews();
  }

  async function addBannedWord() {
    if (!newWord.trim()) return;
    const updated = [...bannedWords, newWord.trim()];
    await fetch(`${API}/api/admin/cms/banned-words`, { method: "PUT", headers, body: JSON.stringify({ words: updated }) });
    setBannedWords(updated);
    setNewWord("");
  }

  async function removeBannedWord(w: string) {
    const updated = bannedWords.filter((x) => x !== w);
    await fetch(`${API}/api/admin/cms/banned-words`, { method: "PUT", headers, body: JSON.stringify({ words: updated }) });
    setBannedWords(updated);
  }

  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <div>
      {/* Status tabs + type filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
              background: statusFilter === s ? STATUS_COLOR[s] : "#fff",
              color: statusFilter === s ? "#fff" : "#4A5568",
              fontWeight: statusFilter === s ? 600 : 400,
              boxShadow: "0 1px 3px rgba(0,0,0,.06)",
            }}
          >
            {STATUS_LABEL[s]}
            {s === "pending" && pendingCount > 0 && (
              <span style={{ marginLeft: 6, background: "#fff", color: "#ED8936", borderRadius: 99, padding: "1px 6px", fontSize: 10 }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, color: "#4A5568", background: "#fff" }}
        >
          <option value="">全部類型</option>
          <option value="promotion">優惠方案</option>
          <option value="treatment">療程項目</option>
          <option value="doctor">醫師資料</option>
          <option value="gallery">Gallery</option>
        </select>
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={() => setShowBanned(!showBanned)}
            style={{ padding: "7px 14px", background: showBanned ? "#1A202C" : "#fff", color: showBanned ? "#fff" : "#4A5568", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, cursor: "pointer" }}
          >
            🚫 禁用詞管理
          </button>
        </div>
      </div>

      {/* Banned words panel */}
      {showBanned && (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", marginBottom: 10 }}>醫療廣告禁用詞</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input
              value={newWord} onChange={(e) => setNewWord(e.target.value)}
              placeholder="新增禁用詞..." onKeyDown={(e) => e.key === "Enter" && addBannedWord()}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13 }}
            />
            <button onClick={addBannedWord} style={{ padding: "8px 16px", background: "#2B6CB0", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              + 新增禁用詞
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {bannedWords.map((w) => (
              <span key={w} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FFF5F5", border: "1px solid #FED7D7", borderRadius: 6, padding: "4px 10px", fontSize: 13, color: "#E53E3E" }}>
                {w}
                <button onClick={() => removeBannedWord(w)} style={{ background: "none", border: "none", cursor: "pointer", color: "#E53E3E", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 32, textAlign: "center", color: "#A0AEC0" }}>載入中...</div>
      ) : items.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 32, textAlign: "center", color: "#A0AEC0" }}>
          目前沒有{STATUS_LABEL[statusFilter]}的內容
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item) => (
            <div key={item.id} style={{
              background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 18,
              borderLeft: `3px solid ${item.violations.length > 0 ? "#E53E3E" : "#E2E8F0"}`,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, background: "#EBF8FF", color: "#2B6CB0", borderRadius: 4, padding: "2px 7px", fontWeight: 600 }}>
                    {TYPE_LABEL[item.content_type] || item.content_type}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1A202C" }}>{item.title}</span>
                  {item.clinic_name && <span style={{ fontSize: 12, color: "#A0AEC0" }}>— {item.clinic_name}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {item.violations.length > 0 ? (
                    <span style={{ fontSize: 11, fontWeight: 700, background: "#FFF5F5", color: "#E53E3E", borderRadius: 4, padding: "2px 8px" }}>⚠️ 含禁用詞</span>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, background: "#F0FFF4", color: "#38A169", borderRadius: 4, padding: "2px 8px" }}>✅ 通過</span>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 700, background: STATUS_BG[item.status], color: STATUS_COLOR[item.status], borderRadius: 99, padding: "2px 10px" }}>
                    {STATUS_LABEL[item.status]}
                  </span>
                </div>
              </div>

              {item.preview && (
                <p style={{ fontSize: 13, color: "#4A5568", marginBottom: 8, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {item.preview}
                </p>
              )}

              {item.violations.length > 0 && (
                <div style={{ background: "#FFF5F5", borderRadius: 6, padding: "8px 12px", marginBottom: 8 }}>
                  {item.violations.map((v, i) => (
                    <p key={i} style={{ fontSize: 12, color: "#E53E3E", margin: "2px 0" }}>・{v}</p>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "#A0AEC0" }}>{new Date(item.created_at).toLocaleString("zh-TW")}</span>
                {item.status === "pending" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => approve(item.id)}
                      disabled={savingNote === item.id}
                      style={{ padding: "6px 18px", background: "#38A169", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: savingNote === item.id ? 0.6 : 1 }}
                    >
                      通過
                    </button>
                    <button
                      onClick={() => setRejectModalId(item.id)}
                      style={{ padding: "6px 18px", background: "#E53E3E", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                    >
                      退回
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectModalId != null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1A202C", marginBottom: 12 }}>退回原因</h3>
            <textarea
              rows={3} value={rejectNote[rejectModalId] || ""}
              onChange={(e) => setRejectNote({ ...rejectNote, [rejectModalId]: e.target.value })}
              placeholder="請輸入退回原因（將顯示給診所端）"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, resize: "none" }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
              <button onClick={() => setRejectModalId(null)} style={{ padding: "9px 18px", background: "#F7FAFC", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>取消</button>
              <button
                onClick={() => reject(rejectModalId)}
                disabled={savingNote === rejectModalId}
                style={{ padding: "9px 20px", background: "#E53E3E", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                確認退回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
