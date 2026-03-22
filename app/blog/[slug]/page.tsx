import type { Metadata } from "next";
import Link from "next/link";

const POSTS: Record<string, { title: string; category: string; date: string; content: string }> = {
  "how-to-choose-aesthetic-clinic": {
    title: "如何選擇值得信賴的醫美診所？六大評估標準",
    category: "選診所指南",
    date: "2026-03-15",
    content: `選擇醫美診所是一個重要決定，以下六個標準幫助您做出明智選擇：

**1. 確認醫師執照合法性**
向衛福部醫事人員查詢系統確認醫師執照有效，這是最基本的保障。

**2. 查詢診所合法登記狀態**
診所必須向衛福部健保署完成醫事機構登記，未登記即屬非法執業。

**3. 檢視司法案件記錄**
透過司法院裁判書查詢，了解診所過去是否有醫療糾紛訴訟。

**4. 查看行政處分記錄**
衛福部會對違規診所開立行政裁處，有記錄的診所需特別謹慎。

**5. 參考Google評分與評論**
大量真實評論能反映診所的服務品質與患者滿意度。

**6. 術前充分溝通**
正規診所會詳細說明療程風險、術前術後注意事項，並提供書面同意書。`,
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) return { title: "文章不存在" };
  return {
    title: `${post.title}｜360醫療AI大調查`,
    description: post.content.slice(0, 120),
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = POSTS[slug];

  if (!post) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-[var(--ink)] mb-4">文章不存在</h1>
          <Link href="/blog" className="text-[var(--blue)] hover:underline">回到專欄列表</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "datePublished": post.date,
        "publisher": { "@type": "Organization", "name": "360醫療AI大調查" },
      })}} />
      <div className="mx-auto max-w-[780px] px-4 py-8 md:px-8">
        <nav className="mb-6 text-[12px] text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--blue)]">首頁</Link>
          <span className="mx-1.5">/</span>
          <Link href="/blog" className="hover:text-[var(--blue)]">專欄</Link>
          <span className="mx-1.5">/</span>
          <span className="text-[var(--ink)]">{post.title}</span>
        </nav>
        <span className="inline-block rounded-full bg-[var(--blue-lt)] px-3 py-1 text-[11px] font-bold text-[var(--blue)] mb-4">{post.category}</span>
        <h1 className="text-2xl font-black text-[var(--ink)] mb-2 leading-snug">{post.title}</h1>
        <p className="text-[12px] text-[var(--muted)] mb-8">{post.date}</p>
        <div className="prose prose-sm max-w-none text-[var(--ink2)] leading-relaxed whitespace-pre-line">
          {post.content}
        </div>
      </div>
    </div>
  );
}
