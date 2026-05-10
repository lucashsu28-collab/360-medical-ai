"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface ApiClinic {
  id: string;
  name: string;
  address: string;
  phone?: string;
  specialty?: string;
  score?: number | null;
  google_rating?: number | null;
  google_review_count?: number | null;
  google_photo_url?: string | null;
  is_partner?: boolean;
  isPartner?: boolean;
  [key: string]: unknown;
}

const CITIES = [
  "台北市", "新北市", "基隆市", "桃園市", "新竹市", "新竹縣",
  "苗栗縣", "台中市", "彰化縣", "南投縣", "雲林縣", "嘉義市",
  "嘉義縣", "台南市", "高雄市", "屏東縣", "宜蘭縣", "花蓮縣",
  "台東縣", "澎湖縣", "金門縣", "連江縣",
];

const CITY_VARIANTS: Record<string, string[]> = {
  "台北市": ["台北市", "臺北市"],
  "台中市": ["台中市", "臺中市"],
  "台南市": ["台南市", "臺南市"],
  "台東縣": ["台東縣", "臺東縣"],
};

const TREATMENT_FILTERS = [
  { key: "injection", label: "微整形注射", keywords: ["玻尿酸", "肉毒", "晶亮瓷", "童顏針", "埋線"] },
  { key: "laser",     label: "雷射光療",   keywords: ["雷射", "皮秒", "飛梭", "淨膚", "電波", "除毛", "IPL"] },
  { key: "surgery",   label: "外科手術",   keywords: ["雙眼皮", "隆鼻", "拉皮", "抽脂", "隆乳"] },
  { key: "skin",      label: "皮膚管理",   keywords: ["保濕", "痘疤", "淡斑", "皮膚", "美白", "敏感"] },
  { key: "antiaging", label: "抗老緊緻",   keywords: ["電波", "音波", "拉提", "HIFU", "熱瑪吉"] },
  { key: "body",      label: "體雕塑形",   keywords: ["冷凍", "超音波", "雕塑", "溶脂"] },
];

const MIN_SCORES = [
  { value: 9, label: "9 分以上" },
  { value: 8, label: "8 分以上" },
  { value: 7, label: "7 分以上" },
];

const PAGE_SIZE = 20;

function ClinicRow({ clinic }: { clinic: ApiClinic }) {
  const isPartner = !!(clinic.is_partner || clinic.isPartner);
  const initials = clinic.name.slice(0, 2);

  return (
    <Link
      href={`/clinics/${clinic.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "#fff",
        border: isPartner ? "1px solid #F6AD55" : "1px solid #E2E8F0",
        borderRadius: 10,
        padding: "14px 16px",
        textDecoration: "none",
        transition: "box-shadow 0.15s",
      }}
    >
      {/* Avatar / Google photo */}
      <div style={{
        width: 56, height: 56, borderRadius: 10, flexShrink: 0,
        overflow: "hidden",
        background: isPartner ? "#FFFBEB" : "#EBF8FF",
        border: isPartner ? "1px solid #F6AD55" : "1px solid #BEE3F8",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 700,
        color: isPartner ? "#D69E2E" : "#2B6CB0",
      }}>
        {clinic.google_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={clinic.google_photo_url} alt={clinic.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
        ) : (
          initials
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1A202C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {clinic.name}
          </span>
          {isPartner && (
            <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: "#D69E2E", background: "#FFFBEB", border: "1px solid #F6AD55", borderRadius: 99, padding: "1px 6px" }}>
              合作
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: "#718096" }}>{clinic.address || "—"}</div>
        {clinic.specialty && (
          <div style={{ fontSize: 11, color: "#A0AEC0", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {clinic.specialty}
          </div>
        )}
      </div>

      {/* Scores */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
        {clinic.google_rating != null && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#ED8936" }}>
              ★ {clinic.google_rating.toFixed(1)}
            </div>
            <div style={{ fontSize: 10, color: "#A0AEC0" }}>Google</div>
          </div>
        )}
        {clinic.score != null && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#2B6CB0" }}>
              {clinic.score.toFixed(1)}
            </div>
            <div style={{ fontSize: 10, color: "#A0AEC0" }}>綜合</div>
          </div>
        )}
        <div style={{
          padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
          background: "#EBF8FF", color: "#2B6CB0", whiteSpace: "nowrap",
        }}>
          查看評鑑
        </div>
      </div>
    </Link>
  );
}

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<ApiClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [treatment, setTreatment] = useState("");
  const [minScore, setMinScore] = useState<number | null>(null);
  const [partnerOnly, setPartnerOnly] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  // 讀 URL ?q=（首頁帶「愛爾麗」進來時用）
  // 用 window.location 而非 useSearchParams，避免 Next.js prerender 需要 Suspense 包裝
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const next = sp.get("q") ?? "";
    if (next) {
      setQ(next);
      setPage(1);
    }
  }, []);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${apiUrl}/api/clinics?limit=9999`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data.clinics) ? data.clinics : [];
        setClinics(list);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return clinics.filter((c) => {
      if (q) {
        const clean = (s: string) => s.replace(/[\s.\-_]/g, "");
        if (!clean(c.name || "").includes(clean(q))) return false;
      }
      if (city) {
        const variants = CITY_VARIANTS[city] ?? [city];
        if (!variants.some((v) => (c.address || "").startsWith(v))) return false;
      }
      if (treatment) {
        const tf = TREATMENT_FILTERS.find((t) => t.key === treatment);
        if (tf) {
          const spec = c.specialty || "";
          if (!tf.keywords.some((kw) => spec.includes(kw))) return false;
        }
      }
      if (minScore != null && (c.score ?? 0) < minScore) return false;
      if (partnerOnly && !c.is_partner && !c.isPartner) return false;
      return true;
    }).sort((a, b) => {
      const ap = a.is_partner || a.isPartner ? 1 : 0;
      const bp = b.is_partner || b.isPartner ? 1 : 0;
      if (bp !== ap) return bp - ap;
      return (b.score ?? 0) - (a.score ?? 0);
    });
  }, [clinics, q, city, treatment, minScore, partnerOnly]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = () => setPage(1);

  return (
    <div style={{ background: "#FAFAF8", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "32px 24px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A202C", margin: "0 0 8px" }}>全台診所資料館</h1>
        <p style={{ fontSize: 13, color: "#718096", margin: "0 0 20px" }}>選地區・選療程・看五維度評鑑分數</p>
        <div style={{ maxWidth: 480, margin: "0 auto", position: "relative" }}>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); handleFilterChange(); }}
            placeholder="搜尋診所名稱…"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "10px 44px 10px 16px",
              border: "1px solid #E2E8F0", borderRadius: 8,
              fontSize: 14, outline: "none",
            }}
          />
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#A0AEC0" }}>🔍</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px", display: "flex", gap: 20, alignItems: "flex-start" }}>

        {/* Sidebar */}
        <aside style={{ width: 210, flexShrink: 0, position: "sticky", top: 76 }}>
          {/* City */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#4A5568", marginBottom: 10 }}>📍 縣市</div>
            <select
              value={city}
              onChange={(e) => { setCity(e.target.value); handleFilterChange(); }}
              style={{ width: "100%", padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 13, color: "#1A202C", background: "#fff", cursor: "pointer" }}
            >
              <option value="">全台灣</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Treatment */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#4A5568", marginBottom: 10 }}>💆 療程類型</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[{ key: "", label: "全部療程" }, ...TREATMENT_FILTERS].map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setTreatment(t.key); handleFilterChange(); }}
                  style={{
                    padding: "6px 10px", borderRadius: 6, fontSize: 12, fontWeight: treatment === t.key ? 600 : 400,
                    cursor: "pointer", textAlign: "left", border: "none",
                    background: treatment === t.key ? "#EBF8FF" : "transparent",
                    color: treatment === t.key ? "#2B6CB0" : "#4A5568",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Min Score */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#4A5568", marginBottom: 10 }}>⭐ 最低評分</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[{ value: null, label: "不限" }, ...MIN_SCORES].map((s) => (
                <label key={String(s.value)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: "#4A5568" }}>
                  <input
                    type="radio"
                    name="minScore"
                    checked={minScore === s.value}
                    onChange={() => { setMinScore(s.value); handleFilterChange(); }}
                    style={{ accentColor: "#2B6CB0" }}
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>

          {/* Partner */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: "#4A5568" }}>
              <input
                type="checkbox"
                checked={partnerOnly}
                onChange={(e) => { setPartnerOnly(e.target.checked); handleFilterChange(); }}
                style={{ accentColor: "#ED8936" }}
              />
              <span style={{ fontWeight: 600, color: "#D69E2E" }}>✦ 只看合作診所</span>
            </label>
          </div>
        </aside>

        {/* Main */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Result count */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "#718096" }}>
              {loading ? "載入中…" : (
                <>共 <strong style={{ color: "#1A202C" }}>{filtered.length}</strong> 家診所</>
              )}
            </div>
            {!loading && totalPages > 1 && (
              <div style={{ fontSize: 12, color: "#718096" }}>
                第 {page} / {totalPages} 頁
              </div>
            )}
          </div>

          {/* List */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ height: 72, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          ) : pageItems.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "48px 24px", textAlign: "center", color: "#718096" }}>
              沒有符合條件的診所，試試放寬篩選條件。
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pageItems.map((c) => <ClinicRow key={c.id} clinic={c} />)}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: "7px 16px", borderRadius: 6, border: "1px solid #E2E8F0", background: page === 1 ? "#F7FAFC" : "#fff", color: page === 1 ? "#A0AEC0" : "#4A5568", fontSize: 13, cursor: page === 1 ? "default" : "pointer" }}
              >
                上一頁
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: "7px 14px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 13, cursor: "pointer",
                      background: p === page ? "#2B6CB0" : "#fff",
                      color: p === page ? "#fff" : "#4A5568",
                      fontWeight: p === page ? 600 : 400,
                    }}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: "7px 16px", borderRadius: 6, border: "1px solid #E2E8F0", background: page === totalPages ? "#F7FAFC" : "#fff", color: page === totalPages ? "#A0AEC0" : "#4A5568", fontSize: 13, cursor: page === totalPages ? "default" : "pointer" }}
              >
                下一頁
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
