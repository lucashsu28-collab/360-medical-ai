import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "醫美專欄｜360醫療AI大調查",
  description: "醫美知識、療程介紹、診所選擇指南，幫助您做出最佳醫美決策。",
};

const MOCK_POSTS = [
  { slug: "how-to-choose-aesthetic-clinic", title: "如何選擇值得信賴的醫美診所？六大評估標準", category: "選診所指南", date: "2026-03-15", excerpt: "選擇醫美診所不只看價格，執照合法性、司法記錄、行政處分都是關鍵指標..." },
  { slug: "botox-vs-filler", title: "肉毒桿菌 vs 玻尿酸：差異、效果、風險完整比較", category: "療程知識", date: "2026-03-10", excerpt: "肉毒桿菌和玻尿酸是最常見的微整形項目，兩者用途不同，選擇前必須了解..." },
  { slug: "medical-dispute-prevention", title: "醫美糾紛如何預防？術前必做的五件事", category: "安全指南", date: "2026-03-05", excerpt: "醫美糾紛時有所聞，術前充分溝通、確認醫師資格、了解風險是保護自己的關鍵..." },
  { slug: "laser-skin-guide", title: "雷射美容完整指南：適合膚質、術後照護、注意事項", category: "療程知識", date: "2026-02-28", excerpt: "雷射美容種類繁多，從淨膚雷射到皮秒雷射各有適用情況，本文帶您全面了解..." },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <div className="mx-auto max-w-[1060px] px-4 py-8 md:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)] mb-2">醫美專欄</h1>
          <p className="text-[var(--muted)] text-sm">醫美知識・療程指南・選診所攻略</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {MOCK_POSTS.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`}
              className="rounded-[14px] border border-[var(--line)] bg-white p-6 transition-all hover:border-[var(--blue)] hover:shadow-md">
              <span className="inline-block rounded-full bg-[var(--blue-lt)] px-3 py-1 text-[11px] font-bold text-[var(--blue)] mb-3">{post.category}</span>
              <h2 className="text-[15px] font-bold text-[var(--ink)] mb-2 leading-snug">{post.title}</h2>
              <p className="text-[13px] text-[var(--muted)] leading-relaxed mb-4">{post.excerpt}</p>
              <span className="text-[12px] text-[var(--muted)]">{post.date}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
