import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "各縣市醫美診所｜360醫療AI大調查",
  description: "依縣市查詢醫美診所評鑑報告，涵蓋全台22縣市904家診所，六維度AI分析。",
};

const CITIES = [
  "臺北市","新北市","桃園市","臺中市","臺南市","高雄市",
  "基隆市","新竹市","嘉義市","新竹縣","苗栗縣","彰化縣",
  "南投縣","雲林縣","嘉義縣","屏東縣","宜蘭縣","花蓮縣",
  "臺東縣","澎湖縣","金門縣","連江縣"
];

async function getCityCounts(): Promise<Record<string, number>> {
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
    return counts;
  } catch {
    return {};
  }
}

export default async function CitiesPage() {
  const counts = await getCityCounts();
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <div className="mx-auto max-w-[1060px] px-4 py-8 md:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)] mb-2">各縣市醫美診所</h1>
          <p className="text-[var(--muted)] text-sm">全台 22 縣市・904 家診所・六維度 AI 評鑑</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {CITIES.map(city => (
            <Link key={city} href={`/cities/${encodeURIComponent(city)}`}
              className="rounded-[14px] border border-[var(--line)] bg-white p-4 text-center transition-all hover:border-[var(--blue)] hover:shadow-md">
              <div className="text-[15px] font-bold text-[var(--ink)] mb-1">{city}</div>
              <div className="text-[12px] text-[var(--muted)]">{counts[city] ?? 0} 家診所</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
