"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const LIFF_ID = "2009360724-7DzjBKHU";

interface Promotion {
  id: number;
  clinic_id: number;
  clinic_name: string;
  clinic_google_rating?: number;
  treatment_name: string;
  treatment_category?: string;
  description?: string;
  price_label?: string;
  expires_at?: string;
  image_url?: string;
  is_active: boolean;
  // legacy fallback fields
  title?: string;
  price?: string;
  valid_until?: string;
  category?: string;
  line_oa_url?: string;
  is_partner?: boolean;
}

const GRADIENT_BG = [
  "linear-gradient(135deg, #FED7AA 0%, #FBB040 100%)",
  "linear-gradient(135deg, #BEE3F8 0%, #63B3ED 100%)",
  "linear-gradient(135deg, #C6F6D5 0%, #48BB78 100%)",
  "linear-gradient(135deg, #E9D8FD 0%, #9F7AEA 100%)",
  "linear-gradient(135deg, #FEB2B2 0%, #FC8181 100%)",
  "linear-gradient(135deg, #FEFCBF 0%, #F6E05E 100%)",
];

export default function PromotionsPage() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [part, setPart] = useState("");
  const [effect, setEffect] = useState("");
  const [priceRange, setPriceRange] = useState("");

  const hasFilters = !!(category || part || effect || priceRange);

  const loadItems = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (part) params.set("part", part);
    if (effect) params.set("effect", effect);
    if (priceRange) params.set("price_range", priceRange);
    fetch(`/api/promotions?${params}`)
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [category, part, effect, priceRange]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const clearFilters = () => { setCategory(""); setPart(""); setEffect(""); setPriceRange(""); };

  const selectStyle: React.CSSProperties = {
    padding: "8px 12px", border: "1px solid #E2E8F0", borderRadius: 8,
    fontSize: 13, color: "#1A202C", background: "#fff", cursor: "pointer", outline: "none",
  };

  return (
    <div style={{ background: "#FAFAF8", minHeight: "100vh" }}>

      {/* Hero */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "32px 32px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EBF8FF", border: "1px solid #BEE3F8", borderRadius: 20, padding: "3px 12px", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#2B6CB0" }}>優惠療程搜尋</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A202C", margin: "0 0 8px" }}>幫你找優惠療程</h1>
          <p style={{ fontSize: 13, color: "#718096", margin: 0 }}>
            以下優惠由合作診所提供，非平台評鑑推薦。點選療程可直接透過 LINE OA 預約。
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "12px 32px", position: "sticky", top: 60, zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={selectStyle}>
            <option value="">全部大類</option>
            <option value="微整形">微整形</option>
            <option value="雷射光療">雷射光療</option>
            <option value="保養">保養</option>
            <option value="手術">手術</option>
          </select>
          <select value={part} onChange={(e) => setPart(e.target.value)} style={selectStyle}>
            <option value="">全部部位</option>
            <option value="臉部">臉部</option>
            <option value="眼部">眼部</option>
            <option value="鼻部">鼻部</option>
            <option value="身體">身體</option>
          </select>
          <select value={effect} onChange={(e) => setEffect(e.target.value)} style={selectStyle}>
            <option value="">全部效果</option>
            <option value="除皺">除皺</option>
            <option value="美白">美白</option>
            <option value="縮毛孔">縮毛孔</option>
            <option value="拉提">拉提</option>
          </select>
          <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} style={selectStyle}>
            <option value="">全部價格</option>
            <option value="0-3000">$3,000以下</option>
            <option value="3000-10000">$3,000–$10,000</option>
            <option value="10000-999999">$10,000以上</option>
          </select>
          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{ padding: "8px 14px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, color: "#718096", background: "#fff", cursor: "pointer" }}
            >
              清除篩選
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 320, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10 }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#718096" }}>
            目前此分類尚無優惠，歡迎診所聯繫我們上架
            <br />
            <Link href="/partnership" style={{ color: "#2B6CB0", marginTop: 12, display: "inline-block", fontSize: 14 }}>
              了解合作方案 →
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {items.map((item, idx) => {
              const clinicName = item.clinic_name;
              const treatmentName = item.treatment_name || item.title || "";
              const desc = item.description || "";
              const priceLabel = item.price_label || item.price || "";
              const expiresAt = item.expires_at || item.valid_until || "";
              const googleRating = item.clinic_google_rating;
              const gradientBg = GRADIENT_BG[idx % GRADIENT_BG.length];

              return (
                <div
                  key={item.id}
                  style={{ border: "1px solid #FEEBC8", borderRadius: 10, overflow: "hidden", background: "#fff", display: "flex", flexDirection: "column" }}
                >
                  {/* Image area */}
                  <div style={{
                    height: 160, position: "relative",
                    background: item.image_url ? `url(${item.image_url}) center/cover` : gradientBg,
                  }}>
                    <span style={{
                      position: "absolute", top: 12, left: 12,
                      background: "#E53E3E", color: "#fff", fontSize: 11, fontWeight: 700,
                      borderRadius: 4, padding: "3px 8px",
                    }}>
                      限時優惠
                    </span>
                    {item.treatment_category && (
                      <span style={{
                        position: "absolute", top: 12, right: 12,
                        background: "rgba(255,255,255,.85)", color: "#4A5568", fontSize: 11, fontWeight: 600,
                        borderRadius: 4, padding: "3px 8px",
                      }}>
                        {item.treatment_category || item.category}
                      </span>
                    )}
                  </div>

                  {/* Info area */}
                  <div style={{ background: "#FFFAF0", padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* Clinic name */}
                    <div style={{ fontSize: 11, color: "#718096", marginBottom: 6 }}>🏥 {clinicName}</div>

                    {/* Treatment name */}
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#7B341E", marginBottom: 4 }}>{treatmentName}</div>

                    {/* Description */}
                    {desc && (
                      <div style={{ fontSize: 12, color: "#C05621", lineHeight: 1.5, marginBottom: 10 }}>{desc}</div>
                    )}

                    {/* Footer */}
                    <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <div>
                        {priceLabel && (
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#E53E3E" }}>{priceLabel}</div>
                        )}
                        {expiresAt && (
                          <div style={{ fontSize: 10, color: "#A0AEC0" }}>截止 {expiresAt}</div>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {googleRating != null && (
                          <div style={{ fontSize: 12, color: "#D69E2E", marginBottom: 6 }}>⭐ {googleRating.toFixed(1)}</div>
                        )}
                        <button
                          onClick={() => window.open(`https://liff.line.me/${LIFF_ID}?clinic_id=${item.clinic_id}`)}
                          style={{ background: "#38A169", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, padding: "6px 14px", cursor: "pointer" }}
                        >
                          立即預約
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div style={{ background: "#2B6CB0", padding: "28px 32px", textAlign: "center" }}>
        <h3 style={{ color: "#fff", fontSize: 16, margin: "0 0 6px" }}>診所業者想上架優惠？</h3>
        <p style={{ color: "#BEE3F8", fontSize: 12, margin: "0 0 16px" }}>加入合作計畫即可在此頁展示優惠療程</p>
        <Link
          href="/partnership"
          style={{ display: "inline-block", background: "#fff", color: "#2B6CB0", borderRadius: 8, padding: "9px 24px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
        >
          了解合作方案 →
        </Link>
      </div>
    </div>
  );
}
