import { MetadataRoute } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const baseUrl = "https://360-medical-ai.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const res = await fetch(`${API_URL}/api/clinics?limit=1000`, {
    next: { revalidate: 86400 },
  });

  const clinics = res.ok ? (await res.json()).clinics ?? [] : [];

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
