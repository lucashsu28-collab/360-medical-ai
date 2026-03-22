import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "各縣市醫美診所｜360醫療AI大調查",
  description: "依縣市查詢醫美診所評鑑報告，涵蓋全台22縣市904家診所，六維度AI分析。",
};

const CITIES = [
  { name: "臺北市", count: 120 },{ name: "新北市", count: 98 },{ name: "桃園市", count: 76 },
  { name: "臺中市", count: 89 },{ name: "臺南市", count: 54 },{ name: "高雄市", count: 72 },
  { name: "基隆市", count: 18 },{ name: "新竹市", count: 32 },{ name: "嘉義市", count: 22 },
  { name: "新竹縣", count: 15 },{ name: "苗栗縣", count: 12 },{ name: "彰化縣", count: 28 },
  { name: "南投縣", count: 10 },{ name: "雲林縣", count: 14 },{ name: "嘉義縣", count: 11 },
  { name: "屏東縣", count: 19 },{ name: "宜蘭縣", count: 13 },{ name: "花蓮縣", count: 9 },
  { name: "臺東縣", count: 7 },{ name: "澎湖縣", count: 4 },{ name: "金門縣", count: 3 },
  { name: "連江縣", count: 1 },
];

export default function CitiesPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <div className="mx-auto max-w-[1060px] px-4 py-8 md:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)] mb-2">各縣市醫美診所</h1>
          <p className="text-[var(--muted)] text-sm">全台 22 縣市・904 家診所・六維度 AI 評鑑</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {CITIES.map(c => (
            <Link key={c.name} href={`/cities/${encodeURIComponent(c.name)}`}
              className="rounded-[14px] border border-[var(--line)] bg-white p-4 text-center transition-all hover:border-[var(--blue)] hover:shadow-md">
              <div className="text-[15px] font-bold text-[var(--ink)] mb-1">{c.name}</div>
              <div className="text-[12px] text-[var(--muted)]">{c.count} 家診所</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
