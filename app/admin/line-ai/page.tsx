"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

type Tab = "broadcasts" | "send";

interface BroadcastRecord {
  id: string;
  sent_at: string;
  user_id: string;
  message_type: string;
  target_name: string;
  status: "success" | "failed";
}

interface ClinicOption {
  id: string;
  name: string;
}

type SendType = "clinic" | "doctor" | "custom";

export default function AdminLineAIPage() {
  const [tab, setTab] = useState<Tab>("broadcasts");

  // Tab1 state
  const [broadcasts, setBroadcasts] = useState<BroadcastRecord[]>([]);
  const [bLoading, setBLoading] = useState(false);

  // Tab2 state
  const [clinicOptions, setClinicOptions] = useState<ClinicOption[]>([]);
  const [sendUserId, setSendUserId] = useState("");
  const [sendClinicId, setSendClinicId] = useState("");
  const [sendType, setSendType] = useState<SendType>("clinic");
  const [customText, setCustomText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (tab === "broadcasts") {
      setBLoading(true);
      fetch(`${API_URL}/api/admin/broadcasts`)
        .then((r) => (r.ok ? r.json() : { broadcasts: [] }))
        .then((d) => setBroadcasts(d.broadcasts ?? []))
        .finally(() => setBLoading(false));
    }
    if (tab === "send" && clinicOptions.length === 0) {
      fetch(`${API_URL}/api/clinics?limit=50`)
        .then((r) => (r.ok ? r.json() : { clinics: [] }))
        .then((d) => setClinicOptions(d.clinics ?? []));
    }
  }, [tab, clinicOptions.length]);

  const handleSend = async () => {
    if (!sendUserId.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      const body: Record<string, string> = {
        user_id: sendUserId,
        message_type: sendType,
      };
      if (sendType !== "custom") body.clinic_id = sendClinicId;
      if (sendType === "custom") body.text = customText;

      const res = await fetch(`${API_URL}/api/admin/send-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSendResult({ ok: true, msg: "發送成功！" });
        setSendUserId("");
        setSendClinicId("");
        setCustomText("");
      } else {
        const d = await res.json().catch(() => ({}));
        setSendResult({ ok: false, msg: d.detail ?? "發送失敗" });
      }
    } catch {
      setSendResult({ ok: false, msg: "網路錯誤，請稍後再試" });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (t: string) => {
    try {
      return new Date(t).toLocaleString("zh-TW", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return t;
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>
        LINE OA 管理
      </h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 20 }}>
        推播記錄查詢與手動測試發送（AI顧問對話記錄於 Phase 2 開放）
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid #E2E8F0" }}>
        {([["broadcasts", "推播記錄"], ["send", "手動發送"]] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 24px",
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${tab === t ? "#3B82F6" : "transparent"}`,
              color: tab === t ? "#3B82F6" : "#64748B",
              fontSize: 14,
              fontWeight: tab === t ? 600 : 400,
              cursor: "pointer",
              marginBottom: -2,
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab 1: 推播記錄 */}
      {tab === "broadcasts" && (
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
                {["發送時間", "User ID", "訊息類型", "診所名稱", "狀態"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      color: "#64748B",
                      fontWeight: 600,
                      borderBottom: "1px solid #E2E8F0",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>
                    載入中…
                  </td>
                </tr>
              ) : broadcasts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>
                    尚無推播記錄
                  </td>
                </tr>
              ) : (
                broadcasts.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "11px 16px", color: "#475569" }}>
                      {formatTime(b.sent_at)}
                    </td>
                    <td style={{ padding: "11px 16px", color: "#475569", fontFamily: "monospace", fontSize: 12 }}>
                      {b.user_id.slice(0, 8)}****
                    </td>
                    <td style={{ padding: "11px 16px", color: "#475569" }}>{b.message_type}</td>
                    <td style={{ padding: "11px 16px", color: "#0F172A", fontWeight: 500 }}>
                      {b.target_name}
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <span
                        style={{
                          background: b.status === "success" ? "#F0FDF4" : "#FEF2F2",
                          color: b.status === "success" ? "#16A34A" : "#DC2626",
                          padding: "3px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {b.status === "success" ? "成功" : "失敗"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: 手動發送 */}
      {tab === "send" && (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 28,
            maxWidth: 500,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ background: "#EFF6FF", borderRadius: 8, padding: "10px 14px", marginBottom: 18, fontSize: 13, color: "#1D4ED8" }}>
            💡 此功能由「360醫美AI智能顧問」LINE官方帳號，主動推播訊息給指定用戶。
            例如：將某診所評鑑報告推播給已加入的用戶。
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: 500 }}>
              LINE User ID
            </label>
            <input
              type="text"
              value={sendUserId}
              onChange={(e) => setSendUserId(e.target.value)}
              placeholder="U1234567890abcdef…"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "monospace",
              }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: 500 }}>
              訊息類型
            </label>
            <select
              value={sendType}
              onChange={(e) => setSendType(e.target.value as SendType)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                fontSize: 13,
                outline: "none",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              <option value="clinic">診所報告</option>
              <option value="doctor">醫師報告</option>
              <option value="custom">自訂文字</option>
            </select>
          </div>

          {sendType !== "custom" && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: 500 }}>
                推播哪家診所的報告
              </label>
              <select
                value={sendClinicId}
                onChange={(e) => setSendClinicId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <option value="">— 選擇診所 —</option>
                {clinicOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {sendType === "custom" && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: 500 }}>
                自訂訊息文字
              </label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={4}
                placeholder="輸入要發送的訊息…"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  fontSize: 13,
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {sendResult && (
            <div
              style={{
                padding: "10px 14px",
                background: sendResult.ok ? "#F0FDF4" : "#FEF2F2",
                color: sendResult.ok ? "#16A34A" : "#DC2626",
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {sendResult.msg}
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={sending || !sendUserId.trim()}
            style={{
              padding: "11px 28px",
              background: sendUserId.trim() ? "#3B82F6" : "#CBD5E1",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: sendUserId.trim() ? "pointer" : "not-allowed",
            }}
          >
            {sending ? "發送中…" : "發送"}
          </button>
        </div>
      )}
    </div>
  );
}
