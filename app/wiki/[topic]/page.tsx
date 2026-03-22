import type { Metadata } from "next";
import Link from "next/link";

const WIKI: Record<string, { title: string; desc: string; content: string }> = {
  "botox": { title: "肉毒桿菌素", desc: "肉毒桿菌素療程完整介紹，包含原理、適應症、風險與注意事項。", content: "肉毒桿菌素（Botulinum Toxin）是一種神經毒素蛋白，醫美用途主要用於放鬆肌肉、改善動態皺紋。常見適應症包括魚尾紋、抬頭紋、眉間紋等，效果通常持續4-6個月。" },
  "hyaluronic-acid": { title: "玻尿酸", desc: "玻尿酸填充療程完整介紹，包含原理、適應症、風險與注意事項。", content: "玻尿酸（Hyaluronic Acid）是人體天然存在的物質，醫美填充用途主要用於補充流失的組織容積。常見適應症包括法令紋、蘋果肌、唇部豐盈等，效果通常持續6-18個月。" },
  "laser": { title: "雷射美容", desc: "雷射美容療程完整介紹，包含種類、原理、適應症與注意事項。", content: "雷射美容是利用特定波長的光能對皮膚進行治療，常見種類包括淨膚雷射、皮秒雷射、飛梭雷射等，各有不同適應症，建議術前充分諮詢醫師。" },
};

export async function generateStaticParams() {
  return Object.keys(WIKI).map(topic => ({ topic }));
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const { topic } = await params;
  const wiki = WIKI[topic];
  if (!wiki) return { title: "百科不存在" };
  return {
    title: `${wiki.title}｜醫美百科｜360醫療AI大調查`,
    description: wiki.desc,
  };
}

export default async function WikiPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const wiki = WIKI[topic];
  if (!wiki) return <div className="min-h-screen flex items-center justify-center"><p>百科頁面不存在</p></div>;

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": wiki.title,
        "description": wiki.desc,
        "publisher": { "@type": "Organization", "name": "360醫療AI大調查" },
      })}} />
      <div className="mx-auto max-w-[780px] px-4 py-8 md:px-8">
        <nav className="mb-6 text-[12px] text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--blue)]">首頁</Link>
          <span className="mx-1.5">/</span>
          <span className="text-[var(--ink)]">醫美百科</span>
          <span className="mx-1.5">/</span>
          <span className="text-[var(--ink)]">{wiki.title}</span>
        </nav>
        <h1 className="text-2xl font-black text-[var(--ink)] mb-2">{wiki.title}</h1>
        <p className="text-[var(--muted)] text-sm mb-8">{wiki.desc}</p>
        <div className="rounded-[14px] border border-[var(--line)] bg-white p-6 text-[13px] leading-relaxed text-[var(--ink2)] whitespace-pre-line">
          {wiki.content}
        </div>
      </div>
    </div>
  );
}
