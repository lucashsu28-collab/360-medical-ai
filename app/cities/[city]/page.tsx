import Link from "next/link";
import type { Metadata } from "next";
import ClinicCard from "@/components/ClinicCard";

const CITY_LIST = ["臺北市","新北市","桃園市","臺中市","臺南市","高雄市","基隆市","新竹市","嘉義市","新竹縣","苗栗縣","彰化縣","南投縣","雲林縣","嘉義縣","屏東縣","宜蘭縣","花蓮縣","臺東縣","澎湖縣","金門縣","連江縣"];

const TREATMENT_TYPES: Record<string, string[]> = {
  laser: ["雷射","皮秒","淨膚","飛梭","IPL","光療"],
  injection: ["肉毒桿菌","玻尿酸","微整形","注射"],
  surgery: ["隆鼻","雙眼皮","拉皮","抽脂","隆乳","整形"],
  skin: ["皮膚","美白","保濕","痘疤","暗沉"],
};

interface ApiClinic {
  id: string;
  name: string;
  address: string;
  score?: number | null;
  google_rating?: number | null;
  google_review_count?: number | null;
  specialty?: string;
  [key: string]: unknown;
}

export async function generateStaticParams() {
  return CITY_LIST.map(city => ({ city }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const cityName = decodeURIComponent(city);
  return {
    title: `${cityName}醫美診所推薦｜360醫療AI大調查`,
    description: `${cityName}醫美診所完整評鑑，含Google評分、司法案件、合法登記等六維度分析。找${cityName}最值得信賴的醫美診所。`,
  };
}

export default async function CityPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ type?: string; sort?: string }>;
}) {
  const { city } = await params;
  const { type, sort } = await searchParams;
  const cityName = decodeURIComponent(city);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const res = await fetch(`${apiUrl}/api/clinics?city=${encodeURIComponent(cityName)}&limit=9999`, { next: { revalidate: 3600 } });
  const data = await res.json();
  let clinics: ApiClinic[] = data.clinics ?? [];

  // 療程篩選
  if (type && TREATMENT_TYPES[type]) {
    const keywords = TREATMENT_TYPES[type];
    clinics = clinics.filter(c =>
      keywords.some(kw => (c.specialty || "").includes(kw) || (c.name || "").includes(kw))
    );
  }

  // 排序
  if (sort === "score") {
    clinics = [...clinics].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  } else if (sort === "google") {
    clinics = [...clinics].sort((a, b) => (b.google_rating ?? 0) - (a.google_rating ?? 0));
  } else if (sort === "reviews") {
    clinics = [...clinics].sort((a, b) => (b.google_review_count ?? 0) - (a.google_review_count ?? 0));
  }

  const filterButtons = [
    { key: "", label: "全部" },
    { key: "laser", label: "雷射美容" },
    { key: "injection", label: "微整注射" },
    { key: "surgery", label: "手術整形" },
    { key: "skin", label: "皮膚保養" },
  ];

  const sortButtons = [
    { key: "", label: "預設排序" },
    { key: "score", label: "綜合評分" },
    { key: "google", label: "Google評分" },
    { key: "reviews", label: "評論數" },
  ];

  const buildUrl = (newType?: string, newSort?: string) => {
    const p = new URLSearchParams();
    const t = newType !== undefined ? newType : (type || "");
    const s = newSort !== undefined ? newSort : (sort || "");
    if (t) p.set("type", t);
    if (s) p.set("sort", s);
    const qs = p.toString();
    return `/cities/${encodeURIComponent(cityName)}${qs ? "?" + qs : ""}`;
  };

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `${cityName}醫美診所推薦`,
        "numberOfItems": clinics.length,
        "itemListElement": clinics.slice(0, 10).map((c, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": c.name,
          "url": `${process.env.NEXT_PUBLIC_APP_URL}/clinics/${c.id}`,
        })),
      })}} />

      <div className="mx-auto max-w-[1060px] px-4 py-8 md:px-8">
        <nav className="mb-6 text-[12px] text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--blue)]">首頁</Link>
          <span className="mx-1.5">/</span>
          <Link href="/cities" className="hover:text-[var(--blue)]">各縣市</Link>
          <span className="mx-1.5">/</span>
          <span className="text-[var(--ink)]">{cityName}</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-black text-[var(--ink)] mb-2">{cityName}醫美診所推薦</h1>
          <p className="text-[var(--muted)] text-sm">共 {clinics.length} 家診所｜六維度AI評鑑分析</p>
        </div>

        {/* 篩選列 */}
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <span className="text-[12px] text-[var(--muted)] mr-1">療程：</span>
          {filterButtons.map(btn => (
            <Link key={btn.key} href={buildUrl(btn.key, sort)}
              className={`rounded-full px-3 py-1 text-[12px] font-medium border transition-all ${
                (type || "") === btn.key
                  ? "bg-[var(--blue)] text-white border-[var(--blue)]"
                  : "bg-white text-[var(--muted)] border-[var(--line)] hover:border-[var(--blue)]"
              }`}>
              {btn.label}
            </Link>
          ))}
        </div>
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <span className="text-[12px] text-[var(--muted)] mr-1">排序：</span>
          {sortButtons.map(btn => (
            <Link key={btn.key} href={buildUrl(type, btn.key)}
              className={`rounded-full px-3 py-1 text-[12px] font-medium border transition-all ${
                (sort || "") === btn.key
                  ? "bg-[var(--blue)] text-white border-[var(--blue)]"
                  : "bg-white text-[var(--muted)] border-[var(--line)] hover:border-[var(--blue)]"
              }`}>
              {btn.label}
            </Link>
          ))}
        </div>

        {/* 診所列表 */}
        <div className="flex flex-col gap-2.5">
          {clinics.length === 0 ? (
            <div className="rounded-[14px] border border-[var(--line)] bg-white py-16 text-center text-[var(--muted)]">
              目前無符合條件的診所
            </div>
          ) : clinics.map(clinic => (
            <ClinicCard
              key={clinic.id}
              id={clinic.id}
              name={clinic.name}
              address={clinic.address}
              score={clinic.score ?? undefined}
              specialty={clinic.specialty}
              google_rating={clinic.google_rating ?? undefined}
              review_count={clinic.google_review_count ?? undefined}
              variant="row"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
