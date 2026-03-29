"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface Doctor { name: string; area: string; doc_seq: string; }
interface DoctorDetail {
  人員姓名: string; 性別: string; 執業縣市: string;
  主要執業科別: string; 主要執登類別: string; 證書類別: string; 專科資格: string;
}

const DETAIL_KEYS: (keyof DoctorDetail)[] = [
  "人員姓名", "性別", "執業縣市", "主要執業科別", "主要執登類別", "證書類別", "專科資格",
];

export default function DoctorsPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [expandedDocSeq, setExpandedDocSeq] = useState<string | null>(null);
  const [detail, setDetail] = useState<DoctorDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [liffUserId, setLiffUserId] = useState<string | null>(null);
  const autoUnlockDone = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const liffId = params.get("liff_user_id");
    if (liffId) { setLiffUserId(liffId); return; }
    const initLiff = async () => {
      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setLiffUserId(profile.userId);
        }
      } catch (e) { console.log("LIFF init failed:", e); }
    };
    initLiff();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const autoUnlock = params.get("auto_unlock");
    if (autoUnlock && liffUserId && !autoUnlockDone.current) {
      autoUnlockDone.current = true;
      unlockDoctorReport(autoUnlock);
    }
  }, [liffUserId]);

  const unlockDoctorReport = async (doc_seq: string) => {
    if (liffUserId) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/send-doctor-report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: liffUserId, doc_seq }),
        });
        if (res.ok) alert("報告已傳送到您的 LINE！");
        else alert("傳送失敗，請稍後再試");
      } catch { alert("傳送失敗，請稍後再試"); }
      return;
    }
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "2009360724-7DzjBKHU";
    const lineUrl = `https://liff.line.me/${liffId}?page=doctors&auto_unlock=${encodeURIComponent(doc_seq)}`;
    const confirmed = window.confirm("請從 LINE 開啟此頁面才能解鎖報告\n\n點確定前往 LINE 開啟");
    if (confirmed) window.location.href = lineUrl;
  };

  const search = useCallback(async () => {
    const name = query.trim();
    if (!name) { setDoctors([]); setExpandedDocSeq(null); setDetail(null); return; }
    setError(null); setLoading(true); setExpandedDocSeq(null); setDetail(null);
    try {
      const res = await fetch(`${API_URL}/api/doctors?name=${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error("搜尋失敗");
      const data = await res.json();
      setDoctors(data.doctors ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "搜尋失敗");
      setDoctors([]);
    } finally { setLoading(false); }
  }, [query]);

  const toggleDetail = useCallback(async (docSeq: string) => {
    if (expandedDocSeq === docSeq) { setExpandedDocSeq(null); setDetail(null); return; }
    setExpandedDocSeq(docSeq); setDetail(null); setDetailLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/doctors/detail?doc_seq=${encodeURIComponent(docSeq)}`);
      if (!res.ok) throw new Error("取得詳細資料失敗");
      const data = await res.json();
      setDetail(data.doctor ?? {});
    } catch {
      setDetail({ 人員姓名: "—", 性別: "—", 執業縣市: "—", 主要執業科別: "—", 主要執登類別: "—", 證書類別: "—", 專科資格: "—" });
    } finally { setDetailLoading(false); }
  }, [expandedDocSeq]);

  return (
    <div style={{ background: "#FAFAF8", minHeight: "100vh" }}>
      {/* Hero + Search */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "32px 24px 28px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EBF8FF", border: "1px solid #BEE3F8", borderRadius: 20, padding: "3px 12px", marginBottom: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2B6CB0", display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#2B6CB0" }}>衛福部醫事人員查詢</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1A202C", margin: "0 0 8px" }}>醫師查詢</h1>
        <p style={{ fontSize: 13, color: "#718096", margin: "0 0 20px" }}>輸入醫師姓名，查詢執業縣市、科別、證書類別</p>
        <div style={{ maxWidth: 500, margin: "0 auto", display: "flex", gap: 8 }}>
          <input
            type="text" value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="輸入醫師姓名…"
            style={{ flex: 1, padding: "10px 16px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, outline: "none" }}
          />
          <button
            type="button" onClick={search} disabled={loading}
            style={{ padding: "10px 22px", background: "#2B6CB0", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "搜尋中…" : "搜尋"}
          </button>
        </div>
      </div>

      {/* Results */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px" }}>
        {error && <p style={{ fontSize: 13, color: "#E53E3E", marginBottom: 12 }}>{error}</p>}
        {doctors.length > 0 && (
          <p style={{ fontSize: 13, color: "#718096", marginBottom: 14 }}>
            共找到 <strong style={{ color: "#1A202C" }}>{doctors.length}</strong> 筆
          </p>
        )}
        {!loading && query.trim() && doctors.length === 0 && !error && (
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "48px 24px", textAlign: "center", color: "#718096" }}>
            查無符合的醫師，請試試其他關鍵字。
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {!loading && doctors.map((d) => (
            <div key={d.doc_seq} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 42, height: 42, flexShrink: 0, borderRadius: "50%", background: "#EBF8FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                    👤
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1A202C" }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: "#718096" }}>{d.area}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => toggleDetail(d.doc_seq)}
                    style={{ padding: "7px 16px", border: "1px solid #E2E8F0", borderRadius: 7, background: "#F7FAFC", color: "#4A5568", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                  >
                    {expandedDocSeq === d.doc_seq ? "收合詳細" : "查看詳細"}
                  </button>
                  <button
                    type="button"
                    onClick={() => unlockDoctorReport(d.doc_seq)}
                    style={{ padding: "7px 16px", border: "none", borderRadius: 7, background: "#2B6CB0", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                  >
                    解鎖報告
                  </button>
                </div>
              </div>
              {expandedDocSeq === d.doc_seq && (
                <div style={{ borderTop: "1px solid #E2E8F0", background: "#F7FAFC", padding: "16px 20px" }}>
                  {detailLoading ? (
                    <p style={{ fontSize: 13, color: "#718096" }}>載入中…</p>
                  ) : detail ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                      {DETAIL_KEYS.map((key) => (
                        <div key={key} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px" }}>
                          <div style={{ fontSize: 11, color: "#A0AEC0", marginBottom: 3 }}>{key}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1A202C" }}>{detail[key] ?? "—"}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
