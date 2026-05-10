"use client";

import { useState } from "react";
import Link from "next/link";

const CARD_COLORS = ["#BEE3F8", "#C6F6D5", "#FED7AA", "#E9D8FD", "#FEEBC8", "#B2F5EA", "#FEB2B2", "#FEFCBF", "#BEE3F8"];

const ALL_POSTS = [
  { slug: "how-to-choose-aesthetic-clinic", title: "如何選擇值得信賴的醫美診所？五大評估標準", category: "選診所指南", date: "2026-03-15", excerpt: "選擇醫美診所不只看價格，合法登記、司法糾紛、稽查違規、媒體口碑都是關鍵指標，本文帶您逐項分析。" },
  { slug: "botox-vs-filler", title: "肉毒桿菌 vs 玻尿酸：差異、效果、風險完整比較", category: "療程知識", date: "2026-03-10", excerpt: "肉毒桿菌和玻尿酸是最常見的微整形項目，兩者用途不同，選擇前必須了解各自的適應症與風險。" },
  { slug: "medical-dispute-prevention", title: "醫美糾紛如何預防？術前必做的五件事", category: "安全指南", date: "2026-03-05", excerpt: "醫美糾紛時有所聞，術前充分溝通、確認醫師資格、了解風險是保護自己的關鍵步驟。" },
  { slug: "laser-skin-guide", title: "雷射美容完整指南：適合膚質、術後照護、注意事項", category: "療程知識", date: "2026-02-28", excerpt: "雷射美容種類繁多，從淨膚雷射到皮秒雷射各有適用情況，本文帶您全面了解選擇方向。" },
  { slug: "hyaluronic-acid-guide", title: "玻尿酸填充全攻略：部位、劑量、持久度一次搞懂", category: "療程知識", date: "2026-02-20", excerpt: "玻尿酸是最普遍的填充材料，不同部位用量、選品牌有所不同，施打前請充分了解。" },
  { slug: "clinic-score-meaning", title: "360評鑑分數怎麼看？五個維度分別代表什麼", category: "評鑑說明", date: "2026-02-15", excerpt: "我們的評鑑分數由五個維度組成，每個維度對應不同的風險面向，本文教你正確解讀分數。" },
  { slug: "doctor-license-check", title: "如何查詢醫師執照合法性？三步驟完成驗證", category: "安全指南", date: "2026-02-10", excerpt: "透過衛福部醫事人員查詢系統，任何人都可以在幾分鐘內確認醫師的執照狀態與執業科別。" },
  { slug: "aesthetic-clinic-taiwan", title: "全台醫美市場現況：904家診所數據分析", category: "市場觀察", date: "2026-02-05", excerpt: "從 360醫美AI大調查收錄的904筆資料出發，分析全台醫美診所的地區分布與評分分布。" },
  { slug: "nose-surgery-guide", title: "隆鼻手術全指南：開放式 vs 封閉式、恢復期、風險", category: "療程知識", date: "2026-01-28", excerpt: "隆鼻是台灣最熱門的醫美手術之一，選擇術式、材料、醫師都需要謹慎評估。" },
];

const PAGE_SIZE = 9;

export default function BlogPage() {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(ALL_POSTS.length / PAGE_SIZE);
  const posts = ALL_POSTS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ background: "#FAFAF8", minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "32px 24px 28px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EBF8FF", border: "1px solid #BEE3F8", borderRadius: 20, padding: "3px 12px", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#2B6CB0" }}>醫美知識專欄</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A202C", margin: "0 0 8px" }}>醫美專欄</h1>
        <p style={{ fontSize: 13, color: "#718096", margin: 0 }}>醫美知識・療程指南・選診所攻略</p>
      </div>

      {/* Posts grid */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          {posts.map((post, i) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
              <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
                {/* Image area */}
                <div style={{ height: 110, background: CARD_COLORS[(page - 1) * PAGE_SIZE + i] || "#EBF8FF" }} />
                {/* Content */}
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ display: "inline-block", background: "#EBF8FF", color: "#2B6CB0", fontSize: 11, fontWeight: 600, borderRadius: 4, padding: "2px 8px", marginBottom: 8 }}>
                    {post.category}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A202C", marginBottom: 6, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {post.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#718096", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 10 }}>
                    {post.excerpt}
                  </div>
                  <div style={{ fontSize: 11, color: "#A0AEC0" }}>{post.date}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  width: 34, height: 34, borderRadius: 8, border: p === page ? "none" : "1px solid #E2E8F0",
                  background: p === page ? "#2B6CB0" : "#fff",
                  color: p === page ? "#fff" : "#4A5568",
                  fontSize: 13, fontWeight: p === page ? 700 : 400, cursor: "pointer",
                }}
              >
                {p}
              </button>
            ))}
            {page < totalPages && (
              <button
                onClick={() => setPage(page + 1)}
                style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #BEE3F8", background: "#fff", color: "#2B6CB0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                下一頁 →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
