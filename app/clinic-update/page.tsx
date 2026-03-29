"use client";

import { useState } from "react";
import Link from "next/link";

type FormState = Record<string, string>;

export default function ClinicUpdatePage() {
  const [form, setForm] = useState<FormState>({
    clinic_name: "", clinic_addr: "", contact_name: "",
    contact_tel: "", contact_email: "", update_content: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(id: string, value: string) {
    setForm((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/clinic-update/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } catch { /* silent */ }
    setLoading(false);
    setSubmitted(true);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    padding: "10px 14px", border: "1px solid #E2E8F0", borderRadius: 8,
    fontSize: 14, color: "#1A202C", background: "#FAFAF8", outline: "none",
  };

  const FIELDS = [
    { id: "clinic_name",   label: "診所名稱",     type: "text",  placeholder: "請輸入診所全名",              required: true },
    { id: "clinic_addr",   label: "診所地址",     type: "text",  placeholder: "縣市 + 詳細地址",             required: true },
    { id: "contact_name",  label: "聯絡人姓名",   type: "text",  placeholder: "負責人或授權人員姓名",         required: true },
    { id: "contact_tel",   label: "聯絡電話",     type: "tel",   placeholder: "02-XXXX-XXXX 或 09XX-XXX-XXX", required: true },
    { id: "contact_email", label: "聯絡 Email",   type: "email", placeholder: "example@clinic.com",           required: true },
  ];

  return (
    <div style={{ background: "#FAFAF8", minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "32px 24px 28px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EBF8FF", border: "1px solid #BEE3F8", borderRadius: 20, padding: "3px 12px", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#2B6CB0" }}>診所資料更新申請</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A202C", margin: "0 0 8px" }}>診所更新資料</h1>
        <p style={{ fontSize: 13, color: "#718096", margin: 0 }}>
          診所負責人或授權人員可透過此入口申請更新，資料經審核後將於平台上更新顯示。
        </p>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 400px", gap: 28, alignItems: "flex-start" }}>

        {/* Left form */}
        <div>
          {submitted ? (
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "48px 32px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#15803D", marginBottom: 8 }}>申請已收到！</h2>
              <p style={{ fontSize: 14, color: "#166534", lineHeight: 1.7, marginBottom: 24 }}>
                感謝您的申請，我們將於 <strong>3 個工作天</strong>內與您聯繫，<br />請注意來自平台的 Email 或電話通知。
              </p>
              <button
                onClick={() => { setSubmitted(false); setForm({ clinic_name: "", clinic_addr: "", contact_name: "", contact_tel: "", contact_email: "", update_content: "" }); }}
                style={{ padding: "9px 24px", border: "1px solid #BBF7D0", borderRadius: 8, background: "#fff", color: "#15803D", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                再提交一筆
              </button>
            </div>
          ) : (
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 28 }}>
              {/* Note */}
              <div style={{ background: "#EBF8FF", border: "1px solid #BEE3F8", borderRadius: 8, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#2B6CB0", lineHeight: 1.6 }}>
                <strong>注意事項：</strong>本申請僅限診所負責人或經授權人員填寫。提交後平台將進行人工審核，若資料有誤將無法通過審核。評鑑分數來自公開資料，不受此申請影響。
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {FIELDS.map(({ id, label, type, placeholder, required }) => (
                  <div key={id}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4A5568", marginBottom: 6 }}>
                      {label} {required && <span style={{ color: "#E53E3E" }}>*</span>}
                    </label>
                    <input
                      id={id} type={type} required={required}
                      value={form[id]} onChange={(e) => handleChange(id, e.target.value)}
                      placeholder={placeholder} style={inputStyle}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4A5568", marginBottom: 6 }}>
                    想更新的內容 <span style={{ color: "#E53E3E" }}>*</span>
                  </label>
                  <textarea
                    required rows={5} value={form.update_content}
                    onChange={(e) => handleChange("update_content", e.target.value)}
                    placeholder="請描述您想更新的資料，例如：診所地址已變更為…、電話更新為…、補充診所簡介…"
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  style={{ padding: "12px 0", background: "#2B6CB0", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "送出中…" : "送出申請"}
                </button>
                <p style={{ fontSize: 12, color: "#A0AEC0", textAlign: "center", margin: 0 }}>
                  送出後將由專人審核，審核結果以 Email 通知
                </p>
              </form>
            </div>
          )}
        </div>

        {/* Right info cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Process */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", marginBottom: 14 }}>申請流程</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { step: "1", text: "填寫申請表單" },
                { step: "2", text: "平台收到申請並審核" },
                { step: "3", text: "平台與申請人確認資料" },
                { step: "4", text: "資料更新上線" },
              ].map((s) => (
                <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#2B6CB0", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {s.step}
                  </div>
                  <span style={{ fontSize: 13, color: "#4A5568" }}>{s.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scope */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", marginBottom: 14 }}>可更新的資料範圍</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { ok: true, text: "地址、電話、Email" },
                { ok: true, text: "營業時間" },
                { ok: true, text: "診所簡介、專科說明" },
                { ok: false, text: "評鑑分數（系統自動計算）" },
                { ok: false, text: "司法資料（來自公開裁判書）" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: item.ok ? "#38A169" : "#E53E3E" }}>
                  <span>{item.ok ? "✅" : "❌"}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Partner CTA */}
          <div style={{ background: "#ED8936", borderRadius: 12, padding: 20, textAlign: "center" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>想要更豐富的診所頁面？</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,.85)", marginBottom: 14 }}>
              加入合作計畫，展示醫師、優惠方案、診所環境
            </p>
            <Link
              href="/partnership"
              style={{ display: "inline-block", background: "#fff", color: "#ED8936", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}
            >
              了解合作方案 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
