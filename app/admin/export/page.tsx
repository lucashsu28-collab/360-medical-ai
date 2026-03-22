"use client";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type ExportKey = "clinics" | "unlocks" | "clinic_json";

interface LastExport {
  key: ExportKey;
  time: string;
  filename: string;
}

function adminToken() {
  return typeof window !== "undefined" ? (localStorage.getItem("admin_token") ?? "") : "";
}

/** 呼叫 API 取得二進位/文字內容，自動觸發瀏覽器下載 */
async function downloadFile(url: string, filename: string) {
  const res = await fetch(url, { headers: { "x-admin-token": adminToken() } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "匯出失敗" }));
    throw new Error(err.detail ?? "匯出失敗");
  }
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}

export default function ExportPage() {
  const [loading, setLoading] = useState<ExportKey | null>(null);
  const [error, setError] = useState<string>("");
  const [lastExports, setLastExports] = useState<LastExport[]>([]);
  const [clinicId, setClinicId] = useState("");

  function recordExport(key: ExportKey, filename: string) {
    setLastExports((prev) => {
      const next = prev.filter((e) => e.key !== key);
      return [{ key, time: new Date().toLocaleString("zh-TW"), filename }, ...next];
    });
  }

  async function handleExport(key: ExportKey) {
    setError("");
    setLoading(key);
    try {
      if (key === "clinics") {
        await downloadFile(`${API_URL}/api/admin/export/clinics`, "clinics_export.csv");
        recordExport("clinics", "clinics_export.csv");
      } else if (key === "unlocks") {
        await downloadFile(`${API_URL}/api/admin/export/unlocks`, "unlocks_export.csv");
        recordExport("unlocks", "unlocks_export.csv");
      } else if (key === "clinic_json") {
        const id = clinicId.trim();
        if (!id) { setError("請輸入診所 ID"); return; }
        await downloadFile(
          `${API_URL}/api/admin/export/clinic/${encodeURIComponent(id)}/pdf`,
          `clinic_${id}.json`,
        );
        recordExport("clinic_json", `clinic_${id}.json`);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "匯出失敗，請重試");
    } finally {
      setLoading(null);
    }
  }

  const lastOf = (key: ExportKey) => lastExports.find((e) => e.key === key);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>資料匯出</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>
        診所清單與解鎖記錄匯出為 CSV；單一診所資料匯出為 JSON（P3 升級為 PDF）
      </p>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#DC2626" }}>
          ❌ {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* 匯出診所 CSV */}
        <ExportCard
          icon="🏥"
          title="匯出全部診所 CSV"
          desc="診所 ID、名稱、地址、電話、Google 評分、各維度分數、合作狀態等欄位"
          badge="clinics_export.csv"
          last={lastOf("clinics")}
          loading={loading === "clinics"}
          onExport={() => handleExport("clinics")}
        />

        {/* 匯出解鎖記錄 CSV */}
        <ExportCard
          icon="🔓"
          title="匯出解鎖記錄 CSV"
          desc="LINE User ID、診所名稱、解鎖類型、解鎖時間"
          badge="unlocks_export.csv"
          last={lastOf("unlocks")}
          loading={loading === "unlocks"}
          onExport={() => handleExport("unlocks")}
        />

        {/* 匯出單一診所 JSON */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{ fontSize: 32 }}>📄</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>
                  匯出單一診所資料
                </h3>
                <span style={{ background: "#F0FDF4", color: "#16A34A", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                  JSON（P3 升級 PDF）
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 12px" }}>
                輸入診所 ID（如 c001），匯出該診所完整資料含各維度分數明細
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  type="text"
                  value={clinicId}
                  onChange={(e) => setClinicId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleExport("clinic_json")}
                  placeholder="輸入診所 ID，例如：c001"
                  style={{
                    flex: 1, minWidth: 180, maxWidth: 260,
                    padding: "8px 14px", border: "1px solid #E2E8F0",
                    borderRadius: 8, fontSize: 13, outline: "none",
                  }}
                />
                <button
                  onClick={() => handleExport("clinic_json")}
                  disabled={loading === "clinic_json"}
                  style={{
                    padding: "8px 20px", background: "#3B82F6", color: "#fff",
                    border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: loading === "clinic_json" ? "not-allowed" : "pointer",
                    opacity: loading === "clinic_json" ? 0.65 : 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {loading === "clinic_json" ? "匯出中…" : "匯出"}
                </button>
              </div>
              {lastOf("clinic_json") && (
                <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 8 }}>
                  上次匯出：{lastOf("clinic_json")!.filename}（{lastOf("clinic_json")!.time}）
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 醫師 CSV — 建置中 */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", opacity: 0.6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 32 }}>👨‍⚕️</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#94A3B8", margin: 0 }}>醫師清單 CSV</h3>
                <span style={{ background: "#F1F5F9", color: "#94A3B8", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>建置中</span>
              </div>
              <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>醫師資料待 P3-4 診所自填系統完成後開放匯出</p>
            </div>
            <button disabled style={{ padding: "9px 20px", background: "#F1F5F9", color: "#CBD5E1", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "not-allowed" }}>
              建置中
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function ExportCard({
  icon, title, desc, badge, last, loading, onExport,
}: {
  icon: string;
  title: string;
  desc: string;
  badge: string;
  last: LastExport | undefined;
  loading: boolean;
  onExport: () => void;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 32 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>{title}</h3>
            <span style={{ background: "#EFF6FF", color: "#3B82F6", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{badge}</span>
          </div>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>{desc}</p>
          {last && (
            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>
              上次匯出：{last.filename}（{last.time}）
            </p>
          )}
        </div>
        <button
          onClick={onExport}
          disabled={loading}
          style={{
            padding: "9px 22px", background: "#3B82F6", color: "#fff",
            border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.65 : 1, whiteSpace: "nowrap",
          }}
        >
          {loading ? "匯出中…" : "匯出"}
        </button>
      </div>
    </div>
  );
}
