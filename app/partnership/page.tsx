"use client";
import { useState } from "react";

export default function PartnershipPage() {
  const [form, setForm] = useState({ clinic_name: "", contact: "", inquiry: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clinic_name || !form.contact) return;
    setStatus("loading");
    try {
      await fetch("/api/partnership/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStatus("done");
      window.open("https://lin.ee/6sTCRzm", "_blank");
    } catch {
      setStatus("error");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    padding: "10px 14px", border: "1px solid #E2E8F0", borderRadius: 8,
    fontSize: 14, color: "#1A202C", outline: "none",
  };

  return (
    <div style={{ background: "#FAFAF8", minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "32px 32px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EBF8FF", border: "1px solid #BEE3F8", borderRadius: 20, padding: "3px 12px", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#2B6CB0" }}>診所合作洽詢</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A202C", margin: 0 }}>全台每一家醫美診所，都擁有自己的專屬頁面</h1>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px", display: "grid", gridTemplateColumns: "1fr 400px", gap: 40, alignItems: "flex-start" }}>

        {/* Left copy */}
        <div>
          <p style={{ fontSize: 15, color: "#4A5568", lineHeight: 1.8, marginBottom: 20 }}>
            360醫美AI大調查收錄全台 904 家醫美診所，每一家都有獨立的評鑑頁面，供消費者查詢、比較。
          </p>
          <p style={{ fontSize: 15, color: "#4A5568", lineHeight: 1.8, marginBottom: 32 }}>
            若您希望讓診所的頁面更加精緻、豐富，讓有意願的消費者能看到更完整的診所樣貌，歡迎與我們聯繫洽詢。
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
            {[
              { icon: "🏥", title: "更完整的診所頁面", desc: "展示醫師團隊、診所環境 Gallery、優惠方案" },
              { icon: "📊", title: "專屬數據看板", desc: "查看頁面瀏覽量、預約量、優惠點擊數" },
              { icon: "🤖", title: "AI 智能導流", desc: "360 LINE AI 顧問主動推薦用戶至您的診所頁面" },
              { icon: "🎯", title: "優惠療程曝光", desc: "優惠方案自動出現在「幫你找優惠療程」搜尋頁面" },
            ].map((b) => (
              <div key={b.title} style={{ display: "flex", gap: 14, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 8, background: "#EBF8FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  {b.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", marginBottom: 2 }}>{b.title}</div>
                  <div style={{ fontSize: 13, color: "#718096" }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "#718096", fontStyle: "italic" }}>
            填寫右側表單，或直接加入我們的 LINE 官方帳號，將有專人為您說明。
          </p>
        </div>

        {/* Right form */}
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 28 }}>
          {status === "done" ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1A202C", marginBottom: 8 }}>收到您的洽詢！</h3>
              <p style={{ fontSize: 13, color: "#718096", lineHeight: 1.7, marginBottom: 20 }}>
                我們已收到您的資料，將於 1 個工作日內透過 LINE 或電話與您聯繫。
              </p>
              <a
                href="https://lin.ee/6sTCRzm"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "block", padding: "12px 0", background: "#06C755", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none", textAlign: "center" }}
              >
                加入 LINE OA 繼續洽談
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1A202C", margin: 0 }}>填寫洽詢資料</h2>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4A5568", marginBottom: 6 }}>
                  診所名稱 <span style={{ color: "#E53E3E" }}>*</span>
                </label>
                <input
                  type="text" required value={form.clinic_name}
                  onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
                  placeholder="例：台北信義美醫診所"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4A5568", marginBottom: 6 }}>
                  聯絡方式（電話或 Email） <span style={{ color: "#E53E3E" }}>*</span>
                </label>
                <input
                  type="text" required value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  placeholder="0912-345-678 或 contact@clinic.com"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4A5568", marginBottom: 6 }}>
                  詢問內容（選填）
                </label>
                <textarea
                  rows={4} value={form.inquiry}
                  onChange={(e) => setForm({ ...form, inquiry: e.target.value })}
                  placeholder="請描述您的診所規模、主要療程或任何問題..."
                  style={{ ...inputStyle, resize: "none" }}
                />
              </div>
              {status === "error" && (
                <p style={{ fontSize: 13, color: "#E53E3E" }}>送出失敗，請稍後再試。</p>
              )}
              <button
                type="submit"
                disabled={status === "loading"}
                style={{ padding: "12px 0", background: "#2B6CB0", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: status === "loading" ? 0.7 : 1 }}
              >
                {status === "loading" ? "送出中..." : "送出洽詢"}
              </button>
              <a
                href="https://lin.ee/6sTCRzm"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "block", padding: "12px 0", background: "#06C755", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none", textAlign: "center" }}
              >
                加入 LINE 直接洽詢
              </a>
              <p style={{ fontSize: 12, color: "#A0AEC0", textAlign: "center", margin: 0 }}>
                送出後將有專人於 1 個工作日內回覆。
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
