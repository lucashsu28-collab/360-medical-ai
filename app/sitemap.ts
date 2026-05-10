import { MetadataRoute } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const baseUrl = "https://360-medical-ai.vercel.app";

// 不在 build 階段預生成（會 fetch 1567 家診所，超過 60s 超時）
// 改成請求進來時動態生成，並快取 24h
export const revalidate = 86400;
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let clinics: { id: string }[] = [];
  try {
    const res = await fetch(`${API_URL}/api/clinics?limit=1000`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) clinics = (await res.json()).clinics ?? [];
  } catch (e) {
    console.warn("[sitemap] fetch clinics failed, fallback empty:", e);
  }

  const clinicUrls = clinics.map((c: { id: string }) => ({
    url: `${baseUrl}/clinics/${c.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const staticPages = [
    { url: `${baseUrl}/cities`, priority: 0.8 },
    { url: `${baseUrl}/faq`, priority: 0.8 },
    { url: `${baseUrl}/blog`, priority: 0.8 },
    { url: `${baseUrl}/compare`, priority: 0.6 },
  ].map(p => ({ ...p, lastModified: new Date(), changeFrequency: "weekly" as const }));

  const cityPages = [
    "臺北市","新北市","桃園市","臺中市","臺南市","高雄市",
    "基隆市","新竹市","嘉義市","新竹縣","苗栗縣","彰化縣",
    "南投縣","雲林縣","嘉義縣","屏東縣","宜蘭縣","花蓮縣",
    "臺東縣","澎湖縣","金門縣","連江縣",
  ].map(city => ({
    url: `${baseUrl}/cities/${encodeURIComponent(city)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const wikiPages = ["botox", "hyaluronic-acid", "laser"].map(topic => ({
    url: `${baseUrl}/wiki/${topic}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/clinics`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/doctors`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    ...clinicUrls,
    ...staticPages,
    ...cityPages,
    ...wikiPages,
  ];
}
