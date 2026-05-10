import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ScoreCard from "@/components/ScoreCard";
import FogReport from "@/components/FogReport";
import ClinicReviewsList from "@/components/ClinicReviewsList";
import PenaltiesSection from "@/components/PenaltiesSection";
import MentionsSection from "@/components/MentionsSection";
import ReputationTrendChart from "@/components/ReputationTrendChart";
import PartnerBrandView, { type BrandPageData } from "@/components/PartnerBrandView";
import type { ScoreCardScores } from "@/components/ScoreCard";

/* ── 型別 ─────────────────────────────────────────────────────────────────── */

interface Doctor { id?: string; name: string; title?: string; specialty?: string; photo_url?: string; }
interface PortalTreatment { id: number; name: string; description?: string; price_min?: number; price_max?: number; price_label?: string; }
interface PortalPromotion { id: number; title: string; description?: string; price_label?: string; expires_at?: string | null; }
interface GalleryItem { id?: string; url: string; caption?: string; type?: string; }

interface ApiClinic {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  specialty?: string;
  score?: number | null;
  google_rating?: number | null;
  google_review_count?: number | null;
  website?: string | null;
  cont_start?: string | null;
  is_partner?: boolean;
  isPartner?: boolean;
  partner_since?: string | null;
  line_oa_url?: string | null;
  treatments?: string[];
  brand_page?: BrandPageData | null;
  doctors?: Doctor[] | null;
  gallery?: GalleryItem[] | null;
  portal_treatments?: PortalTreatment[];
  portal_promotions?: PortalPromotion[];
  score_breakdown?: Record<string, number>;
  legal_score?: number;
  [key: string]: unknown;
}

/* ── 靜態資料 ─────────────────────────────────────────────────────────────── */

const TREATMENT_FILTERS = [
  { href: "/clinics?specialty=微整形注射", label: "微整形注射", icon: "💉" },
  { href: "/clinics?specialty=雷射光療",   label: "雷射光療",   icon: "✨" },
  { href: "/clinics?specialty=外科手術",   label: "外科手術",   icon: "🔬" },
  { href: "/clinics?specialty=皮膚管理",   label: "皮膚管理",   icon: "🌿" },
  { href: "/clinics?specialty=抗老緊緻",   label: "抗老緊緻",   icon: "⚡" },
  { href: "/clinics?specialty=除毛療程",   label: "除毛療程",   icon: "🪒" },
  { href: "/clinics?specialty=痘疤修復",   label: "痘疤修復",   icon: "🌸" },
  { href: "/clinics?specialty=體雕塑形",   label: "體雕塑形",   icon: "💪" },
];

const CITY_LIST = ["台北市", "新北市", "桃園市", "台中市", "台南市", "高雄市", "新竹市", "基隆市"];

/* ── 工具函式 ─────────────────────────────────────────────────────────────── */

function formatContStart(s: string | null | undefined): string {
  if (!s || s.length !== 8) return "—";
  return `${s.slice(0, 4)}/${s.slice(4, 6)}/${s.slice(6, 8)}`;
}

function formatPrice(t: PortalTreatment): string {
  if (t.price_label) return t.price_label;
  if (t.price_min && t.price_max) return `$${t.price_min.toLocaleString()} – $${t.price_max.toLocaleString()}`;
  if (t.price_min) return `起 $${t.price_min.toLocaleString()}`;
  return "洽詢";
}

function extractCity(address: string | undefined): string {
  if (!address) return "";
  const m = address.match(/^([^\s]{2,3}[市縣])/);
  return m ? m[1] : "";
}

/* ── 霧化報告假內容 ───────────────────────────────────────────────────────── */

function FakeFogContent({ clinicName }: { clinicName: string }) {
  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", marginBottom: 12 }}>司法／申訴紀錄摘要</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        <li style={{ fontSize: 13, color: "#4A5568", lineHeight: 1.7 }}>・民國 111 年 民事訴訟 案號 111 年度 醫字第 XX 號，與術後效果認知差異相關，調解成立。</li>
        <li style={{ fontSize: 13, color: "#4A5568", lineHeight: 1.7 }}>・民國 110 年 衛生局申訴 1 件，經查為溝通疏失，已改善並結案。</li>
      </ul>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", marginBottom: 8 }}>負評關鍵字彙整（僅供參考）</h3>
      <p style={{ fontSize: 13, color: "#718096", lineHeight: 1.7, marginBottom: 20 }}>
        以下由系統彙整自公開評論，加 LINE 可查看完整報告。與「{clinicName}」相關的常見負面關鍵字：等候時間、預約難、價格未事先說明、術後衛教不足。
      </p>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", marginBottom: 8 }}>完整報告內容</h3>
      <p style={{ fontSize: 13, color: "#718096", lineHeight: 1.7 }}>
        含判決書案號、稽查違規明細、媒體口碑情緒分析、業配辨識結果等，解鎖後可下載 PDF。
      </p>
    </div>
  );
}

/* ── Metadata ─────────────────────────────────────────────────────────────── */

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const res = await fetch(`${apiUrl}/api/clinics/${id}`, { next: { revalidate: 60 } });
  if (!res.ok) return { title: "診所不存在" };
  const clinic = (await res.json()) as ApiClinic;
  return {
    title: `${clinic.name} 評鑑報告｜360醫美大調查`,
    description: `${clinic.name}位於${clinic.address ?? ""}，360綜合評分 ${clinic.score != null ? clinic.score.toFixed(1) : "—"} 分。`,
    openGraph: {
      title: `${clinic.name}｜360醫美評鑑`,
      description: `查看 ${clinic.name} 的完整評鑑報告`,
      url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/clinics/${id}`,
    },
  };
}

/* ── 頁面主體 ─────────────────────────────────────────────────────────────── */

export default async function ClinicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const res = await fetch(`${apiUrl}/api/clinics/${id}`, { next: { revalidate: 60 } });
  if (!res.ok) notFound();
  const clinic = (await res.json()) as ApiClinic;
  if (!clinic?.id) notFound();

  const isPartner = !!(clinic.is_partner || clinic.isPartner || clinic.partner_since);
  const lineOaUrl = clinic.line_oa_url || "https://lin.ee/6sTCRzm";

  // 合作診所且已設定品牌頁 → 走新版「品牌主頁」設計（mockup 套版）
  const hasBrandPage = isPartner && clinic.brand_page && (
    clinic.brand_page.hero_image_url ||
    clinic.brand_page.slogan ||
    (clinic.brand_page.features?.length ?? 0) > 0 ||
    (clinic.brand_page.signature_treatments?.length ?? 0) > 0
  );
  if (hasBrandPage && clinic.brand_page) {
    return (
      <PartnerBrandView
        clinic={{
          id: clinic.id,
          name: clinic.name,
          address: clinic.address,
          phone: clinic.phone,
          score: clinic.score ?? null,
          google_rating: clinic.google_rating ?? null,
          google_review_count: clinic.google_review_count ?? null,
          line_oa_url: clinic.line_oa_url ?? null,
        }}
        brand={clinic.brand_page}
      />
    );
  }
  const reviewCount = clinic.google_review_count ?? 0;
  const city = extractCity(clinic.address);

  const breakdown = clinic.score_breakdown;
  const scores: ScoreCardScores = {
    judicial: breakdown?.judicial ?? null,
    google:   breakdown?.google   ?? null,
    legal:    breakdown?.legal    ?? (clinic.legal_score as number) ?? null,
    media:    breakdown?.media    ?? null,
    penalty:  breakdown?.penalty  ?? null,
    total:    clinic.score        ?? null,
  };

  const treatmentTags = clinic.treatments?.length ? clinic.treatments : clinic.specialty ? [clinic.specialty] : [];
  const doctors          = clinic.doctors          ?? [];
  const gallery          = clinic.gallery          ?? [];
  const portalTreatments = clinic.portal_treatments ?? [];
  const portalPromotions = clinic.portal_promotions ?? [];

  return (
    <div style={{ background: "#FAFAF8", minHeight: "100vh", paddingBottom: isPartner ? 80 : 0 }}>

      {/* Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalOrganization",
            name: clinic.name,
            address: { "@type": "PostalAddress", streetAddress: clinic.address, addressCountry: "TW" },
            telephone: clinic.phone || undefined,
            url: clinic.website || undefined,
            aggregateRating: clinic.google_rating ? {
              "@type": "AggregateRating",
              ratingValue: clinic.google_rating,
              reviewCount: reviewCount,
              bestRating: 5, worstRating: 1,
            } : undefined,
            medicalSpecialty: clinic.specialty || undefined,
          }),
        }}
      />

      {/* ── 合作診所 Hero Banner ── */}
      {isPartner && (
        <div style={{ background: "linear-gradient(to right,#FFFBEB,#FEF9C3)", borderBottom: "1px solid #F6E05E", padding: "14px 24px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#D69E2E", background: "#FEF3C7", border: "1px solid #F6AD55", borderRadius: 99, padding: "2px 10px" }}>
                ✦ 合作診所
              </span>
              <span style={{ fontSize: 13, color: "#92400E" }}>此診所已加入 360醫療AI大調查合作計畫，資料更完整</span>
            </div>
            <a
              href={lineOaUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ flexShrink: 0, padding: "8px 20px", background: "#06C755", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none", boxShadow: "0 2px 8px rgba(6,199,85,.3)" }}
            >
              立即預約諮詢
            </a>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 48px" }}>

        {/* ── Breadcrumb ── */}
        <nav style={{ fontSize: 12, color: "#718096", marginBottom: 20 }}>
          <Link href="/" style={{ color: "#718096", textDecoration: "none" }}>首頁</Link>
          <span style={{ margin: "0 6px" }}>/</span>
          <Link href="/clinics" style={{ color: "#718096", textDecoration: "none" }}>全台診所資料館</Link>
          {city && (
            <>
              <span style={{ margin: "0 6px" }}>/</span>
              <Link href={`/clinics?city=${encodeURIComponent(city)}`} style={{ color: "#718096", textDecoration: "none" }}>{city}</Link>
            </>
          )}
          <span style={{ margin: "0 6px" }}>/</span>
          <span style={{ color: "#1A202C" }}>{clinic.name}</span>
        </nav>

        {/* ── 三欄 Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "190px 1fr 210px", gap: 20, alignItems: "flex-start" }}>

          {/* ════════════════ 左側篩選 Sidebar（190px）════════════════ */}
          <aside style={{ position: "sticky", top: 76, display: "flex", flexDirection: "column", gap: 12 }}>

            {/* 回列表 */}
            <Link
              href="/clinics"
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 13, color: "#2B6CB0", fontWeight: 600, textDecoration: "none" }}
            >
              ← 全台診所資料館
            </Link>

            {/* 縣市篩選 */}
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "10px 12px", borderBottom: "1px solid #E2E8F0", fontSize: 12, fontWeight: 700, color: "#4A5568", letterSpacing: "0.5px" }}>
                縣市篩選
              </div>
              <div style={{ padding: "6px 0" }}>
                {CITY_LIST.map((c) => (
                  <Link
                    key={c}
                    href={`/clinics?city=${encodeURIComponent(c)}`}
                    style={{
                      display: "block", padding: "6px 12px",
                      fontSize: 13, textDecoration: "none",
                      color: city === c ? "#2B6CB0" : "#4A5568",
                      fontWeight: city === c ? 700 : 400,
                      background: city === c ? "#EBF8FF" : "transparent",
                    }}
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>

            {/* 療程分類 */}
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "10px 12px", borderBottom: "1px solid #E2E8F0", fontSize: 12, fontWeight: 700, color: "#4A5568", letterSpacing: "0.5px" }}>
                療程分類
              </div>
              <div style={{ padding: "6px 0" }}>
                {TREATMENT_FILTERS.map((t) => (
                  <Link
                    key={t.href}
                    href={t.href}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", fontSize: 12, color: "#4A5568", textDecoration: "none" }}
                  >
                    <span style={{ fontSize: 14 }}>{t.icon}</span>
                    <span>{t.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* ════════════════ 主內容 ════════════════ */}
          <main style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* ── Hero 診所資訊卡 ── */}
            <div style={{
              background: "#fff",
              border: isPartner ? "1px solid #F6AD55" : "1px solid #E2E8F0",
              borderRadius: 12, padding: 24,
              boxShadow: isPartner ? "0 0 0 3px rgba(246,173,85,.1)" : "0 2px 8px rgba(0,0,0,.04)",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
                <div style={{
                  width: 56, height: 56, flexShrink: 0, borderRadius: 12,
                  background: isPartner ? "#FFFBEB" : "#EBF8FF",
                  border: isPartner ? "1px solid #F6AD55" : "1px solid #BEE3F8",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
                }}>
                  🏥
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A202C", margin: 0 }}>{clinic.name}</h1>
                    {isPartner && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#D69E2E", background: "#FEF3C7", border: "1px solid #F6AD55", borderRadius: 99, padding: "2px 8px" }}>
                        ✦ 合作診所
                      </span>
                    )}
                  </div>
                  {clinic.specialty && <p style={{ fontSize: 13, color: "#718096", margin: 0 }}>{clinic.specialty}</p>}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {clinic.address && <div style={{ fontSize: 13, color: "#4A5568" }}>📍 {clinic.address}</div>}
                {clinic.phone && <div style={{ fontSize: 13, color: "#4A5568" }}>📞 {clinic.phone}</div>}
                {clinic.cont_start && (
                  <div style={{ fontSize: 13, color: "#4A5568" }}>🏥 健保特約：{formatContStart(clinic.cont_start)}</div>
                )}
                {clinic.website && (
                  <a href={clinic.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#2B6CB0", textDecoration: "none" }}>
                    🌐 官方網站 →
                  </a>
                )}
              </div>
            </div>

            {/* ── 療程項目（合作診所）── */}
            {isPartner && (
              <section>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A202C", marginBottom: 14 }}>療程項目</h2>
                {portalTreatments.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {portalTreatments.map((t) => (
                      <div key={t.id} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 16 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", margin: "0 0 6px" }}>{t.name}</p>
                        {t.description && <p style={{ fontSize: 12, color: "#718096", margin: "0 0 8px", lineHeight: 1.6 }}>{t.description}</p>}
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#2B6CB0" }}>{formatPrice(t)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ border: "1px dashed #CBD5E0", borderRadius: 10, padding: "28px 20px", textAlign: "center", color: "#A0AEC0" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>💉</div>
                    <p style={{ fontSize: 13, margin: 0 }}>尚未上傳療程項目</p>
                    <p style={{ fontSize: 12, margin: "4px 0 0", color: "#CBD5E0" }}>請至診所後台 → 療程管理 新增</p>
                  </div>
                )}
              </section>
            )}

            {/* ── 限時優惠方案（合作診所）── */}
            {isPartner && (
              <section>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A202C", marginBottom: 14 }}>限時優惠方案</h2>
                {portalPromotions.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
                    {portalPromotions.map((p) => (
                      <div key={p.id} style={{ background: "#FFFBEB", border: "1px solid #F6AD55", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", margin: 0 }}>{p.title}</p>
                        {p.price_label && <p style={{ fontSize: 15, fontWeight: 700, color: "#D69E2E", margin: 0 }}>{p.price_label}</p>}
                        {p.description && <p style={{ fontSize: 12, color: "#718096", margin: 0, lineHeight: 1.6 }}>{p.description}</p>}
                        {p.expires_at && <p style={{ fontSize: 11, color: "#A0AEC0", margin: 0 }}>有效期至 {p.expires_at}</p>}
                        <a
                          href={lineOaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginTop: 4, display: "inline-block", padding: "6px 14px", background: "#06C755", color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: "none", alignSelf: "flex-start" }}
                        >
                          預約此方案
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ border: "1px dashed #F6AD55", borderRadius: 10, padding: "28px 20px", textAlign: "center", color: "#A0AEC0", background: "#FFFBEB" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🎁</div>
                    <p style={{ fontSize: 13, margin: 0 }}>尚未上傳優惠方案</p>
                    <p style={{ fontSize: 12, margin: "4px 0 0", color: "#F6AD55" }}>請至診所後台 → 優惠管理 新增</p>
                  </div>
                )}
              </section>
            )}

            {/* ── 醫師團隊（合作診所）── */}
            {isPartner && (
              <section>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A202C", marginBottom: 14 }}>醫師團隊</h2>
                {doctors.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {doctors.map((d, i) => (
                      <div key={d.id || i} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                        {d.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={d.photo_url} alt={d.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} loading="lazy" />
                        ) : (
                          <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: "50%", background: "#EBF8FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                            👨‍⚕️
                          </div>
                        )}
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", margin: "0 0 2px" }}>{d.name}</p>
                          {d.title && <p style={{ fontSize: 12, color: "#718096", margin: "0 0 2px" }}>{d.title}</p>}
                          {d.specialty && <p style={{ fontSize: 12, color: "#2B6CB0", margin: 0 }}>{d.specialty}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ border: "1px dashed #CBD5E0", borderRadius: 10, padding: "28px 20px", textAlign: "center", color: "#A0AEC0" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>👨‍⚕️</div>
                    <p style={{ fontSize: 13, margin: 0 }}>尚未上傳醫師資料</p>
                    <p style={{ fontSize: 12, margin: "4px 0 0", color: "#CBD5E0" }}>請至診所後台 → 醫師管理 新增</p>
                  </div>
                )}
              </section>
            )}

            {/* ── 相片專區（合作診所）── */}
            {isPartner && (
              <section>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A202C", marginBottom: 14 }}>相片專區</h2>
                {gallery.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                    {gallery.map((g, i) => (
                      <div key={g.id || i} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #E2E8F0", aspectRatio: "1", position: "relative" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={g.url}
                          alt={g.caption || `診所照片 ${i + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ border: "1px dashed #CBD5E0", borderRadius: 10, padding: "28px 20px", textAlign: "center", color: "#A0AEC0" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📸</div>
                    <p style={{ fontSize: 13, margin: 0 }}>尚未上傳診所相片</p>
                    <p style={{ fontSize: 12, margin: "4px 0 0", color: "#CBD5E0" }}>請至診所後台 → 相片管理 新增</p>
                  </div>
                )}
              </section>
            )}

            {/* ── 360 綜合評分 ── */}
            <section>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A202C", marginBottom: 14 }}>360 綜合評分</h2>
              {clinic.google_rating != null && (
                <p style={{ fontSize: 13, color: "#718096", marginBottom: 12 }}>
                  Google 評分 {clinic.google_rating.toFixed(1)} · {reviewCount.toLocaleString("zh-TW")} 則評論
                </p>
              )}
              <ScoreCard scores={scores} showTotal={true} />
            </section>

            {/* ── 稽查違規紀錄（第 4 維度）── */}
            <PenaltiesSection clinicId={clinic.id} />

            {/* ── 媒體口碑（第 5 維度，已合併「網路媒體 + 社群」為單一口碑維度）── */}
            <MentionsSection clinicId={clinic.id} sourceType="news" title="媒體口碑" />

            {/* ── 聲譽趨勢圖（基於 reputation_scores 快照）── */}
            <ReputationTrendChart clinicId={clinic.id} />

            {/* ── 霧化完整報告 ── */}
            <section>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A202C", marginBottom: 14 }}>完整報告（司法／申訴／負評彙整）</h2>
              <FogReport
                subtitle="解鎖後可查看判決書案號、申訴進度與完整負評分析"
                lineEntry={{ type: "clinic", id: clinic.id, name: clinic.name }}
              >
                <FakeFogContent clinicName={clinic.name} />
              </FogReport>
            </section>

            {/* ── 消費者評論 ── */}
            {clinic.google_rating != null && (
              <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A202C", marginBottom: 16 }}>消費者評論</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 36, fontWeight: 700, color: "#2B6CB0" }}>{clinic.google_rating.toFixed(1)}</div>
                    <div style={{ fontSize: 12, color: "#718096" }}>Google 評分</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "#4A5568", marginBottom: 10 }}>
                      共 <strong>{reviewCount.toLocaleString("zh-TW")}</strong> 則 Google 評論
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 13, color: "#2B6CB0", textDecoration: "none", border: "1px solid #BEE3F8", borderRadius: 6, padding: "6px 14px", display: "inline-block" }}
                    >
                      查看 Google Maps 完整評論 →
                    </a>
                  </div>
                </div>
                <ClinicReviewsList clinicId={clinic.id} limit={isPartner ? 6 : 3} />
                <p style={{ fontSize: 12, color: "#A0AEC0", borderTop: "1px solid #E2E8F0", paddingTop: 12, marginTop: 16 }}>
                  評論內容由 Google Maps 用戶提供，360醫療AI大調查不對評論內容負責。
                </p>
              </section>
            )}

            {/* ── 非合作診所升級 CTA ── */}
            {!isPartner && (
              <div style={{ background: "#EBF8FF", border: "1px dashed #2B6CB0", borderRadius: 12, padding: 24, textAlign: "center" }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#1A202C", marginBottom: 8 }}>想讓診所頁面更完整？</p>
                <p style={{ fontSize: 13, color: "#718096", marginBottom: 20 }}>
                  加入合作計畫，展示療程項目、優惠方案、醫師團隊與診所環境，讓患者更了解您
                </p>
                <Link
                  href="/partnership"
                  style={{ padding: "10px 28px", background: "#2B6CB0", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none" }}
                >
                  了解合作方案 →
                </Link>
              </div>
            )}
          </main>

          {/* ════════════════ 右側 Action Sidebar（210px）════════════════ */}
          <aside style={{ position: "sticky", top: 76 }}>
            <div style={{
              background: "#fff",
              border: isPartner ? "1px solid #F6AD55" : "1px solid #E2E8F0",
              borderRadius: 12, padding: 20,
              boxShadow: isPartner ? "0 0 0 3px rgba(246,173,85,.08)" : "0 2px 8px rgba(0,0,0,.04)",
            }}>
              {isPartner && (
                <div style={{ background: "#FEF3C7", border: "1px solid #F6AD55", borderRadius: 6, padding: "6px 10px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#D69E2E", marginBottom: 16 }}>
                  ✦ 合作診所
                </div>
              )}

              {/* 評分概覽 */}
              {clinic.score != null && (
                <div style={{ textAlign: "center", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: "#2B6CB0" }}>{clinic.score.toFixed(1)}</div>
                  <div style={{ fontSize: 11, color: "#718096" }}>360 綜合評分</div>
                </div>
              )}

              {/* Google 評分 */}
              {clinic.google_rating != null && (
                <div style={{ textAlign: "center", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#F6AD55" }}>★ {clinic.google_rating.toFixed(1)}</div>
                  <div style={{ fontSize: 11, color: "#718096" }}>{reviewCount.toLocaleString("zh-TW")} 則評論</div>
                </div>
              )}

              {/* 療程標籤 */}
              {treatmentTags.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#4A5568", marginBottom: 8 }}>療程標籤</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {treatmentTags.slice(0, 6).map((tag) => (
                      <Link
                        key={tag}
                        href={`/promotions?q=${encodeURIComponent(tag)}`}
                        style={{ fontSize: 11, color: "#2B6CB0", background: "#EBF8FF", borderRadius: 99, padding: "2px 8px", textDecoration: "none" }}
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 主要 CTA */}
              <a
                href={lineOaUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block", width: "100%", boxSizing: "border-box",
                  padding: "11px 0", textAlign: "center", borderRadius: 8,
                  fontSize: 14, fontWeight: 700, color: "#fff", textDecoration: "none",
                  background: isPartner ? "#06C755" : "#2B6CB0",
                  boxShadow: isPartner ? "0 2px 8px rgba(6,199,85,.3)" : "0 2px 8px rgba(43,108,176,.3)",
                }}
              >
                {isPartner ? "立即預約諮詢" : "加 LINE 免費諮詢"}
              </a>

              {/* Google Maps */}
              <div style={{ marginTop: 12, textAlign: "center" }}>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "#718096", textDecoration: "none" }}
                >
                  📍 在 Google Maps 查看
                </a>
              </div>
            </div>
          </aside>

        </div>
      </div>

      {/* ── 合作診所固定底部 CTA ── */}
      {isPartner && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: "#fff", borderTop: "1px solid #F6AD55", padding: "12px 24px", boxShadow: "0 -4px 16px rgba(0,0,0,.08)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#1A202C", margin: "0 0 2px" }}>{clinic.name}</p>
              <p style={{ fontSize: 12, color: "#718096", margin: 0 }}>透過 LINE OA 預約諮詢</p>
            </div>
            <a
              href={lineOaUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ flexShrink: 0, padding: "10px 28px", background: "#06C755", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none", boxShadow: "0 2px 8px rgba(6,199,85,.3)" }}
            >
              立即預約諮詢
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
