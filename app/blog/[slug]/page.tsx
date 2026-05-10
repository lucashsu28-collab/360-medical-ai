import type { Metadata } from "next";
import Link from "next/link";

const POSTS: Record<string, { title: string; category: string; date: string; content: string }> = {
  "how-to-choose-aesthetic-clinic": {
    title: "如何選擇值得信賴的醫美診所？五大評估標準",
    category: "選診所指南",
    date: "2026-03-15",
    content: `選擇醫美診所是一個重要決定，本平台以五個公開可驗證的維度幫助您做出明智選擇：

1. 合法登記
診所必須向衛福部健保署完成醫事機構登記，未登記即屬非法執業。本平台與健保署資料庫每月同步比對。

2. Google 評分
大量真實評論能反映診所的服務品質與患者滿意度。我們以星等（4.5+ 滿分）+ 評論數量綜合計算。

3. 司法糾紛
透過司法院裁判書查詢，了解診所過去是否有醫療糾紛訴訟，案件數越多分數越低。

4. 稽查違規
聚合各縣市衛生局、公平會等政府公開處分資料 + 主流媒體報導，輕微違規 -3 分、中度 -10 分、重大（停業/廢止/致死）-25 分。

5. 媒體口碑
主流媒體（蘋果/聯合/自由/中時/TVBS/ETtoday 等）報導 + AI 情緒分析 + 業配辨識，社群匿名討論因易被操作不納入評分。

【術前提醒】正規診所會詳細說明療程風險、術前術後注意事項，並提供書面同意書，請務必充分溝通再決定。`,
  },
  "botox-vs-filler": {
    title: "肉毒桿菌 vs 玻尿酸：差異、效果、風險完整比較",
    category: "療程知識",
    date: "2026-03-10",
    content: `肉毒桿菌和玻尿酸是最常見的微整形項目，兩者用途截然不同。

肉毒桿菌素（Botulinum Toxin）
作用原理：暫時阻斷神經訊號，放鬆肌肉收縮。
主要用途：改善動態皺紋（魚尾紋、抬頭紋、眉間紋）、瘦臉、止汗。
效果持續：約 4-6 個月。
風險：少數人出現暫時性瘀青、頭痛，極少數出現眼瞼下垂。

玻尿酸（Hyaluronic Acid）
作用原理：填充組織空間，補充流失的容積。
主要用途：法令紋、蘋果肌、唇部豐盈、淚溝填充。
效果持續：依產品不同，約 6-18 個月。
風險：瘀青、腫脹，罕見但嚴重的血管栓塞風險需特別注意。

選擇建議
動態皺紋（表情紋）→ 肉毒桿菌
靜態皺紋或容積流失 → 玻尿酸
兩者可合併使用，建議諮詢有執照的醫師評估。`,
  },
  "medical-dispute-prevention": {
    title: "醫美糾紛如何預防？術前必做的五件事",
    category: "安全指南",
    date: "2026-03-05",
    content: `醫美糾紛時有所聞，術前做好以下五件事，能大幅降低風險。

1. 確認醫師執照與專科資格
透過衛福部醫事人員查詢系統確認醫師執照有效，並確認其受訓背景。非醫師執行醫美注射屬違法行為。

2. 查詢診所合法登記狀態
診所須向衛福部健保署完成醫事機構登記。可透過「360醫療AI大調查」直接確認登記狀態。

3. 了解療程風險與副作用
正規診所會提供書面說明，詳述療程原理、可能副作用與術後注意事項。若診所略過這個步驟，應提高警覺。

4. 簽署知情同意書
術前務必閱讀並簽署知情同意書，了解自身權益。同意書應載明療程項目、費用、風險及緊急處理方式。

5. 保留所有憑證與紀錄
保存收據、療程說明書、術前術後照片，若日後發生糾紛可作為重要佐證。`,
  },
  "laser-skin-guide": {
    title: "雷射美容完整指南：適合膚質、術後照護、注意事項",
    category: "療程知識",
    date: "2026-02-28",
    content: `雷射美容是醫美最熱門的療程之一，種類繁多，選擇前需充分了解。

常見雷射種類
淨膚雷射（1064nm Nd:YAG）：改善膚色不均、縮小毛孔，恢復期短，適合入門。
皮秒雷射：去除色斑、刺青效率高，脈衝時間極短、熱傷害低。
飛梭雷射（Fractional Laser）：改善痘疤、細紋，恢復期約 3-7 天。
CO2 雷射：磨皮效果強，適合深層疤痕，恢復期較長。

術後照護重點
1. 嚴格防曬：術後皮膚脆弱，需使用 SPF50+ 防曬，避免日曬至少 4 週。
2. 保濕修復：使用診所建議的修復保濕品，避免使用刺激性成分（如酸類、A醇）。
3. 避免摩擦：不要用力搓洗臉部，以輕拍方式清潔。
4. 回診追蹤：按時回診讓醫師評估恢復狀況。

選擇建議
雷射種類應依個人膚質、問題與恢復期規劃選擇，建議術前充分與醫師溝通，切勿因價格因素而選擇不合適的療程。`,
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
