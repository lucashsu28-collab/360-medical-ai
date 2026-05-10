"use client";
import { useState } from "react";
import Link from "next/link";

interface Feature { title: string; desc: string; }
interface SignatureTreatment { title: string; tagline?: string; desc?: string; price?: string; badge?: string; image?: string; }
interface Director { name: string; title?: string; years?: number | string; desc?: string; photo?: string; }
interface BeforeAfter { treatment: string; duration?: string; note?: string; face?: string; face_image?: string; }
interface DoctorPick { title: string; target?: string; items?: string[]; doctor_note?: string; doctorNote?: string; price_from?: string; priceFrom?: string; image?: string; }
interface TreatmentFull { name: string; price?: string; desc?: string; image?: string; }
interface Testimonial { name: string; initial?: string; text: string; rating?: number; treatment?: string; }
interface MediaReport { outlet: string; title: string; date?: string; tier?: string; url?: string; }

export interface BrandPageData {
  hero_image_url?: string | null;
  slogan?: string | null;
  subtitle?: string | null;
  features?: Feature[];
  signature_treatments?: SignatureTreatment[];
  director?: Director | null;
  before_after?: BeforeAfter[];
  doctor_picks?: DoctorPick[];
  treatments_full?: TreatmentFull[];
  testimonials?: Testimonial[];
  media_reports?: MediaReport[];
}

export interface PartnerBrandViewProps {
  clinic: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    score?: number | null;
    google_rating?: number | null;
    google_review_count?: number | null;
    line_oa_url?: string | null;
  };
  brand: BrandPageData;
}

const ACCENT = ["#B45309", "#991B1B", "#7E22CE", "#0E7490"];

export default function PartnerBrandView({ clinic, brand }: PartnerBrandViewProps) {
  const [tab, setTab] = useState<"treatment" | "promo" | "doctor" | "gallery" | "media" | "reviews">("treatment");

  const lineOaUrl = clinic.line_oa_url || "https://lin.ee/6sTCRzm";
  const heroImg = brand.hero_image_url || "https://images.unsplash.com/photo-1559185590-765cdc663325?w=1800&q=80";
  const features = brand.features || [];
  const sigs = brand.signature_treatments || [];
  const director = brand.director;
  const ba = brand.before_after || [];
  const picks = brand.doctor_picks || [];
  const treatments = brand.treatments_full || [];
  const testimonials = brand.testimonials || [];
  const mediaReports = brand.media_reports || [];

  return (
    <div style={{ background: "#fff" }}>
      {/* 1. Hero */}
      <div style={{ position: "relative", height: 520, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImg} alt={clinic.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(180,83,9,.55) 0%, rgba(217,119,6,.4) 50%, rgba(0,0,0,.55) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,.5) 100%)" }} />

        <div style={{ position: "absolute", top: 32, left: 0, right: 0, padding: "0 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(255,255,255,.95)", color: "#B45309", borderRadius: 99, fontSize: 12, fontWeight: 700, marginBottom: 16, boxShadow: "0 4px 14px rgba(0,0,0,.1)" }}>
              ✦ 360 AI 認證合作診所
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, padding: "0 24px", color: "#fff" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            {brand.subtitle && <div style={{ fontSize: 14, marginBottom: 8, opacity: 0.92, letterSpacing: "0.05em" }}>{brand.subtitle}</div>}
            <h1 style={{ fontSize: 56, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em", textShadow: "0 4px 20px rgba(0,0,0,.25)", lineHeight: 1.1 }}>
              {clinic.name}
            </h1>
            {brand.slogan && <div style={{ fontSize: 22, fontWeight: 400, marginBottom: 28, opacity: 0.95, textShadow: "0 2px 8px rgba(0,0,0,.2)" }}>{brand.slogan}</div>}
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <a href={lineOaUrl} target="_blank" rel="noopener noreferrer"
                style={{ padding: "14px 32px", background: "#06C755", color: "#fff", border: 0, borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 20px rgba(6,199,85,.5)", display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                💬 立即預約諮詢
              </a>
              {clinic.phone && (
                <a href={`tel:${clinic.phone}`}
                  style={{ padding: "14px 26px", background: "rgba(255,255,255,.18)", color: "#fff", border: "1.5px solid rgba(255,255,255,.4)", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(10px)", textDecoration: "none" }}>
                  📞 撥打電話
                </a>
              )}
              {(clinic.score != null || clinic.google_rating != null) && (
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, padding: "10px 18px", background: "rgba(255,255,255,.95)", borderRadius: 12, color: "#1A202C", boxShadow: "0 4px 14px rgba(0,0,0,.1)" }}>
                  {clinic.score != null && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#B45309", lineHeight: 1 }}>{Math.round(clinic.score)}</div>
                      <div style={{ fontSize: 9, color: "#64748B" }}>360 評分</div>
                    </div>
                  )}
                  {clinic.score != null && clinic.google_rating != null && <div style={{ width: 1, height: 30, background: "#E2E8F0" }} />}
                  {clinic.google_rating != null && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#F59E0B", lineHeight: 1 }}>★ {clinic.google_rating.toFixed(1)}</div>
                      <div style={{ fontSize: 9, color: "#64748B" }}>{(clinic.google_review_count ?? 0).toLocaleString()} 評論</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. 360 評鑑（白底） */}
      <div style={{ padding: "44px 24px", background: "#fff", borderBottom: "1px solid #F1F5F9" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "#D97706", marginBottom: 4, letterSpacing: "0.15em", fontWeight: 600 }}>VERIFIED BY 360 AI</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#1A202C" }}>360 醫美 AI 第三方評鑑</h3>
            </div>
            <Link href="/rules/reputation" style={{ fontSize: 12, color: "#B45309", textDecoration: "none", fontWeight: 600 }}>查看評分規則 →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {[
              { label: "司法糾紛", icon: "⚖️" },
              { label: "Google 評分", icon: "📍" },
              { label: "合法登記", icon: "🏛️" },
              { label: "稽查違規", icon: "⚠️" },
              { label: "媒體口碑", icon: "📰" },
            ].map((d, i) => (
              <div key={i} style={{ textAlign: "center", padding: 16, background: "#FFFBEB", borderRadius: 10, border: "1px solid #FED7AA" }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{d.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#B45309", lineHeight: 1 }}>—</div>
                <div style={{ fontSize: 9, color: "#A0AEC0", marginTop: 4 }}>/ 20 分</div>
                <div style={{ fontSize: 11, color: "#1A202C", marginTop: 8, fontWeight: 600 }}>{d.label}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "#A0AEC0", marginTop: 12, textAlign: "center" }}>
            ⓘ 五維度評鑑分數依資料更新自動計算，詳見診所原本資料頁
          </p>
        </div>
      </div>

      {/* 3. 5 大特色亮點 */}
      {features.length > 0 && (
        <div style={{ background: "linear-gradient(180deg, #FFFBEB 0%, #FEF3C7 100%)", padding: "44px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: "#D97706", letterSpacing: "0.2em", marginBottom: 6, fontWeight: 600 }}>WHY US</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1A202C", margin: 0 }}>本院特色</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(features.length, 5)}, 1fr)`, gap: 14 }}>
              {features.slice(0, 5).map((f, i) => (
                <div key={i} style={{ background: "#fff", padding: "22px 16px", borderRadius: 12, border: "1px solid #FED7AA", boxShadow: "0 2px 8px rgba(245,158,11,.06)", textAlign: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, margin: "0 auto 12px", background: "linear-gradient(135deg, #FBBF24, #D97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#fff" }}>✨</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", marginBottom: 6 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. 熱門精選療程（4 卡 2x2） */}
      {sigs.length > 0 && (
        <div style={{ padding: "60px 24px", background: "#fff" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontSize: 12, color: "#D97706", letterSpacing: "0.2em", marginBottom: 8, fontWeight: 600 }}>POPULAR TREATMENTS</div>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: "#1A202C", margin: 0, letterSpacing: "-0.01em" }}>熱門精選療程</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {sigs.slice(0, 4).map((t, i) => (
                <div key={i} style={{ position: "relative", borderRadius: 16, overflow: "hidden", aspectRatio: "4/3", background: "#1A202C" }}>
                  {t.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.image} alt={t.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  {t.badge && (
                    <div style={{ position: "absolute", top: 14, right: 14, padding: "4px 12px", background: "rgba(255,255,255,.95)", color: ACCENT[i % 4], borderRadius: 99, fontSize: 11, fontWeight: 700, zIndex: 2 }}>
                      {t.badge}
                    </div>
                  )}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 25%, rgba(0,0,0,.78) 100%)" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 22, color: "#fff" }}>
                    {t.tagline && <div style={{ fontSize: 12, opacity: 0.88, marginBottom: 4, letterSpacing: "0.05em" }}>{t.tagline}</div>}
                    <h3 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", textShadow: "0 2px 8px rgba(0,0,0,.3)" }}>{t.title}</h3>
                    {t.desc && <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 12, lineHeight: 1.6 }}>{t.desc}</div>}
                    {t.price && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{t.price}</div>
                        <a href={lineOaUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 14px", background: "#fff", color: "#1A202C", border: 0, borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                          了解更多 →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. 院長橫幅 */}
      {director && (
        <div style={{ padding: "60px 24px", background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "320px 1fr", gap: 48, alignItems: "center" }}>
            <div style={{ aspectRatio: "1", borderRadius: 20, overflow: "hidden", boxShadow: "0 12px 40px rgba(245,158,11,.3)", position: "relative" }}>
              {director.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={director.photo} alt={director.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              )}
              {director.years && (
                <div style={{ position: "absolute", bottom: -12, left: "50%", transform: "translateX(-50%)", padding: "6px 16px", background: "#1A202C", color: "#FBBF24", borderRadius: 99, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(0,0,0,.2)" }}>
                  {director.years} 年資歷
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#D97706", letterSpacing: "0.2em", marginBottom: 8, fontWeight: 600 }}>OUR DIRECTOR</div>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: "#1A202C", margin: "0 0 6px", letterSpacing: "-0.01em" }}>{director.name}</h2>
              {director.title && <div style={{ fontSize: 15, color: "#92400E", marginBottom: 18, fontWeight: 600 }}>{director.title}</div>}
              {director.desc && <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.85, margin: 0 }}>{director.desc}</p>}
            </div>
          </div>
        </div>
      )}

      {/* 6. Before/After 4 卡 */}
      {ba.length > 0 && (
        <div style={{ padding: "60px 24px", background: "#fff" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontSize: 12, color: "#D97706", letterSpacing: "0.2em", marginBottom: 8, fontWeight: 600 }}>BEFORE / AFTER</div>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: "#1A202C", margin: 0, letterSpacing: "-0.01em" }}>顧客前後對照</h2>
              <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 10 }}>＊ 案例經顧客同意公開，個人差異效果不同</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(ba.length, 4)}, 1fr)`, gap: 14 }}>
              {ba.slice(0, 4).map((b, i) => {
                const face = b.face || b.face_image;
                return (
                  <div key={i} style={{ background: "#FFFBEB", borderRadius: 12, overflow: "hidden", border: "1px solid #FED7AA", boxShadow: "0 2px 8px rgba(245,158,11,.08)" }}>
                    <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#FED7AA" }}>
                      <div style={{ position: "relative", aspectRatio: "1", overflow: "hidden" }}>
                        {face && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={face} alt="Before" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "saturate(.55) brightness(.82) contrast(.92) sepia(.18)" }} />
                        )}
                        <div style={{ position: "absolute", top: 8, left: 8, padding: "3px 9px", background: "rgba(15,23,42,.82)", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 4 }}>BEFORE</div>
                      </div>
                      <div style={{ position: "relative", aspectRatio: "1", overflow: "hidden" }}>
                        {face && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={face} alt="After" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "saturate(1.05) brightness(1.05) contrast(1.02)" }} />
                        )}
                        <div style={{ position: "absolute", top: 8, left: 8, padding: "3px 9px", background: "#D97706", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 4 }}>AFTER</div>
                      </div>
                    </div>
                    <div style={{ padding: "14px 14px 16px" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", marginBottom: 4 }}>{b.treatment}</div>
                      {b.duration && <div style={{ fontSize: 11, color: "#92400E", marginBottom: 8, fontWeight: 600 }}>{b.duration}</div>}
                      {b.note && <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>{b.note}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 7. Tab 區 */}
      <div style={{ background: "#F8FAFC", borderTop: "1px solid #E2E8F0" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", gap: 0, overflowX: "auto" }}>
            {[
              { k: "treatment", label: "💉 完整療程列表" },
              { k: "promo", label: "🩺 院長推薦療程" },
              { k: "doctor", label: "👨‍⚕️ 醫師團隊" },
              { k: "gallery", label: "📸 環境相片" },
              { k: "media", label: "📰 媒體報導" },
              { k: "reviews", label: "💬 客戶好評" },
            ].map((t) => (
              <button key={t.k} onClick={() => setTab(t.k as any)}
                style={{ padding: "16px 22px", border: 0, background: "transparent", fontSize: 14, fontWeight: 600, cursor: "pointer", color: tab === t.k ? "#B45309" : "#64748B", borderBottom: tab === t.k ? "3px solid #F59E0B" : "3px solid transparent", marginBottom: -1, whiteSpace: "nowrap" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 48px" }}>
          {tab === "treatment" && (
            treatments.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                {treatments.map((t, i) => (
                  <div key={i} style={{ background: "#fff", border: "1px solid #FED7AA", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ aspectRatio: "1", overflow: "hidden", background: "#FED7AA" }}>
                      {t.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.image} alt={t.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      )}
                    </div>
                    <div style={{ padding: "14px 14px 16px" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1A202C", marginBottom: 4 }}>{t.name}</div>
                      {t.desc && <div style={{ fontSize: 12, color: "#64748B", marginBottom: 10, lineHeight: 1.5, minHeight: 36 }}>{t.desc}</div>}
                      {t.price && <div style={{ fontSize: 14, fontWeight: 700, color: "#B45309" }}>{t.price}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <Empty msg="尚未上架完整療程列表" />
          )}

          {tab === "promo" && (
            picks.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {picks.map((p, i) => {
                  const note = p.doctor_note || p.doctorNote;
                  const priceFrom = p.price_from || p.priceFrom;
                  return (
                    <div key={i} style={{ background: "#fff", border: "1px solid #FED7AA", borderRadius: 14, overflow: "hidden", display: "flex" }}>
                      {p.image && (
                        <div style={{ width: 160, flexShrink: 0, background: "#FED7AA" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        </div>
                      )}
                      <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ display: "inline-block", padding: "3px 9px", background: "#1A202C", color: "#FBBF24", fontSize: 10, fontWeight: 700, borderRadius: 4, marginBottom: 8 }}>🩺 院長推薦</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A202C", marginBottom: 4 }}>{p.title}</div>
                          {p.target && <div style={{ fontSize: 11, color: "#92400E", marginBottom: 8, fontWeight: 600 }}>{p.target}</div>}
                          {p.items && p.items.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                              {p.items.map((it, j) => (
                                <span key={j} style={{ fontSize: 10, padding: "2px 8px", background: "#FFFBEB", color: "#B45309", border: "1px solid #FED7AA", borderRadius: 99, fontWeight: 600 }}>{it}</span>
                              ))}
                            </div>
                          )}
                          {note && <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.6, fontStyle: "italic" }}>{note}</div>}
                        </div>
                        {priceFrom && <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: "#B45309" }}>{priceFrom}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <Empty msg="尚未上架院長推薦療程" />
          )}

          {tab === "doctor" && <Empty msg="醫師團隊資料維持原『合作診所管理 → 醫師』設定，將顯示在此" />}
          {tab === "gallery" && <Empty msg="環境相片維持原『合作診所管理 → 相片』設定" />}

          {tab === "media" && (
            mediaReports.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {mediaReports.map((m, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: "#fff", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                    {m.tier && (
                      <div style={{ flexShrink: 0, width: 60, padding: "6px 0", textAlign: "center", background: m.tier === "A" ? "#FEF3C7" : m.tier === "B" ? "#DBEAFE" : "#F3E8FF", color: m.tier === "A" ? "#92400E" : m.tier === "B" ? "#1E40AF" : "#6B21A8", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                        {m.tier} 級
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1A202C", marginBottom: 3 }}>{m.title}</div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>
                        <span style={{ color: "#B45309", fontWeight: 600 }}>{m.outlet}</span>
                        {m.date && <><span style={{ margin: "0 8px", color: "#CBD5E0" }}>·</span>{m.date}</>}
                      </div>
                    </div>
                    {m.url && (
                      <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, padding: "6px 14px", background: "#F1F5F9", color: "#475569", border: 0, borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                        閱讀全文 →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : <Empty msg="尚未上架媒體報導" />
          )}

          {tab === "reviews" && (
            testimonials.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {testimonials.map((t, i) => (
                  <div key={i} style={{ padding: 22, background: "#FFFBEB", borderRadius: 12, border: "1px solid #FED7AA" }}>
                    {(t.rating ?? 5) > 0 && <div style={{ fontSize: 18, color: "#F59E0B", marginBottom: 10 }}>{"★".repeat(t.rating ?? 5)}</div>}
                    <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.8, marginBottom: 14, minHeight: 56 }}>“{t.text}”</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px dashed #FED7AA" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FBBF24", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{t.initial || t.name.slice(0, 1)}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1A202C" }}>{t.name}</div>
                      </div>
                      {t.treatment && (
                        <div style={{ fontSize: 10, color: "#92400E", padding: "3px 8px", background: "#FEF3C7", borderRadius: 4, fontWeight: 600 }}>{t.treatment}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : <Empty msg="尚未上架客戶好評" />
          )}
        </div>
      </div>

      {/* 底部 sticky CTA */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,.98)", backdropFilter: "blur(10px)", borderTop: "1px solid #F59E0B", padding: "12px 24px", boxShadow: "0 -4px 16px rgba(0,0,0,.1)", zIndex: 99 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A202C" }}>{clinic.name}</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>透過 LINE OA 預約諮詢，享 360 認證保障</div>
          </div>
          <a href={lineOaUrl} target="_blank" rel="noopener noreferrer"
            style={{ padding: "12px 32px", background: "#06C755", color: "#fff", border: 0, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(6,199,85,.4)", textDecoration: "none" }}>
            💬 立即預約諮詢
          </a>
        </div>
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div style={{ padding: 40, textAlign: "center", border: "1px dashed #FED7AA", borderRadius: 10, color: "#A0AEC0", fontSize: 13 }}>
      {msg}
    </div>
  );
}
