"use client";
import { useState } from "react";
import Link from "next/link";

/**
 * 設計預覽頁：付費合作 vs 非合作診所頁面新版視覺對比
 * 方案 A：完全分流（合作=品牌主頁、非合作=第三方評鑑報告）
 */

const MOCK = {
  name: "晶緻醫美診所",
  address: "台北市信義區忠孝東路五段 123 號",
  phone: "(02) 1234-5678",
  google_rating: 4.8,
  review_count: 1247,
  total_score: 94,
  scores: { judicial: 19, google: 18, legal: 20, penalty: 19, media: 18 },
  treatments: [
    { name: "皮秒雷射", price: "$8,800–$12,000", desc: "深層淨膚、淡斑除痘" },
    { name: "玻尿酸", price: "$8,000/cc", desc: "微整形/法令紋/蘋果肌" },
    { name: "肉毒桿菌", price: "$6,000/部位", desc: "除皺、瘦小臉" },
    { name: "童顏針", price: "$25,000/瓶", desc: "膠原增生、抗老" },
  ],
  promotions: [
    { title: "週年慶限定組合", price: "$18,800（原價 $25,000）", expires: "2026-06-30" },
    { title: "新客體驗", price: "$2,800（皮秒+保養）", expires: "2026-12-31" },
  ],
  doctors: [
    { name: "吳欣儀 醫師", title: "醫學美容醫師", spec: "微整形、抗老" },
    { name: "陳志遠 醫師", title: "皮膚科專科", spec: "雷射、皮膚管理" },
  ],
};

export default function DesignPreviewPage() {
  const [view, setView] = useState<"partner" | "free">("partner");

  return (
    <div style={{ background: "#F1F5F9", minHeight: "100vh" }}>
      {/* Top control bar */}
      <div style={{ background: "#0F172A", color: "#fff", padding: "12px 20px", position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>📐 診所頁視覺方案 A — 完全分流</div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
            合作 = 品牌主頁 / 非合作 = 第三方評鑑（純 mockup，未串資料）
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, background: "#1E293B", padding: 4, borderRadius: 8 }}>
          <button onClick={() => setView("partner")}
            style={{
              padding: "6px 16px", border: 0, borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600,
              background: view === "partner" ? "#F59E0B" : "transparent",
              color: view === "partner" ? "#0F172A" : "#94A3B8",
            }}>
            ✦ 合作診所版
          </button>
          <button onClick={() => setView("free")}
            style={{
              padding: "6px 16px", border: 0, borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600,
              background: view === "free" ? "#fff" : "transparent",
              color: view === "free" ? "#0F172A" : "#94A3B8",
            }}>
            📋 非合作診所版
          </button>
        </div>
      </div>

      {view === "partner" ? <PartnerView /> : <FreeView />}

      <div style={{ padding: "40px 20px", textAlign: "center", background: "#fff", borderTop: "1px solid #E2E8F0" }}>
        <Link href="/admin" style={{ fontSize: 12, color: "#64748B", textDecoration: "none" }}>← 返回後台</Link>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// 合作診所版：金緻品牌主頁
// ════════════════════════════════════════
function PartnerView() {
  const [tab, setTab] = useState<"treatment" | "promo" | "doctor" | "gallery">("treatment");

  return (
    <div style={{ background: "#FFFEF7" }}>
      {/* HERO 大圖區（300px） */}
      <div style={{
        position: "relative", height: 320,
        background: "linear-gradient(135deg, #F6AD55 0%, #ED8936 50%, #C05621 100%)",
        overflow: "hidden",
      }}>
        {/* 暖光裝飾 */}
        <div style={{ position: "absolute", top: -120, right: -80, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.25) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -60, left: 100, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.18) 0%, transparent 70%)" }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", position: "relative", color: "#fff" }}>
          {/* 認證徽章 */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(255,255,255,.92)", color: "#C05621", borderRadius: 99, fontSize: 12, fontWeight: 700, marginBottom: 16, boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}>
            ✦ 360 AI 認證合作診所
          </div>

          <h1 style={{ fontSize: 42, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em", textShadow: "0 2px 8px rgba(0,0,0,.15)" }}>
            {MOCK.name}
          </h1>

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 14, marginBottom: 24, opacity: 0.95 }}>
            <span>📍 {MOCK.address}</span>
            <span>📞 {MOCK.phone}</span>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button style={{ padding: "12px 28px", background: "#06C755", color: "#fff", border: 0, borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(6,199,85,.4)", display: "flex", alignItems: "center", gap: 8 }}>
              💬 立即預約諮詢
            </button>
            <button style={{ padding: "12px 22px", background: "rgba(255,255,255,.18)", color: "#fff", border: "1.5px solid rgba(255,255,255,.45)", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(10px)" }}>
              📍 Google Maps
            </button>
          </div>

          {/* 評分 chip 浮在右側 */}
          <div style={{ position: "absolute", right: 24, top: 32, padding: "20px 24px", background: "rgba(255,255,255,.95)", borderRadius: 16, color: "#1A202C", textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,.15)" }}>
            <div style={{ fontSize: 11, color: "#64748B", marginBottom: 4 }}>360 綜合評分</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#C05621", lineHeight: 1 }}>{MOCK.total_score}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>⭐ Google {MOCK.google_rating}</div>
          </div>
        </div>
      </div>

      {/* Tab 切換（品牌頁感） */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", position: "sticky", top: 60, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", gap: 0 }}>
          {[
            { k: "treatment", label: "💉 療程介紹" },
            { k: "promo", label: "🎁 限時優惠" },
            { k: "doctor", label: "👨‍⚕️ 醫師團隊" },
            { k: "gallery", label: "📸 環境相片" },
          ].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k as any)}
              style={{
                padding: "16px 22px", border: 0, background: "transparent",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                color: tab === t.k ? "#C05621" : "#64748B",
                borderBottom: tab === t.k ? "3px solid #F6AD55" : "3px solid transparent",
                marginBottom: -1,
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 280px", gap: 28 }}>
        <main>
          {/* Tab 內容 */}
          {tab === "treatment" && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1A202C", margin: "0 0 16px" }}>療程介紹</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                {MOCK.treatments.map((t, i) => (
                  <div key={i} style={{ padding: 20, background: "#fff", border: "1px solid #FED7AA", borderRadius: 14, boxShadow: "0 2px 8px rgba(246,173,85,.08)" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1A202C", marginBottom: 6 }}>{t.name}</div>
                    <div style={{ fontSize: 13, color: "#64748B", marginBottom: 10, lineHeight: 1.6 }}>{t.desc}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#C05621" }}>{t.price}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "promo" && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1A202C", margin: "0 0 16px" }}>限時優惠方案</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {MOCK.promotions.map((p, i) => (
                  <div key={i} style={{ padding: 20, background: "linear-gradient(135deg, #FFFBEB 0%, #FFEDD5 100%)", border: "2px solid #F6AD55", borderRadius: 14 }}>
                    <div style={{ display: "inline-block", padding: "3px 10px", background: "#C05621", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 4, marginBottom: 10 }}>限時</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1A202C", marginBottom: 8 }}>{p.title}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#C05621", marginBottom: 12 }}>{p.price}</div>
                    <div style={{ fontSize: 12, color: "#92400E" }}>有效期至 {p.expires}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "doctor" && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1A202C", margin: "0 0 16px" }}>醫師團隊</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {MOCK.doctors.map((d, i) => (
                  <div key={i} style={{ padding: 20, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FED7AA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>👨‍⚕️</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#1A202C" }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{d.title}</div>
                      <div style={{ fontSize: 12, color: "#C05621", marginTop: 4 }}>{d.spec}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "gallery" && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1A202C", margin: "0 0 16px" }}>診所環境</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} style={{ aspectRatio: "1", background: "linear-gradient(135deg, #FED7AA, #FBBF24)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 32 }}>
                    📸
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 評鑑報告（次級資訊，折疊感） */}
          <section style={{ marginTop: 40, padding: 24, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1A202C", margin: 0 }}>📊 360 評鑑報告</h3>
              <span style={{ fontSize: 11, color: "#64748B" }}>由 360 AI 平台獨立評估</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
              {[
                { k: "judicial", label: "司法糾紛", v: MOCK.scores.judicial },
                { k: "google", label: "Google", v: MOCK.scores.google },
                { k: "legal", label: "合法登記", v: MOCK.scores.legal },
                { k: "penalty", label: "稽查違規", v: MOCK.scores.penalty },
                { k: "media", label: "媒體口碑", v: MOCK.scores.media },
              ].map((d) => (
                <div key={d.k} style={{ textAlign: "center", padding: 12, background: "#FFFBEB", borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#C05621" }}>{d.v}</div>
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>{d.label}</div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* 右側 sticky CTA */}
        <aside style={{ position: "sticky", top: 130, alignSelf: "flex-start" }}>
          <div style={{ padding: 20, background: "#fff", border: "2px solid #F6AD55", borderRadius: 14, boxShadow: "0 4px 16px rgba(246,173,85,.15)" }}>
            <div style={{ textAlign: "center", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 11, color: "#92400E", marginBottom: 4, fontWeight: 600 }}>✦ 360 認證合作診所</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#C05621" }}>{MOCK.total_score}</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>綜合評分</div>
            </div>
            <button style={{ width: "100%", padding: 12, background: "#06C755", color: "#fff", border: 0, borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>
              💬 立即預約諮詢
            </button>
            <button style={{ width: "100%", padding: 10, background: "#fff", color: "#C05621", border: "1px solid #F6AD55", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              📞 撥打電話
            </button>
            <div style={{ fontSize: 11, color: "#64748B", textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
              透過 360 平台預約，<br/>可享 LINE 客服即時回覆
            </div>
          </div>
        </aside>
      </div>

      {/* 底部 sticky CTA */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #F6AD55", padding: "12px 24px", boxShadow: "0 -4px 16px rgba(0,0,0,.08)", zIndex: 99 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A202C" }}>{MOCK.name}</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>透過 LINE OA 預約諮詢，享 360 認證保障</div>
          </div>
          <button style={{ padding: "12px 32px", background: "#06C755", color: "#fff", border: 0, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(6,199,85,.4)" }}>
            💬 立即預約諮詢
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// 非合作診所版：嚴肅第三方評鑑報告
// ════════════════════════════════════════
function FreeView() {
  return (
    <div style={{ background: "#F8FAFC" }}>
      {/* 簡潔 Hero（120px） */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px 24px 28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "#F1F5F9", color: "#64748B", borderRadius: 4, fontSize: 11, fontWeight: 600, marginBottom: 12 }}>
            ⓘ 此診所未加入 360 合作計畫
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>{MOCK.name}</h1>
          <div style={{ display: "flex", gap: 18, fontSize: 12, color: "#475569" }}>
            <span>📍 {MOCK.address}</span>
            <span>📞 {MOCK.phone}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "28px 24px 40px" }}>
        {/* 主要：360 評鑑報告（佔最大版面） */}
        <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 28, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, paddingBottom: 20, borderBottom: "2px solid #1E293B" }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 6, letterSpacing: "0.1em" }}>360 醫美 AI 第三方評鑑</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>五維度評鑑報告</h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: "#0F172A", lineHeight: 1, fontFamily: "var(--font-dm-mono, monospace)" }}>{MOCK.total_score}</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>/ 100 分</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {[
              { k: "judicial", label: "司法糾紛", v: MOCK.scores.judicial, icon: "⚖️" },
              { k: "google", label: "Google 評分", v: MOCK.scores.google, icon: "📍" },
              { k: "legal", label: "合法登記", v: MOCK.scores.legal, icon: "🏛️" },
              { k: "penalty", label: "稽查違規", v: MOCK.scores.penalty, icon: "⚠️" },
              { k: "media", label: "媒體口碑", v: MOCK.scores.media, icon: "📰" },
            ].map((d) => (
              <div key={d.k} style={{ textAlign: "center", padding: "18px 8px", border: "1px solid #E2E8F0", borderRadius: 8 }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{d.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", lineHeight: 1, fontFamily: "var(--font-dm-mono, monospace)" }}>{d.v}</div>
                <div style={{ fontSize: 10, color: "#64748B", marginTop: 4 }}>/ 20 分</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 8, fontWeight: 600 }}>{d.label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, padding: 12, background: "#F8FAFC", borderRadius: 6, fontSize: 11, color: "#64748B", lineHeight: 1.7 }}>
            ⓘ 本評鑑由 360 醫美 AI 平台獨立計算，資料來源：司法院裁判書、Google Places、衛福部、政府公開處分資料、主流媒體報導。
            評鑑與該診所是否為合作會員無關，所有 904 家診所一視同仁計分。
          </div>
        </section>

        {/* 稽查 / 媒體 / 趨勢（次要區塊） */}
        <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24, marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: "0 0 12px" }}>⚠️ 稽查違規紀錄</h3>
          <div style={{ padding: 20, background: "#F0FDF4", borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>✓</div>
            <div style={{ fontSize: 13, color: "#166534" }}>目前無公開違規紀錄</div>
          </div>
        </section>

        <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24, marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: "0 0 12px" }}>📰 媒體口碑</h3>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "center" }}>
            <div style={{ textAlign: "center", paddingRight: 16, borderRight: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#3182CE" }}>92</div>
              <div style={{ fontSize: 10, color: "#64748B" }}>分</div>
            </div>
            <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.7 }}>
              近 12 個月共 8 則主流媒體提及，正面 5 則 / 中性 3 則，無負面報導
            </div>
          </div>
        </section>

        {/* 完整報告（霧化解鎖） */}
        <section style={{ background: "#fff", border: "1px dashed #CBD5E0", borderRadius: 12, padding: 24, marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: "0 0 8px" }}>📋 完整評鑑報告</h3>
          <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 12px", lineHeight: 1.7 }}>
            含判決書案號、申訴案進度、媒體報導全文、口碑分析，加 LINE 解鎖後可下載 PDF
          </p>
          <button style={{ padding: "10px 20px", background: "#0F172A", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            🔓 加 LINE 解鎖完整報告
          </button>
        </section>

        {/* footer：低調合作 upsell */}
        <div style={{ marginTop: 32, padding: 18, background: "#F8FAFC", borderLeft: "3px solid #CBD5E0", borderRadius: 6 }}>
          <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
            <strong style={{ color: "#0F172A" }}>是這家診所的負責人嗎？</strong>
            加入 360 合作計畫，可在頁面展示療程介紹、優惠方案、醫師團隊與診所環境照片。
            {" "}
            <Link href="/partnership" style={{ color: "#1D4ED8", textDecoration: "underline", fontWeight: 600 }}>了解合作方案 →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
