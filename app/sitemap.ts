import { MetadataRoute } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const res = await fetch(`${API_URL}/api/clinics?limit=1000`, {
    next: { revalidate: 86400 },
  });

  const clinics = res.ok ? (await res.json()).clinics ?? [] : [];

  const clinicUrls = clinics.map((c: { id: string }) => ({
    url: `https://360-medical-ai.vercel.app/clinics/${c.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: "https://360-medical-ai.vercel.app",
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: "https://360-medical-ai.vercel.app/clinics",
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: "https://360-medical-ai.vercel.app/doctors",
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    ...clinicUrls,
  ];
}
