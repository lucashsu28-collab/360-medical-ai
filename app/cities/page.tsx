import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "各縣市醫美診所｜360醫療AI大調查",
  description: "依縣市查詢醫美診所評鑑報告，涵蓋全台22縣市逾900家診所，五維度AI分析。",
};

const CITIES = [
  "臺北市","新北市","桃園市","臺中市","臺南市","高雄市",
  "基隆市","新竹市","嘉義市","新竹縣","苗栗縣","彰化縣",
  "南投縣","雲林縣","嘉義縣","屏東縣","宜蘭縣","花蓮縣",
  "臺東縣","澎湖縣","金門縣","連江縣",
];

async function getCityData(): Promise<{ counts: Record<string, number>; total: number }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  try {
    const res = await fetch(`${apiUrl}/api/clinics?limit=9999`, { next: { revalidate: 3600 } });
    const data = await res.json();
    const clinics: { address?: string }[] = data.clinics ?? [];
    const counts: Record<string, number> = {};
    for (const c of clinics) {
      const addr = c.address || "";
      const m = addr.match(/^(.*?[市縣])/);
      if (m) {
        const city = m[1];
        counts[city] = (counts[city] || 0) + 1;
      }
    }
    return { counts, total: data.total ?? clinics.length };
  } catch {
    return { counts: {}, total: 0 };
  }
}

export default async function CitiesPage() {
  const { counts, total } = await getCityData();
  const displayTotal = total > 0 ? total.toLocaleString("zh-TW") : "904";

  return (
    <div style={{ background: "#FAFAF8", minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "32px 24px 28px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EBF8FF", border: "1px solid #BEE3F8", borderRadius: 20, padding: "3px 12px", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#2B6CB0" }}>全台縣市索引</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A202C", margin: "0 0 8px" }}>各縣市醫美診所</h1>
        <p style={{ fontSize: 13, color: "#718096", margin: 0 }}>
          全台 22 縣市・{displayTotal} 家診所・五維度 AI 評鑑
        </p>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {CITIES.map((city) => {
            const count = counts[city] ?? 0;
            return (
              <Link
                key={city}
                href={`/cities/${encodeURIComponent(city)}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{
                  background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10,
                  padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
                  cursor: "pointer",
                }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#1A202C", marginBottom: 2 }}>{city}</div>
                    <div style={{ fontSize: 12, color: "#718096" }}>{count} 家診所</div>
                  </div>
                  <span style={{ fontSize: 16, color: "#A0AEC0" }}>→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
