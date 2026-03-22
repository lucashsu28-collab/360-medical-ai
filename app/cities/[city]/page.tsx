import Link from "next/link";
import type { Metadata } from "next";
import ClinicCard from "@/components/ClinicCard";

const CITY_LIST = ["臺北市","新北市","桃園市","臺中市","臺南市","高雄市","基隆市","新竹市","嘉義市","新竹縣","苗栗縣","彰化縣","南投縣","雲林縣","嘉義縣","屏東縣","宜蘭縣","花蓮縣","臺東縣","澎湖縣","金門縣","連江縣"];

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
    openGraph: {
      title: `${cityName}醫美診所推薦`,
      description: `${cityName}醫美診所六維度評鑑報告`,
    },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const cityName = decodeURIComponent(city);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const res = await fetch(`${apiUrl}/api/clinics?city=${encodeURIComponent(cityName)}&limit=50`, { next: { revalidate: 3600 } });
  const data = await res.json();
  const clinics: ApiClinic[] = data.clinics ?? [];

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `${cityName}醫美診所推薦`,
        "description": `${cityName}醫美診所六維度評鑑列表`,
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

        <div className="mb-8">
          <h1 className="text-2xl font-black text-[var(--ink)] mb-2">{cityName}醫美診所推薦</h1>
          <p className="text-[var(--muted)] text-sm">共 {clinics.length} 家診所｜六維度AI評鑑分析</p>
        </div>

        <div className="flex flex-col gap-2.5">
          {clinics.length === 0 ? (
            <div className="rounded-[14px] border border-[var(--line)] bg-white py-16 text-center text-[var(--muted)]">
              目前無{cityName}診所資料
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
